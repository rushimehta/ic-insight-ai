import { useState, useEffect } from "react";
import { Users, Briefcase, ChevronRight, Star, Clock, TrendingUp, Loader2, Target, Shield, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuestions } from "@/hooks/useQuestions";
import { useNavigate } from "react-router-dom";

type ViewMode = "deal-team" | "ic-members";

const difficultyFromScore = (score: number | null): "low" | "medium" | "high" => {
  if (!score || score < 0.33) return "low";
  if (score < 0.66) return "medium";
  return "high";
};

const difficultyColors = {
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

// PE-specific fallback questions for Deal Teams
const fallbackDealTeamQuestions = [
  { id: "1", question_text: "Walk through your LBO model assumptions — what entry multiple, leverage, and exit multiple are you underwriting, and what's the sensitivity around each?", category: "Returns", frequency: 94, importance_score: 0.95, asker_type: "deal_team" },
  { id: "2", question_text: "What is the quality of earnings adjustment and how confident are you in the normalized EBITDA? What addbacks are you including?", category: "Financial DD", frequency: 91, importance_score: 0.9, asker_type: "deal_team" },
  { id: "3", question_text: "What's the customer concentration, and how would the loss of the top 3 customers impact EBITDA? What's the retention/churn data?", category: "Revenue Quality", frequency: 87, importance_score: 0.85, asker_type: "deal_team" },
  { id: "4", question_text: "What's your value creation bridge? Break down how much comes from revenue growth, margin expansion, add-ons, and multiple expansion.", category: "Value Creation", frequency: 85, importance_score: 0.8, asker_type: "deal_team" },
  { id: "5", question_text: "How experienced is this management team at operating under PE ownership? What's the CEO's track record on M&A integration?", category: "Management", frequency: 82, importance_score: 0.75, asker_type: "deal_team" },
  { id: "6", question_text: "What's the competitive moat? If a well-funded competitor enters this space, what prevents margin erosion or customer defection?", category: "Competitive", frequency: 79, importance_score: 0.7, asker_type: "deal_team" },
  { id: "7", question_text: "Describe the add-on acquisition pipeline. What are target sizes, multiples, and integration timelines? How many have you identified?", category: "M&A Strategy", frequency: 76, importance_score: 0.7, asker_type: "deal_team" },
  { id: "8", question_text: "What's the leverage at close and the debt paydown trajectory? What happens to covenant compliance in a 15% revenue decline?", category: "Capital Structure", frequency: 74, importance_score: 0.65, asker_type: "deal_team" },
  { id: "9", question_text: "Who are the likely exit buyers and what multiples are they paying? Is there strategic interest or is this primarily a financial buyer exit?", category: "Exit Strategy", frequency: 71, importance_score: 0.6, asker_type: "deal_team" },
  { id: "10", question_text: "What regulatory or compliance risks exist? Are there any pending litigation, environmental liabilities, or licensing requirements?", category: "Risk / Legal", frequency: 68, importance_score: 0.5, asker_type: "deal_team" },
];

// PE-specific fallback questions for IC Members
const fallbackICMemberQuestions = [
  { id: "11", question_text: "What's the downside protection? In a recession scenario, what's the floor on EBITDA and can we still service the debt?", category: "Downside", frequency: 96, importance_score: 0.95, asker_type: "ic_member" },
  { id: "12", question_text: "Why is this business available at this price? What does the seller know that we don't? What's the seller's motivation?", category: "Deal Dynamics", frequency: 92, importance_score: 0.9, asker_type: "ic_member" },
  { id: "13", question_text: "How does this deal fit our fund strategy and sector allocation? Are we overweight in this sector already?", category: "Portfolio Fit", frequency: 88, importance_score: 0.85, asker_type: "ic_member" },
  { id: "14", question_text: "What's the key person risk? If the CEO leaves in Year 1, what happens to the business? Is there management depth?", category: "Management Risk", frequency: 85, importance_score: 0.8, asker_type: "ic_member" },
  { id: "15", question_text: "Have we done a thorough reference check on this management team? What did former employers, customers, and competitors say?", category: "Due Diligence", frequency: 82, importance_score: 0.75, asker_type: "ic_member" },
  { id: "16", question_text: "What secular headwinds or tailwinds affect this industry over the next 5 years? How cyclical is this business?", category: "Market", frequency: 79, importance_score: 0.7, asker_type: "ic_member" },
  { id: "17", question_text: "How proven is the add-on acquisition strategy in practice? Have comparable PE-backed platforms executed this successfully?", category: "M&A Execution", frequency: 76, importance_score: 0.65, asker_type: "ic_member" },
  { id: "18", question_text: "What's the technology risk? Is there a platform migration needed? How modern are the systems?", category: "Operations", frequency: 73, importance_score: 0.6, asker_type: "ic_member" },
  { id: "19", question_text: "What ESG and sustainability risks should we consider? Are there any labor, environmental, or governance concerns?", category: "ESG", frequency: 70, importance_score: 0.5, asker_type: "ic_member" },
  { id: "20", question_text: "What's our edge in this deal? Why will we win vs. other bidders, and why are we the right sponsor for this company?", category: "Competitive Advantage", frequency: 67, importance_score: 0.45, asker_type: "ic_member" },
];

export function QuestionPrep() {
  const [viewMode, setViewMode] = useState<ViewMode>("deal-team");
  const { questions: dbQuestions, isLoading, fetchQuestions } = useQuestions();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions(viewMode === "deal-team" ? "deal_team" : "ic_member");
  }, [viewMode]);

  const questions = dbQuestions.length > 0
    ? dbQuestions
    : (viewMode === "deal-team" ? fallbackDealTeamQuestions : fallbackICMemberQuestions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">IC Question Preparation</h2>
            <p className="text-muted-foreground">
              {viewMode === "deal-team"
                ? "Anticipate the questions your IC will ask — prepare stronger deal presentations"
                : "Key questions to challenge deal teams during investment committee reviews"}
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Button
          variant={viewMode === "deal-team" ? "glow" : "glass"}
          onClick={() => setViewMode("deal-team")}
          className="flex items-center gap-2"
        >
          <Briefcase className="w-4 h-4" />
          Deal Team Prep
        </Button>
        <Button
          variant={viewMode === "ic-members" ? "glow" : "glass"}
          onClick={() => setViewMode("ic-members")}
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          IC Member Questions
        </Button>
        <Button
          variant="glass"
          onClick={() => navigate("/chat")}
          className="flex items-center gap-2 ml-auto"
        >
          <MessageSquare className="w-4 h-4" />
          Ask AI for More
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Categories</p>
            <p className="font-semibold">{viewMode === "deal-team" ? "Returns & Revenue Quality" : "Downside & Deal Dynamics"}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Prep Time</p>
            <p className="font-semibold">{viewMode === "deal-team" ? "3-4 hours per IC" : "1-2 hours per deal"}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Better Prepared Deals</p>
            <p className="font-semibold">{viewMode === "deal-team" ? "2.3x higher approval rate" : "40% fewer deferrals"}</p>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="font-semibold">
            {viewMode === "deal-team" ? "Questions Your IC Will Likely Ask" : "Questions to Challenge the Deal Team"}
          </h3>
          <span className="text-xs text-muted-foreground">
            {dbQuestions.length > 0 ? `From ${questions.length} IC patterns` : "Based on PE IC best practices"}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          questions.map((question, index) => {
            const difficulty = difficultyFromScore(question.importance_score);
            return (
              <div
                key={question.id}
                className="glass glass-hover rounded-xl p-4 cursor-pointer group opacity-0 animate-fade-in"
                style={{ animationDelay: `${250 + index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      {question.question_text}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {question.category}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs capitalize", difficultyColors[difficulty])}>
                        {difficulty} difficulty
                      </Badge>
                      {question.frequency && (
                        <span className="text-xs text-muted-foreground">
                          Asked in {question.frequency}% of ICs
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
