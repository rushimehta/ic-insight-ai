import { useState } from "react";
import { Users, Briefcase, ChevronRight, Star, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ViewMode = "deal-team" | "ic-members";

interface Question {
  id: string;
  text: string;
  category: string;
  frequency: number;
  lastAsked: string;
  difficulty: "low" | "medium" | "high";
}

const dealTeamQuestions: Question[] = [
  { id: "1", text: "How did you arrive at the valuation, and what comparable transactions support this?", category: "Valuation", frequency: 89, lastAsked: "TechVentures IC", difficulty: "high" },
  { id: "2", text: "What is the customer concentration risk and how do you mitigate it?", category: "Risk", frequency: 76, lastAsked: "HealthCare Plus IC", difficulty: "medium" },
  { id: "3", text: "Walk us through the management team's track record and capabilities.", category: "Management", frequency: 71, lastAsked: "GreenEnergy IC", difficulty: "medium" },
  { id: "4", text: "What are the key competitive advantages and barriers to entry?", category: "Market", frequency: 68, lastAsked: "FinTech IC", difficulty: "medium" },
  { id: "5", text: "Describe the exit strategy and potential acquirers.", category: "Exit", frequency: 62, lastAsked: "Real Estate IC", difficulty: "high" },
];

const icMemberQuestions: Question[] = [
  { id: "6", text: "What's the downside scenario and how much could we lose?", category: "Risk", frequency: 94, lastAsked: "Various", difficulty: "high" },
  { id: "7", text: "How does this fit within our current portfolio allocation?", category: "Portfolio", frequency: 82, lastAsked: "Strategy Review", difficulty: "medium" },
  { id: "8", text: "What are the ESG considerations for this investment?", category: "ESG", frequency: 74, lastAsked: "GreenEnergy IC", difficulty: "medium" },
  { id: "9", text: "What due diligence items are still outstanding?", category: "Process", frequency: 69, lastAsked: "TechVentures IC", difficulty: "low" },
  { id: "10", text: "How does management's compensation align with our interests?", category: "Governance", frequency: 58, lastAsked: "HealthCare IC", difficulty: "medium" },
];

const difficultyColors = {
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export function QuestionPrep() {
  const [viewMode, setViewMode] = useState<ViewMode>("deal-team");
  const questions = viewMode === "deal-team" ? dealTeamQuestions : icMemberQuestions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">Question Preparation</h2>
        <p className="text-muted-foreground mt-1">
          {viewMode === "deal-team" 
            ? "Prepare for questions the IC will likely ask your team"
            : "Key questions to ask when evaluating new deals"}
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Button
          variant={viewMode === "deal-team" ? "glow" : "glass"}
          onClick={() => setViewMode("deal-team")}
          className="flex items-center gap-2"
        >
          <Briefcase className="w-4 h-4" />
          For Deal Teams
        </Button>
        <Button
          variant={viewMode === "ic-members" ? "glow" : "glass"}
          onClick={() => setViewMode("ic-members")}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          For IC Members
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Most Common</p>
            <p className="font-semibold">Valuation & Risk</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Prep Time</p>
            <p className="font-semibold">2.5 hours</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="font-semibold">85% prepared</p>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="font-semibold">Top Questions by Frequency</h3>
          <span className="text-xs text-muted-foreground">Based on {viewMode === "deal-team" ? "156" : "89"} past ICs</span>
        </div>
        
        {questions.map((question, index) => (
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
                  {question.text}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {question.category}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs capitalize", difficultyColors[question.difficulty])}>
                    {question.difficulty} difficulty
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Asked in {question.frequency}% of ICs
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last asked: {question.lastAsked}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
