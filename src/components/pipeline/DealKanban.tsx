import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  GripVertical,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  Search,
  FileText,
  MessageSquare,
  ChevronDown,
  ArrowUpDown,
  LayoutGrid,
  List,
  Clock,
  TrendingUp,
  Target,
  Sparkles,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  EyeOff,
  Tag,
  AlertCircle,
  Building2,
  Briefcase,
  Layers,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSectors } from "@/hooks/useSectors";
import { useDeals, Deal } from "@/hooks/useDeals";
import { cn } from "@/lib/utils";
import type { SectorType } from "@/hooks/useUserPermissions";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type DealStage =
  | "sourcing"
  | "initial_review"
  | "due_diligence"
  | "ic_scheduled"
  | "ic_complete"
  | "approved"
  | "closed"
  | "passed";

type ICStage =
  | "ic1"
  | "ic2"
  | "ic3"
  | "ic4"
  | "ic_final"
  | "approved"
  | "rejected";

type Priority = "critical" | "high" | "medium" | "low";
type DealType = "lbo" | "growth_equity" | "add_on" | "recapitalization" | "minority" | "other";
type SortKey = "updated_at" | "deal_size" | "priority" | "ic_date" | "created_at";
type SortDirection = "asc" | "desc";
type ViewMode = "detailed" | "compact";
type SwimlaneMode = "none" | "sector" | "lead_partner";

const STAGES: { id: DealStage; label: string; color: string; dotColor: string }[] = [
  { id: "sourcing", label: "Sourcing", color: "bg-slate-500", dotColor: "bg-slate-400" },
  { id: "initial_review", label: "Initial Review", color: "bg-blue-500", dotColor: "bg-blue-400" },
  { id: "due_diligence", label: "Due Diligence", color: "bg-purple-500", dotColor: "bg-purple-400" },
  { id: "ic_scheduled", label: "IC Scheduled", color: "bg-amber-500", dotColor: "bg-amber-400" },
  { id: "ic_complete", label: "IC Complete", color: "bg-cyan-500", dotColor: "bg-cyan-400" },
  { id: "approved", label: "Approved", color: "bg-emerald-500", dotColor: "bg-emerald-400" },
  { id: "closed", label: "Closed", color: "bg-green-600", dotColor: "bg-green-400" },
  { id: "passed", label: "Passed", color: "bg-red-500", dotColor: "bg-red-400" },
];

const STAGE_INDEX: Record<string, number> = {};
STAGES.forEach((s, i) => {
  STAGE_INDEX[s.id] = i;
});

const IC_STAGES: { value: ICStage; label: string; shortLabel: string }[] = [
  { value: "ic1", label: "IC1 - Initial Review", shortLabel: "IC1" },
  { value: "ic2", label: "IC2 - Deep Dive", shortLabel: "IC2" },
  { value: "ic3", label: "IC3 - Due Diligence", shortLabel: "IC3" },
  { value: "ic4", label: "IC4 - Final Terms", shortLabel: "IC4" },
  { value: "ic_final", label: "IC Final - Decision", shortLabel: "Final" },
];

const IC_STAGE_COLORS: Record<string, string> = {
  ic1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ic2: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ic3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ic4: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ic_final: "bg-green-500/20 text-green-400 border-green-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PRIORITY_CONFIG: Record<Priority, { label: string; border: string; badge: string; sortWeight: number }> = {
  critical: { label: "Critical", border: "border-l-red-500", badge: "bg-red-500/20 text-red-400 border-red-500/30", sortWeight: 0 },
  high: { label: "High", border: "border-l-amber-500", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", sortWeight: 1 },
  medium: { label: "Medium", border: "border-l-blue-500", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", sortWeight: 2 },
  low: { label: "Low", border: "border-l-slate-500", badge: "bg-slate-500/20 text-slate-400 border-slate-500/30", sortWeight: 3 },
};

const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: "lbo", label: "LBO" },
  { value: "growth_equity", label: "Growth Equity" },
  { value: "add_on", label: "Add-On" },
  { value: "recapitalization", label: "Recapitalization" },
  { value: "minority", label: "Minority Investment" },
  { value: "other", label: "Other" },
];

const DEAL_TYPE_COLORS: Record<string, string> = {
  lbo: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  growth_equity: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  add_on: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  recapitalization: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  minority: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDealMeta(deal: Deal) {
  const meta = (typeof deal.metadata === "object" && deal.metadata !== null ? deal.metadata : {}) as Record<string, unknown>;
  return {
    priority: (meta.priority as Priority) || "medium",
    dealType: (meta.deal_type as DealType) || "other",
    equityCheck: (meta.equity_check as string) || "",
    labels: (meta.labels as string[]) || [],
    stageEnteredAt: (meta.stage_entered_at as string) || deal.updated_at,
  };
}

function formatEV(raw: string | null): string {
  if (!raw) return "--";
  const cleaned = raw.replace(/[^0-9.bmBM]/g, "");
  if (!cleaned) return raw;
  return raw;
}

function formatCurrency(val: string | null): string {
  if (!val) return "--";
  return val;
}

function daysInStage(stageEnteredAt: string): number {
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24)));
}

function pipelineProgress(stage: string): number {
  const idx = STAGE_INDEX[stage] ?? 0;
  return Math.round(((idx + 1) / STAGES.length) * 100);
}

function icDateUrgency(icDate: string | null): "overdue" | "this_week" | "future" | null {
  if (!icDate) return null;
  const d = new Date(icDate);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "this_week";
  return "future";
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function sumEV(deals: Deal[]): string {
  let totalM = 0;
  let hasValue = false;
  for (const d of deals) {
    if (!d.deal_size) continue;
    const raw = d.deal_size.replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    if (isNaN(num)) continue;
    hasValue = true;
    const lower = d.deal_size.toLowerCase();
    if (lower.includes("b")) {
      totalM += num * 1000;
    } else {
      totalM += num;
    }
  }
  if (!hasValue) return "$0";
  if (totalM >= 1000) return `$${(totalM / 1000).toFixed(1)}B`;
  return `$${totalM.toFixed(0)}M`;
}

function sortDeals(deals: Deal[], sortKey: SortKey, sortDir: SortDirection): Deal[] {
  const sorted = [...deals];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "updated_at":
        cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case "created_at":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "deal_size": {
        const parseSize = (s: string | null) => {
          if (!s) return 0;
          const raw = s.replace(/[^0-9.]/g, "");
          const num = parseFloat(raw) || 0;
          return s.toLowerCase().includes("b") ? num * 1000 : num;
        };
        cmp = parseSize(a.deal_size) - parseSize(b.deal_size);
        break;
      }
      case "priority": {
        const aMeta = parseDealMeta(a);
        const bMeta = parseDealMeta(b);
        cmp = PRIORITY_CONFIG[aMeta.priority].sortWeight - PRIORITY_CONFIG[bMeta.priority].sortWeight;
        break;
      }
      case "ic_date": {
        const aTime = a.ic_date ? new Date(a.ic_date).getTime() : Infinity;
        const bTime = b.ic_date ? new Date(b.ic_date).getTime() : Infinity;
        cmp = aTime - bTime;
        break;
      }
    }
    return sortDir === "desc" ? -cmp : cmp;
  });
  return sorted;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuickStatsBar({ deals }: { deals: Deal[] }) {
  const [drillDownCard, setDrillDownCard] = useState<string | null>(null);

  const totalDeals = deals.length;
  const totalEV = sumEV(deals);
  const avgDays = useMemo(() => {
    if (deals.length === 0) return 0;
    const closedDeals = deals.filter((d) => d.stage === "closed");
    if (closedDeals.length === 0) {
      const total = deals.reduce((sum, d) => {
        const created = new Date(d.created_at);
        const now = new Date();
        return sum + Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      return Math.round(total / deals.length);
    }
    const total = closedDeals.reduce((sum, d) => {
      const created = new Date(d.created_at);
      const closed = new Date(d.updated_at);
      return sum + Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round(total / closedDeals.length);
  }, [deals]);

  // --- Drill-down metrics ---

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach((s) => { counts[s.id] = 0; });
    deals.forEach((d) => { counts[d.stage] = (counts[d.stage] || 0) + 1; });
    return counts;
  }, [deals]);

  const parseEVtoM = (d: Deal): number => {
    if (!d.deal_size) return 0;
    const raw = d.deal_size.replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    if (isNaN(num)) return 0;
    return d.deal_size.toLowerCase().includes("b") ? num * 1000 : num;
  };

  const evMetrics = useMemo(() => {
    const byStage: Record<string, number> = {};
    STAGES.forEach((s) => { byStage[s.id] = 0; });
    const bySector: Record<string, number> = {};
    let largest: { name: string; ev: number } = { name: "--", ev: 0 };
    let totalM = 0;
    let withEV = 0;

    deals.forEach((d) => {
      const ev = parseEVtoM(d);
      if (ev > 0) {
        withEV++;
        totalM += ev;
        byStage[d.stage] = (byStage[d.stage] || 0) + ev;
        bySector[d.sector] = (bySector[d.sector] || 0) + ev;
        if (ev > largest.ev) {
          largest = { name: d.company_name || d.deal_name, ev };
        }
      }
    });

    const fmtM = (m: number) => m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${m.toFixed(0)}M`;
    return {
      byStage: STAGES.map((s) => ({ label: s.label, value: fmtM(byStage[s.id]) })),
      avgDealSize: withEV > 0 ? fmtM(totalM / withEV) : "$0",
      largest: { name: largest.name, value: fmtM(largest.ev) },
      bySector: Object.entries(bySector)
        .sort((a, b) => b[1] - a[1])
        .map(([sector, m]) => ({ label: sector, value: fmtM(m) })),
    };
  }, [deals]);

  const velocityMetrics = useMemo(() => {
    const now = new Date();
    const dealDays = deals.map((d) => {
      const created = new Date(d.created_at);
      const end = d.stage === "closed" ? new Date(d.updated_at) : now;
      return {
        name: d.company_name || d.deal_name,
        days: Math.max(0, Math.floor((end.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))),
        stage: d.stage,
      };
    });

    const sorted = [...dealDays].sort((a, b) => a.days - b.days);
    const fastest = sorted.slice(0, 3);
    const longest = [...sorted].reverse().slice(0, 3);

    const avgByStage: Record<string, { total: number; count: number }> = {};
    STAGES.forEach((s) => { avgByStage[s.id] = { total: 0, count: 0 }; });
    dealDays.forEach((dd) => {
      if (avgByStage[dd.stage]) {
        avgByStage[dd.stage].total += dd.days;
        avgByStage[dd.stage].count++;
      }
    });

    const buckets = [
      { label: "< 30 days", count: dealDays.filter((d) => d.days < 30).length },
      { label: "30-60 days", count: dealDays.filter((d) => d.days >= 30 && d.days < 60).length },
      { label: "60-90 days", count: dealDays.filter((d) => d.days >= 60 && d.days < 90).length },
      { label: "90-180 days", count: dealDays.filter((d) => d.days >= 90 && d.days < 180).length },
      { label: "180+ days", count: dealDays.filter((d) => d.days >= 180).length },
    ];

    return {
      fastest,
      longest,
      avgByStage: STAGES.map((s) => ({
        label: s.label,
        value: avgByStage[s.id].count > 0
          ? `${Math.round(avgByStage[s.id].total / avgByStage[s.id].count)}d`
          : "--",
      })),
      buckets,
    };
  }, [deals]);

  // --- AI Insights ---

  const totalDealsInsight = useMemo(() => {
    const active = deals.filter((d) => d.stage !== "closed" && d.stage !== "passed").length;
    const closed = stageCounts["closed"] || 0;
    const passed = stageCounts["passed"] || 0;
    const earlyStage = (stageCounts["sourcing"] || 0) + (stageCounts["initial_review"] || 0);
    const lateStage = (stageCounts["approved"] || 0) + (stageCounts["ic_complete"] || 0);
    const ratio = active > 0 ? ((earlyStage / active) * 100).toFixed(0) : "0";
    return `Pipeline has ${active} active deals with ${closed} closed and ${passed} passed. ${ratio}% of active deals are in early stages (Sourcing/Initial Review). ${lateStage > 0 ? `${lateStage} deal${lateStage > 1 ? "s" : ""} in late stages approaching close.` : "No deals in late stages yet — focus on advancing DD pipeline."}`;
  }, [deals, stageCounts]);

  const evInsight = useMemo(() => {
    const activeDeals = deals.filter((d) => d.stage !== "closed" && d.stage !== "passed");
    const activeEV = sumEV(activeDeals);
    const ddPlusDeals = deals.filter((d) => ["due_diligence", "ic_scheduled", "ic_complete", "approved"].includes(d.stage));
    const ddPlusEV = sumEV(ddPlusDeals);
    return `Active pipeline value is ${activeEV} across ${activeDeals.length} deals. ${ddPlusDeals.length > 0 ? `${ddPlusEV} (${ddPlusDeals.length} deals) has progressed past Initial Review into DD+.` : "No deals have advanced past Initial Review yet."} Average deal size is ${evMetrics.avgDealSize}. Largest opportunity is ${evMetrics.largest.name} at ${evMetrics.largest.value}.`;
  }, [deals, evMetrics]);

  const velocityInsight = useMemo(() => {
    const closedDeals = deals.filter((d) => d.stage === "closed");
    const fastBucket = velocityMetrics.buckets[0].count;
    const slowBucket = velocityMetrics.buckets[4].count;
    return `Average time in pipeline is ${avgDays} days. ${fastBucket} deal${fastBucket !== 1 ? "s" : ""} closed within 30 days. ${slowBucket > 0 ? `${slowBucket} deal${slowBucket !== 1 ? "s" : ""} have been in pipeline 180+ days — consider reviewing stale opportunities.` : "No deals exceeding 180 days — pipeline velocity is healthy."} ${closedDeals.length > 0 ? `${closedDeals.length} deal${closedDeals.length > 1 ? "s" : ""} have reached close.` : "No deals closed yet."}`;
  }, [deals, avgDays, velocityMetrics]);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div
          className="glass rounded-lg px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
          onClick={() => setDrillDownCard("total_deals")}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Deals</p>
            <p className="text-lg font-semibold tabular-nums">{totalDeals}</p>
          </div>
        </div>
        <div
          className="glass rounded-lg px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
          onClick={() => setDrillDownCard("pipeline_ev")}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pipeline EV</p>
            <p className="text-lg font-semibold tabular-nums">{totalEV}</p>
          </div>
        </div>
        <div
          className="glass rounded-lg px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
          onClick={() => setDrillDownCard("avg_days")}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Days in Pipeline</p>
            <p className="text-lg font-semibold tabular-nums">{avgDays}</p>
          </div>
        </div>
      </div>

      {/* Drill-down Dialog */}
      <Dialog open={drillDownCard !== null} onOpenChange={(open) => { if (!open) setDrillDownCard(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {drillDownCard === "total_deals" && "Total Deals Breakdown"}
              {drillDownCard === "pipeline_ev" && "Pipeline EV Breakdown"}
              {drillDownCard === "avg_days" && "Pipeline Velocity"}
            </DialogTitle>
          </DialogHeader>

          {/* Total Deals Drill-Down */}
          {drillDownCard === "total_deals" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {STAGES.map((s) => (
                  <div key={s.id} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", s.dotColor)} />
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{stageCounts[s.id]}</span>
                  </div>
                ))}
              </div>
              <div className="glass rounded-lg p-3 flex gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{totalDealsInsight}</p>
              </div>
            </div>
          )}

          {/* Pipeline EV Drill-Down */}
          {drillDownCard === "pipeline_ev" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {evMetrics.byStage.map((item) => (
                  <div key={item.label} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="glass rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                  <p className="text-sm font-semibold tabular-nums">{evMetrics.avgDealSize}</p>
                </div>
                <div className="glass rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Largest Deal</p>
                  <p className="text-sm font-semibold tabular-nums">{evMetrics.largest.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{evMetrics.largest.name}</p>
                </div>
              </div>
              {evMetrics.bySector.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">EV by Sector</p>
                  <div className="grid grid-cols-2 gap-2">
                    {evMetrics.bySector.map((item) => (
                      <div key={item.label} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground truncate mr-2">{item.label}</span>
                        <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="glass rounded-lg p-3 flex gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{evInsight}</p>
              </div>
            </div>
          )}

          {/* Avg Days Drill-Down */}
          {drillDownCard === "avg_days" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Deals by Time Spent</p>
                <div className="grid grid-cols-2 gap-2">
                  {velocityMetrics.buckets.map((b) => (
                    <div key={b.label} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{b.label}</span>
                      <span className="text-sm font-semibold tabular-nums">{b.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="glass rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Fastest to Close</p>
                  {velocityMetrics.fastest.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-muted-foreground truncate mr-2">{f.name}</span>
                      <span className="font-semibold tabular-nums">{f.days}d</span>
                    </div>
                  ))}
                </div>
                <div className="glass rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Longest in Pipeline</p>
                  {velocityMetrics.longest.map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-muted-foreground truncate mr-2">{l.name}</span>
                      <span className="font-semibold tabular-nums">{l.days}d</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Avg Days by Stage</p>
                <div className="grid grid-cols-2 gap-2">
                  {velocityMetrics.avgByStage.map((item) => (
                    <div key={item.label} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-lg p-3 flex gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{velocityInsight}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// DealCard
// ---------------------------------------------------------------------------

interface DealCardProps {
  deal: Deal;
  isDragging: boolean;
  viewMode: ViewMode;
  onDragStart: () => void;
  onNavigateToMemo: () => void;
  onNavigateToChat: () => void;
}

function DealCard({ deal, isDragging, viewMode, onDragStart, onNavigateToMemo, onNavigateToChat }: DealCardProps) {
  const meta = parseDealMeta(deal);
  const priorityCfg = PRIORITY_CONFIG[meta.priority];
  const progress = pipelineProgress(deal.stage);
  const days = daysInStage(meta.stageEnteredAt);
  const urgency = icDateUrgency(deal.ic_date);
  const icStageInfo = IC_STAGES.find((s) => s.value === deal.ic_stage);
  const dealTypeInfo = DEAL_TYPES.find((t) => t.value === meta.dealType);

  const isCompact = viewMode === "compact";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className={cn(
        "kanban-card group relative rounded-lg border-l-[3px] bg-card border border-border p-3 cursor-grab active:cursor-grabbing transition-all duration-200",
        priorityCfg.border,
        isDragging && "opacity-40 scale-95 rotate-1 shadow-2xl",
        !isDragging && "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      )}
    >
      {/* Top row: Grip + Deal name + priority dot */}
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{deal.deal_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">{deal.company_name}</p>
              </div>
            </div>
            {/* Priority dot */}
            <div
              className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", {
                "bg-red-500": meta.priority === "critical",
                "bg-amber-500": meta.priority === "high",
                "bg-blue-500": meta.priority === "medium",
                "bg-slate-500": meta.priority === "low",
              })}
              title={priorityCfg.label + " priority"}
            />
          </div>

          {/* Enterprise Value - prominent */}
          {deal.deal_size && (
            <div className="mt-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-bold tabular-nums text-foreground">
                {formatEV(deal.deal_size)}
              </span>
              <span className="text-[10px] text-muted-foreground">EV</span>
            </div>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0 h-[18px]">
              {deal.sector.replace(/_/g, " ")}
            </Badge>
            {icStageInfo && (
              <Badge className={cn("text-[10px] border px-1.5 py-0 h-[18px]", IC_STAGE_COLORS[deal.ic_stage] || "")}>
                {icStageInfo.shortLabel}
              </Badge>
            )}
            {dealTypeInfo && (
              <Badge className={cn("text-[10px] border px-1.5 py-0 h-[18px]", DEAL_TYPE_COLORS[meta.dealType] || "")}>
                {dealTypeInfo.label}
              </Badge>
            )}
          </div>

          {/* Expanded details (non-compact mode) */}
          {!isCompact && (
            <>
              {/* Lead partner */}
              {deal.lead_partner && (
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                    {getInitials(deal.lead_partner)}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {deal.lead_partner}
                  </span>
                </div>
              )}

              {/* IC Date with urgency */}
              {deal.ic_date && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span
                    className={cn("text-xs tabular-nums", {
                      "text-red-400 font-medium": urgency === "overdue",
                      "text-amber-400": urgency === "this_week",
                      "text-emerald-400": urgency === "future",
                    })}
                  >
                    IC: {new Date(deal.ic_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {urgency === "overdue" && (
                      <span className="ml-1 text-[10px]">(overdue)</span>
                    )}
                  </span>
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Pipeline Progress</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Days in stage */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {days}d in stage
                  </span>
                </div>
                {meta.labels.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    {meta.labels.slice(0, 2).map((label) => (
                      <span
                        key={label}
                        className="text-[9px] px-1 py-0 rounded bg-muted text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                    {meta.labels.length > 2 && (
                      <span className="text-[9px] text-muted-foreground">+{meta.labels.length - 2}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Mini action buttons */}
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToMemo();
                  }}
                >
                  <FileText className="w-3 h-3" />
                  Memo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToChat();
                  }}
                >
                  <MessageSquare className="w-3 h-3" />
                  AI Chat
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColumnHeader
// ---------------------------------------------------------------------------

interface ColumnHeaderProps {
  stage: (typeof STAGES)[number];
  dealCount: number;
  totalEV: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSort: (key: SortKey) => void;
}

function ColumnHeader({ stage, dealCount, totalEV, collapsed, onToggleCollapse, onSort }: ColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", stage.dotColor)} />
        <h3 className="font-semibold text-sm truncate">{stage.label}</h3>
        <Badge variant="secondary" className="text-[10px] tabular-nums h-5 px-1.5">
          {dealCount}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground tabular-nums font-medium whitespace-nowrap">
          {totalEV}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onToggleCollapse}>
              <EyeOff className="w-3.5 h-3.5 mr-2" />
              {collapsed ? "Expand" : "Collapse"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("priority")}>
              <AlertCircle className="w-3.5 h-3.5 mr-2" />
              Sort by Priority
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("deal_size")}>
              <DollarSign className="w-3.5 h-3.5 mr-2" />
              Sort by EV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("updated_at")}>
              <Clock className="w-3.5 h-3.5 mr-2" />
              Sort by Updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("ic_date")}>
              <Calendar className="w-3.5 h-3.5 mr-2" />
              Sort by IC Date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreateDealDialog
// ---------------------------------------------------------------------------

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSectors: { id: string; name: string; display_name: string }[];
  onCreate: (data: {
    deal_name: string;
    company_name: string;
    sector: SectorType;
    stage?: string;
    ic_stage?: string;
    deal_size?: string | null;
    description?: string | null;
    lead_partner?: string | null;
    target_close_date?: string | null;
  }) => Promise<Deal>;
  onUpdateMeta?: (id: string, meta: Record<string, unknown>) => void;
}

function CreateDealDialog({ open, onOpenChange, activeSectors, onCreate }: CreateDealDialogProps) {
  const [form, setForm] = useState({
    deal_name: "",
    company_name: "",
    sector: "technology" as SectorType,
    ic_stage: "ic1" as ICStage,
    deal_size: "",
    equity_check: "",
    lead_partner: "",
    description: "",
    priority: "medium" as Priority,
    deal_type: "lbo" as DealType,
    target_close_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleCreate = async () => {
    if (!form.deal_name.trim() || !form.company_name.trim()) {
      toast.error("Deal name and company name are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreate({
        deal_name: form.deal_name,
        company_name: form.company_name,
        sector: form.sector,
        stage: "sourcing",
        ic_stage: form.ic_stage,
        deal_size: form.deal_size || null,
        description: form.description || null,
        lead_partner: form.lead_partner || null,
        target_close_date: form.target_close_date || null,
      });
      onOpenChange(false);
      setForm({
        deal_name: "",
        company_name: "",
        sector: "technology",
        ic_stage: "ic1",
        deal_size: "",
        equity_check: "",
        lead_partner: "",
        description: "",
        priority: "medium",
        deal_type: "lbo",
        target_close_date: "",
      });
      toast.success("Deal created successfully");
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Create New Deal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Row 1: Deal name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deal Name *</label>
            <Input
              value={form.deal_name}
              onChange={(e) => set("deal_name", e.target.value)}
              placeholder="Project Alpha"
              className="mt-1"
            />
          </div>
          {/* Row 2: Company name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Name *</label>
            <Input
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="Acme Corp"
              className="mt-1"
            />
          </div>
          {/* Row 3: Sector + Deal Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sector</label>
              <Select value={form.sector} onValueChange={(v) => set("sector", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeSectors.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deal Type</label>
              <Select value={form.deal_type} onValueChange={(v) => set("deal_type", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Row 4: EV + Equity Check */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enterprise Value</label>
              <Input
                value={form.deal_size}
                onChange={(e) => set("deal_size", e.target.value)}
                placeholder="$250M"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Equity Check</label>
              <Input
                value={form.equity_check}
                onChange={(e) => set("equity_check", e.target.value)}
                placeholder="$75M"
                className="mt-1"
              />
            </div>
          </div>
          {/* Row 5: IC Stage + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">IC Stage</label>
              <Select value={form.ic_stage} onValueChange={(v) => set("ic_stage", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IC_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn("w-2 h-2 rounded-full", {
                            "bg-red-500": p === "critical",
                            "bg-amber-500": p === "high",
                            "bg-blue-500": p === "medium",
                            "bg-slate-500": p === "low",
                          })}
                        />
                        {PRIORITY_CONFIG[p].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Row 6: Lead Partner + Target Close */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Partner</label>
              <Input
                value={form.lead_partner}
                onChange={(e) => set("lead_partner", e.target.value)}
                placeholder="John Smith"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Close Date</label>
              <Input
                type="date"
                value={form.target_close_date}
                onChange={(e) => set("target_close_date", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of the investment opportunity..."
              rows={3}
              className="mt-1"
            />
          </div>
          <Button onClick={handleCreate} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Deal"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DealKanban() {
  const navigate = useNavigate();
  const { activeSectors } = useSectors();
  const { deals, isLoading, createDeal, updateDeal } = useDeals();

  // Drag state
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dropTarget, setDropTarget] = useState<DealStage | null>(null);

  // Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterPartner, setFilterPartner] = useState<string>("all");
  const [filterICStage, setFilterICStage] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [dealTypeFilter, setDealTypeFilter] = useState("all");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // View
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneMode>("none");
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  // Per-column sort overrides
  const [columnSortOverrides, setColumnSortOverrides] = useState<Record<string, SortKey>>({});

  // Derived: unique partners
  const uniquePartners = useMemo(() => {
    const partners = new Set<string>();
    deals.forEach((d: Deal) => {
      if (d.lead_partner) partners.add(d.lead_partner);
    });
    return Array.from(partners).sort();
  }, [deals]);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    let result = [...deals];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d: Deal) =>
          d.deal_name.toLowerCase().includes(q) ||
          d.company_name.toLowerCase().includes(q) ||
          (d.lead_partner && d.lead_partner.toLowerCase().includes(q))
      );
    }

    if (filterSector !== "all") {
      result = result.filter((d: Deal) => d.sector === filterSector);
    }

    if (filterPartner !== "all") {
      result = result.filter((d: Deal) => d.lead_partner === filterPartner);
    }

    if (filterICStage !== "all") {
      result = result.filter((d: Deal) => d.ic_stage === filterICStage);
    }

    return result;
  }, [deals, searchQuery, filterSector, filterPartner, filterICStage]);

  // Deals by stage
  const getDealsByStage = useCallback(
    (stage: DealStage): Deal[] => {
      const stageDeals = filteredDeals.filter((d: Deal) => d.stage === stage);
      const effectiveSortKey = columnSortOverrides[stage] || sortKey;
      return sortDeals(stageDeals, effectiveSortKey, sortDir);
    },
    [filteredDeals, sortKey, sortDir, columnSortOverrides]
  );

  // Swimlane groups
  const swimlaneGroups = useMemo(() => {
    if (swimlaneMode === "none") return null;
    const groups = new Map<string, string>();
    filteredDeals.forEach((d: Deal) => {
      if (swimlaneMode === "sector") {
        groups.set(d.sector, d.sector.replace(/_/g, " "));
      } else if (swimlaneMode === "lead_partner") {
        const key = d.lead_partner || "Unassigned";
        groups.set(key, key);
      }
    });
    return Array.from(groups.entries()).map(([key, label]) => ({ key, label }));
  }, [filteredDeals, swimlaneMode]);

  // Drag handlers
  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(stage);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (stage: DealStage) => {
    setDropTarget(null);
    if (!draggedDeal || draggedDeal.stage === stage) {
      setDraggedDeal(null);
      return;
    }

    try {
      await updateDeal(draggedDeal.id, { stage });
      toast.success(
        `Moved "${draggedDeal.deal_name}" to ${STAGES.find((s) => s.id === stage)?.label}`
      );
    } catch (error) {
      console.error("Error updating deal:", error);
      toast.error("Failed to update deal stage");
    } finally {
      setDraggedDeal(null);
    }
  };

  const toggleColumnCollapse = (stageId: string) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const handleColumnSort = (stageId: string, key: SortKey) => {
    setColumnSortOverrides((prev) => ({ ...prev, [stageId]: key }));
  };

  // Render a single kanban column
  const renderColumn = (stage: (typeof STAGES)[number], swimlaneFilter?: (d: Deal) => boolean) => {
    let stageDeals = getDealsByStage(stage.id);
    if (swimlaneFilter) {
      stageDeals = stageDeals.filter(swimlaneFilter);
    }
    const collapsed = collapsedColumns.has(stage.id);
    const colEV = sumEV(stageDeals);

    return (
      <div
        key={stage.id}
        className={cn("shrink-0 transition-all duration-300", collapsed ? "w-14" : "w-[280px]")}
        onDragOver={(e) => handleDragOver(e, stage.id)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(stage.id)}
      >
        <div
          className={cn(
            "kanban-column glass rounded-xl transition-all duration-200 h-full",
            collapsed ? "p-2" : "p-3",
            dropTarget === stage.id && draggedDeal && "ring-2 ring-primary/50 bg-primary/5"
          )}
        >
          {collapsed ? (
            // Collapsed column
            <div className="flex flex-col items-center gap-2 h-full">
              <button
                onClick={() => toggleColumnCollapse(stage.id)}
                className="hover:bg-muted/50 rounded-md p-1 transition-colors"
              >
                <div className={cn("w-2.5 h-2.5 rounded-full", stage.dotColor)} />
              </button>
              <span className="text-[10px] font-medium text-muted-foreground writing-mode-vertical [writing-mode:vertical-rl] rotate-180">
                {stage.label}
              </span>
              <Badge variant="secondary" className="text-[9px] tabular-nums h-4 px-1">
                {stageDeals.length}
              </Badge>
            </div>
          ) : (
            <>
              <ColumnHeader
                stage={stage}
                dealCount={stageDeals.length}
                totalEV={colEV}
                collapsed={false}
                onToggleCollapse={() => toggleColumnCollapse(stage.id)}
                onSort={(key) => handleColumnSort(stage.id, key)}
              />

              <ScrollArea className="h-[calc(100vh-340px)]">
                <div className="space-y-2 pr-1">
                  {stageDeals.length === 0 ? (
                    <div
                      className={cn(
                        "text-center py-8 text-muted-foreground text-xs border-2 border-dashed rounded-lg transition-colors",
                        dropTarget === stage.id && draggedDeal
                          ? "border-primary/50 bg-primary/5 text-primary"
                          : "border-border"
                      )}
                    >
                      {dropTarget === stage.id && draggedDeal
                        ? "Drop here"
                        : "No deals"}
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        isDragging={draggedDeal?.id === deal.id}
                        viewMode={viewMode}
                        onDragStart={() => handleDragStart(deal)}
                        onNavigateToMemo={() => navigate(`/deals/${deal.id}/memo`)}
                        onNavigateToChat={() => navigate(`/ai-chat?deal=${deal.id}`)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between opacity-0 animate-fade-in">
        <div>
          <h2 className="text-2xl font-semibold">Deal Pipeline</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track and manage deals through the investment process
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="glow" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <QuickStatsBar deals={filteredDeals} />
      </div>

      {/* Board Controls */}
      <div
        className="glass rounded-xl p-3 opacity-0 animate-fade-in flex flex-wrap items-center gap-3"
        style={{ animationDelay: "80ms" }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals..."
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Sector filter */}
        <Select value={filterSector} onValueChange={setFilterSector}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <Briefcase className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {activeSectors.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Partner filter */}
        <Select value={filterPartner} onValueChange={setFilterPartner}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <Users className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Partner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Partners</SelectItem>
            {uniquePartners.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* IC Stage filter */}
        <Select value={filterICStage} onValueChange={setFilterICStage}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <Layers className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="IC Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All IC Stages</SelectItem>
            {IC_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.shortLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Deal Type filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Financial Services">Fin. Services</SelectItem>
              <SelectItem value="Industrials">Industrials</SelectItem>
              <SelectItem value="Consumer">Consumer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dealTypeFilter} onValueChange={setDealTypeFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lbo">LBO</SelectItem>
              <SelectItem value="growth">Growth Equity</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5">
              <ArrowUpDown className="w-3 h-3" />
              Sort
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => { setSortKey("updated_at"); setSortDir("desc"); }}>
              <Clock className="w-3.5 h-3.5 mr-2" />
              Recently Updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortKey("created_at"); setSortDir("desc"); }}>
              <Calendar className="w-3.5 h-3.5 mr-2" />
              Recently Created
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortKey("deal_size"); setSortDir("desc"); }}>
              <DollarSign className="w-3.5 h-3.5 mr-2" />
              Highest EV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortKey("deal_size"); setSortDir("asc"); }}>
              <DollarSign className="w-3.5 h-3.5 mr-2" />
              Lowest EV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortKey("priority"); setSortDir("asc"); }}>
              <AlertCircle className="w-3.5 h-3.5 mr-2" />
              Highest Priority
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortKey("ic_date"); setSortDir("asc"); }}>
              <Calendar className="w-3.5 h-3.5 mr-2" />
              Nearest IC Date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("detailed")}
            className={cn(
              "h-8 px-2.5 flex items-center justify-center transition-colors",
              viewMode === "detailed"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title="Detailed view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={cn(
              "h-8 px-2.5 flex items-center justify-center transition-colors border-l border-border",
              viewMode === "compact"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title="Compact view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Swimlane toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5">
              <Layers className="w-3 h-3" />
              Swimlanes
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setSwimlaneMode("none")}>
              {swimlaneMode === "none" && <span className="mr-1">&#10003;</span>}
              None
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSwimlaneMode("sector")}>
              {swimlaneMode === "sector" && <span className="mr-1">&#10003;</span>}
              By Sector
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSwimlaneMode("lead_partner")}>
              {swimlaneMode === "lead_partner" && <span className="mr-1">&#10003;</span>}
              By Lead Partner
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters indicator */}
      {(filterSector !== "all" || filterPartner !== "all" || filterICStage !== "all" || searchQuery.trim()) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground opacity-0 animate-fade-in">
          <span>Active filters:</span>
          {searchQuery.trim() && (
            <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => setSearchQuery("")}>
              Search: {searchQuery}
              <span className="ml-0.5">&times;</span>
            </Badge>
          )}
          {filterSector !== "all" && (
            <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer capitalize" onClick={() => setFilterSector("all")}>
              {filterSector.replace(/_/g, " ")}
              <span className="ml-0.5">&times;</span>
            </Badge>
          )}
          {filterPartner !== "all" && (
            <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterPartner("all")}>
              {filterPartner}
              <span className="ml-0.5">&times;</span>
            </Badge>
          )}
          {filterICStage !== "all" && (
            <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterICStage("all")}>
              {IC_STAGES.find((s) => s.value === filterICStage)?.shortLabel || filterICStage}
              <span className="ml-0.5">&times;</span>
            </Badge>
          )}
          <button
            className="text-[10px] text-primary hover:underline"
            onClick={() => {
              setSearchQuery("");
              setFilterSector("all");
              setFilterPartner("all");
              setFilterICStage("all");
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: "120ms" }}>
        {swimlaneMode !== "none" && swimlaneGroups ? (
          // Swimlane view
          <div className="space-y-6">
            {swimlaneGroups.map((group) => {
              const swimlaneFilter = (d: Deal) => {
                if (swimlaneMode === "sector") return d.sector === group.key;
                if (swimlaneMode === "lead_partner") return (d.lead_partner || "Unassigned") === group.key;
                return true;
              };
              const groupDeals = filteredDeals.filter(swimlaneFilter);
              if (groupDeals.length === 0) return null;

              return (
                <div key={group.key}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-1 h-5 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold capitalize">{group.label}</h3>
                    <Badge variant="secondary" className="text-[10px] tabular-nums h-5 px-1.5">
                      {groupDeals.length} deals
                    </Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {sumEV(groupDeals)} total EV
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex gap-3 min-w-max pb-2">
                      {STAGES.map((stage) => renderColumn(stage, swimlaneFilter))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Standard board view
          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-max pb-4">
              {STAGES.map((stage) => renderColumn(stage))}
            </div>
          </div>
        )}
      </div>

      {/* Create Deal Dialog */}
      <CreateDealDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        activeSectors={activeSectors}
        onCreate={createDeal}
      />
    </div>
  );
}
