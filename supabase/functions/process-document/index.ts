import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple text chunking function
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

// Extract questions from text
function extractQuestions(text: string): string[] {
  const questionPattern = /[^.!?]*\?/g;
  const matches = text.match(questionPattern) || [];
  return matches.map(q => q.trim()).filter(q => q.length > 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, content, metadata } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Processing document:", documentId);

    // Update document status to processing
    await supabase
      .from("documents")
      .update({ status: "processing", content })
      .eq("id", documentId);

    // Chunk the document content
    const chunks = chunkText(content);
    console.log(`Created ${chunks.length} chunks`);

    // Insert chunks into database
    const chunkInserts = chunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: chunk,
      metadata: { 
        ...metadata,
        chunk_index: index,
        total_chunks: chunks.length 
      },
    }));

    const { error: chunkError } = await supabase
      .from("document_chunks")
      .insert(chunkInserts);

    if (chunkError) {
      console.error("Error inserting chunks:", chunkError);
      throw chunkError;
    }

    // Extract questions from the document
    const questions = extractQuestions(content);
    console.log(`Found ${questions.length} questions`);

    // Store question patterns
    for (const question of questions.slice(0, 20)) { // Limit to first 20 questions
      const { data: existing } = await supabase
        .from("question_patterns")
        .select("id, frequency")
        .eq("question_text", question)
        .maybeSingle();

      if (existing) {
        // Update frequency
        await supabase
          .from("question_patterns")
          .update({ frequency: existing.frequency + 1 })
          .eq("id", existing.id);
      } else {
        // Insert new pattern
        await supabase
          .from("question_patterns")
          .insert({
            question_text: question,
            category: metadata?.category || "general",
            asker_type: metadata?.asker_type || "both",
            sectors: metadata?.sector ? [metadata.sector] : [],
            example_context: content.slice(0, 500),
          });
      }
    }

    // Update document status to completed
    await supabase
      .from("documents")
      .update({ status: "completed" })
      .eq("id", documentId);

    console.log("Document processing completed");

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunks: chunks.length,
        questions: questions.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
