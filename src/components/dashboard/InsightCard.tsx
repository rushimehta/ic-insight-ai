import { cn } from "@/lib/utils";
import { Lightbulb, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

interface InsightCardProps {
  type: "insight" | "trend" | "warning";
  title: string;
  description: string;
  source?: string;
  delay?: number;
  onClick?: () => void;
}

const icons = {
  insight: Lightbulb,
  trend: TrendingUp,
  warning: AlertTriangle,
};

const colors = {
  insight: "text-primary bg-primary/8 border-primary/15",
  trend: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/15",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-500/8 border-amber-500/15",
};

const dotColors = {
  insight: "bg-primary",
  trend: "bg-emerald-500",
  warning: "bg-amber-500",
};

export function InsightCard({ type, title, description, source, delay = 0, onClick }: InsightCardProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        "glass rounded-lg p-3.5 opacity-0 animate-fade-in transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/20"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0 border", colors[type])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", dotColors[type])} />
            <h4 className="font-medium text-[13px] leading-tight">{title}</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{description}</p>
          {source && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">{source}</p>
              {onClick && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
