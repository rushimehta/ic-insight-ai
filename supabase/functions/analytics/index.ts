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
    const { action, eventType, eventData, sessionId } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === "track") {
      // Track a usage event
      const { error } = await supabase
        .from("usage_analytics")
        .insert({
          event_type: eventType,
          event_data: eventData || {},
          session_id: sessionId || null,
        });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_insights") {
      // Get feedback insights for learning loop
      const { data: feedbackStats } = await supabase
        .from("feedback")
        .select("feedback_type, rating")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: topQuestions } = await supabase
        .from("question_patterns")
        .select("question_text, category, frequency, sectors")
        .order("frequency", { ascending: false })
        .limit(20);

      const { data: recentUsage } = await supabase
        .from("usage_analytics")
        .select("event_type, created_at")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      // Calculate feedback summary
      const ratedFeedback = feedbackStats?.filter((f: any) => f.rating) || [];
      const feedbackSummary = {
        total: feedbackStats?.length || 0,
        helpful: feedbackStats?.filter((f: any) => f.feedback_type === "helpful").length || 0,
        not_helpful: feedbackStats?.filter((f: any) => f.feedback_type === "not_helpful").length || 0,
        corrections: feedbackStats?.filter((f: any) => f.feedback_type === "correction").length || 0,
        avg_rating: ratedFeedback.length > 0 
          ? ratedFeedback.reduce((a: number, b: any) => a + b.rating, 0) / ratedFeedback.length 
          : 0,
      };

      // Calculate usage patterns
      const usageByType: Record<string, number> = {};
      recentUsage?.forEach((u: any) => {
        usageByType[u.event_type] = (usageByType[u.event_type] || 0) + 1;
      });

      return new Response(
        JSON.stringify({
          feedbackSummary,
          topQuestions,
          usageByType,
          learningSignals: {
            needsImprovement: feedbackSummary.not_helpful > feedbackSummary.helpful * 0.3,
            correctionRate: feedbackSummary.corrections / (feedbackSummary.total || 1),
            engagementTrend: recentUsage?.length || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analytics error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
