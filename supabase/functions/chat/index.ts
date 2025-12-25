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
    const { messages, sessionId, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get relevant document chunks for RAG (if we have embeddings)
    let relevantContext = "";
    const userMessage = messages[messages.length - 1]?.content || "";
    
    // Try to find relevant chunks using keyword search (embeddings will be added later)
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content, metadata, document_id")
      .textSearch("content", userMessage.split(" ").slice(0, 5).join(" | "), {
        type: "plain",
        config: "english"
      })
      .limit(5);

    if (chunks && chunks.length > 0) {
      relevantContext = chunks.map((c: any) => c.content).join("\n\n---\n\n");
    }

    // Build system prompt with IC context
    const systemPrompt = `You are an expert Investment Committee (IC) preparation assistant. You help deal teams prepare for IC meetings by:
1. Analyzing past IC meetings and identifying common questions
2. Providing insights on what questions to expect based on deal characteristics
3. Helping IC members prepare thoughtful questions for new deals
4. Summarizing key concerns and discussion points from historical ICs

${context?.dealName ? `Current deal context: ${context.dealName}` : ""}
${context?.sector ? `Sector: ${context.sector}` : ""}

${relevantContext ? `
RELEVANT CONTEXT FROM PAST IC DOCUMENTS:
${relevantContext}

Use this context to provide specific, grounded answers. Cite the source when referencing past ICs.
` : ""}

Be concise, professional, and actionable. When suggesting questions, explain why they're relevant based on the deal characteristics or past IC patterns.`;

    // Get chat history from session if provided
    let fullMessages = [{ role: "system", content: systemPrompt }];
    
    if (sessionId) {
      const { data: history } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(20);

      if (history) {
        fullMessages = [
          { role: "system", content: systemPrompt },
          ...history.map((m: any) => ({ role: m.role, content: m.content })),
        ];
      }
    }

    // Add current messages
    fullMessages.push(...messages.filter((m: any) => m.role !== "system"));

    console.log("Calling Lovable AI with", fullMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
