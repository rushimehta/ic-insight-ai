import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IC_DOCUMENT_TEMPLATE = `
# Investment Committee Memorandum

## Deal Overview
**Company:** {deal_name}
**Sector:** {sector}
**IC Date:** {ic_date}

---

## Executive Summary
{executive_summary}

---

## Investment Thesis
{investment_thesis}

---

## Company Overview
{company_overview}

---

## Market Analysis
{market_analysis}

---

## Financial Highlights
{financial_highlights}

---

## Key Risks & Mitigants
{key_risks}

---

## Deal Terms & Structure
{deal_terms}

---

## Recommendation
{recommendation}
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, draftId, data } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === "generate_document") {
      // Fetch the draft
      const { data: draft, error: draftError } = await supabase
        .from("ic_drafts")
        .select("*")
        .eq("id", draftId)
        .single();

      if (draftError || !draft) {
        throw new Error("Draft not found");
      }

      // Update status to generating
      await supabase
        .from("ic_drafts")
        .update({ status: "generating" })
        .eq("id", draftId);

      // Fetch similar past IC documents for context
      const { data: pastDocs } = await supabase
        .from("documents")
        .select("content")
        .eq("sector", draft.sector)
        .limit(3);

      const pastContext = pastDocs?.map((d: any) => d.content?.slice(0, 2000)).join("\n---\n") || "";

      // Generate the IC document using AI
      const prompt = `You are an expert private equity investment professional. Generate a polished, professional Investment Committee memorandum based on the following inputs. Use formal, precise language suitable for a mid to large tier PE firm.

DEAL INFORMATION:
- Deal Name: ${draft.deal_name}
- Sector: ${draft.sector}
- Target IC Date: ${draft.ic_date || "TBD"}

RAW NOTES & DRAFTS:
${draft.raw_notes || "No raw notes provided"}

INVESTMENT THESIS (if provided):
${draft.investment_thesis || "Please develop based on available information"}

COMPANY OVERVIEW (if provided):
${draft.company_overview || "Please develop based on available information"}

MARKET ANALYSIS (if provided):
${draft.market_analysis || "Please develop based on available information"}

FINANCIAL HIGHLIGHTS (if provided):
${draft.financial_highlights || "Please develop based on available information"}

KEY RISKS (if provided):
${draft.key_risks || "Please develop based on available information"}

DEAL TERMS (if provided):
${draft.deal_terms || "Please develop based on available information"}

${pastContext ? `CONTEXT FROM SIMILAR PAST IC DOCUMENTS:\n${pastContext}` : ""}

Generate a comprehensive, well-structured IC memorandum that:
1. Follows best practices for PE investment memos
2. Is clear, concise, and actionable
3. Highlights key investment merits and risks
4. Provides a clear recommendation
5. Uses professional formatting with clear sections

Format the output in clean Markdown.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an expert private equity investment professional specializing in creating compelling IC memoranda." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI generation error:", errorText);
        throw new Error("Failed to generate document");
      }

      const aiResponse = await response.json();
      const generatedDocument = aiResponse.choices[0]?.message?.content || "";

      // Update the draft with generated document
      await supabase
        .from("ic_drafts")
        .update({ 
          generated_document: generatedDocument,
          status: "review"
        })
        .eq("id", draftId);

      return new Response(
        JSON.stringify({ success: true, document: generatedDocument }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "generate_meeting_notes") {
      const { meetingId, rawNotes, dealName, meetingDate, attendees } = data;

      // Fetch past meeting notes for context
      const { data: pastNotes } = await supabase
        .from("meeting_notes")
        .select("discussion_points, key_concerns, action_items, decision")
        .order("meeting_date", { ascending: false })
        .limit(5);

      const pastContext = pastNotes?.map((n: any) => 
        `Discussion: ${JSON.stringify(n.discussion_points)}\nConcerns: ${JSON.stringify(n.key_concerns)}\nDecision: ${n.decision}`
      ).join("\n---\n") || "";

      const prompt = `You are an Investment Committee Chairman at a leading private equity firm. Generate structured meeting notes and takeaways based on the raw meeting notes provided.

MEETING INFORMATION:
- Deal: ${dealName}
- Date: ${meetingDate}
- Attendees: ${JSON.stringify(attendees)}

RAW MEETING NOTES:
${rawNotes}

${pastContext ? `CONTEXT FROM PAST IC MEETINGS:\n${pastContext}` : ""}

Generate a structured summary including:
1. Key Discussion Points (as a JSON array of strings)
2. Key Concerns Raised (as a JSON array of objects with "concern" and "raised_by" fields)
3. Action Items (as a JSON array of objects with "item", "owner", and "due_date" fields)
4. Decision (approved/rejected/deferred/needs_more_info)
5. Decision Rationale (brief explanation)
6. Next Steps (paragraph)
7. AI Generated Summary (2-3 paragraph executive summary)

Return the response as a valid JSON object with these exact keys:
{
  "discussion_points": [],
  "key_concerns": [],
  "action_items": [],
  "decision": "",
  "decision_rationale": "",
  "next_steps": "",
  "ai_generated_summary": ""
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an expert IC Chairman. Always respond with valid JSON." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI generation error:", errorText);
        throw new Error("Failed to generate meeting notes");
      }

      const aiResponse = await response.json();
      let generatedNotes;
      
      try {
        const content = aiResponse.choices[0]?.message?.content || "{}";
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        generatedNotes = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        generatedNotes = {
          discussion_points: [],
          key_concerns: [],
          action_items: [],
          decision: "needs_more_info",
          decision_rationale: "Unable to parse meeting notes",
          next_steps: "",
          ai_generated_summary: aiResponse.choices[0]?.message?.content || ""
        };
      }

      // Update or create meeting notes
      if (meetingId) {
        await supabase
          .from("meeting_notes")
          .update({
            discussion_points: generatedNotes.discussion_points,
            key_concerns: generatedNotes.key_concerns,
            action_items: generatedNotes.action_items,
            decision: generatedNotes.decision,
            decision_rationale: generatedNotes.decision_rationale,
            next_steps: generatedNotes.next_steps,
            ai_generated_summary: generatedNotes.ai_generated_summary,
            status: "completed"
          })
          .eq("id", meetingId);
      }

      return new Response(
        JSON.stringify({ success: true, notes: generatedNotes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (e) {
    console.error("generate-ic-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
