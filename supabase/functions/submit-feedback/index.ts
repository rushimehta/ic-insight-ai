import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      messageId, 
      documentChunkId, 
      feedbackType, 
      rating, 
      comment, 
      correctionText,
      metadata 
    } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Submitting feedback:", { feedbackType, rating });

    // Insert feedback
    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert({
        message_id: messageId || null,
        document_chunk_id: documentChunkId || null,
        feedback_type: feedbackType,
        rating,
        comment,
        correction_text: correctionText,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting feedback:", error);
      throw error;
    }

    // Track analytics event
    await supabase
      .from("usage_analytics")
      .insert({
        event_type: "feedback_submitted",
        event_data: {
          feedback_type: feedbackType,
          rating,
          has_comment: !!comment,
          has_correction: !!correctionText,
        },
      });

    // If it's a correction, we could use this to improve future responses
    if (feedbackType === "correction" && correctionText) {
      console.log("Correction received:", correctionText.slice(0, 100));
      // Future: Use corrections to fine-tune or update knowledge base
    }

    return new Response(
      JSON.stringify({ success: true, feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("submit-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
