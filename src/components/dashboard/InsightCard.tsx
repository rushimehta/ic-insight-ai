import { cn } from "@/lib/utils";
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

interface InsightCardProps {
  type: "insight" | "trend" | "warning";
  title: string;
  description: string;
  source?: string;
  delay?: number;
}

const icons = {
  insight: Lightbulb,
  trend: TrendingUp,
  warning: AlertTriangle,
};

const colors = {
  insight: "text-primary bg-primary/10 border-primary/20",
  trend: "text-info bg-info/10 border-info/20",
  warning: "text-warning bg-warning/10 border-warning/20",
};

export function InsightCard({ type, title, description, source, delay = 0 }: InsightCardProps) {
  const Icon = icons[type];

  return (
    <div 
      className="glass glass-hover rounded-xl p-4 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border", colors[type])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          {source && (
            <p className="text-xs text-primary mt-2">Source: {source}</p>
          )}
        </div>
      </div>
    </div>
  );
}
