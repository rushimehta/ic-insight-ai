import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ComposedChart,
} from "recharts";
import {
  TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, Loader2,
  ArrowLeft, FileText, Calendar, Building2, DollarSign, Target,
  ArrowUpRight, ArrowDownRight, ChevronRight, ChevronDown, Layers,
  Sparkles, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── PE-Specific Data ─────────────────────────────────────────────

const SECTOR_COLORS: Record<string, string> = {
  technology: "#3b82f6",
  healthcare: "#10b981",
  financial_services: "#8b5cf6",
  consumer_retail: "#f59e0b",
  industrials: "#6366f1",
  energy: "#ef4444",
  real_estate: "#14b8a6",
  media_entertainment: "#ec4899",
  infrastructure: "#78716c",
  consumer: "#f59e0b",
};

// Fund performance waterfall data
const waterfallData = [
  { name: "Invested Capital", value: 1400, cumulative: 1400, fill: "#3b82f6", type: "base" },
  { name: "Revenue Growth", value: 420, cumulative: 1820, fill: "#10b981", type: "add" },
  { name: "Margin Expansion", value: 280, cumulative: 2100, fill: "#10b981", type: "add" },
  { name: "Multiple Expansion", value: 350, cumulative: 2450, fill: "#10b981", type: "add" },
  { name: "Leverage Paydown", value: 180, cumulative: 2630, fill: "#8b5cf6", type: "add" },
  { name: "Fees & Carry", value: -230, cumulative: 2400, fill: "#ef4444", type: "subtract" },
  { name: "Net Returns", value: 2400, cumulative: 2400, fill: "#f59e0b", type: "total" },
];

// J-curve data
const jCurveData = [
  { year: "Y0", fund7: -8, fund6: -6, benchmark: -5 },
  { year: "Y1", fund7: -12, fund6: -10, benchmark: -8 },
  { year: "Y2", fund7: -5, fund6: -4, benchmark: -3 },
  { year: "Y3", fund7: 4, fund6: 6, benchmark: 3 },
  { year: "Y4", fund7: 14, fund6: 12, benchmark: 9 },
  { year: "Y5", fund7: 22, fund6: 18, benchmark: 14 },
  { year: "Y6", fund7: null, fund6: 24, benchmark: 18 },
  { year: "Y7", fund7: null, fund6: 28, benchmark: 21 },
];

// Vintage year analysis
const vintageData = [
  { vintage: "2019", irr: 28.4, moic: 3.2, dpi: 1.8, tvpi: 3.2, deals: 5, color: "#3b82f6" },
  { vintage: "2020", irr: 32.1, moic: 3.5, dpi: 1.2, tvpi: 3.5, deals: 4, color: "#10b981" },
  { vintage: "2021", irr: 18.6, moic: 2.1, dpi: 0.6, tvpi: 2.1, deals: 7, color: "#8b5cf6" },
  { vintage: "2022", irr: 22.3, moic: 2.4, dpi: 0.3, tvpi: 2.4, deals: 6, color: "#f59e0b" },
  { vintage: "2023", irr: 24.8, moic: 2.6, dpi: 0.1, tvpi: 1.8, deals: 5, color: "#ef4444" },
  { vintage: "2024", irr: 19.2, moic: 1.6, dpi: 0.0, tvpi: 1.4, deals: 8, color: "#ec4899" },
  { vintage: "2025", irr: 15.4, moic: 1.2, dpi: 0.0, tvpi: 1.1, deals: 6, color: "#14b8a6" },
];

// IRR distribution
const irrDistribution = [
  { range: "<0%", count: 2, color: "#ef4444" },
  { range: "0-10%", count: 4, color: "#f59e0b" },
  { range: "10-15%", count: 6, color: "#eab308" },
  { range: "15-20%", count: 9, color: "#84cc16" },
  { range: "20-25%", count: 12, color: "#22c55e" },
  { range: "25-30%", count: 8, color: "#10b981" },
  { range: "30%+", count: 5, color: "#059669" },
];

// Deal attribution scatter
const dealAttribution = [
  { name: "Project Atlas", irr: 22.4, moic: 2.8, ev: 425, sector: "Healthcare" },
  { name: "Project Beacon", irr: 28.1, moic: 3.2, ev: 680, sector: "Technology" },
  { name: "Project Citadel", irr: 25.3, moic: 2.5, ev: 310, sector: "Industrials" },
  { name: "Project Delta", irr: 19.2, moic: 2.1, ev: 890, sector: "Financial Services" },
  { name: "Project Echo", irr: 32.4, moic: 3.8, ev: 215, sector: "Technology" },
  { name: "Project Falcon", irr: 26.7, moic: 2.9, ev: 175, sector: "Industrials" },
  { name: "Project Granite", irr: 16.1, moic: 1.8, ev: 520, sector: "Healthcare" },
  { name: "Project Horizon", irr: 24.8, moic: 2.6, ev: 340, sector: "Technology" },
  { name: "Project Ironclad", irr: 30.2, moic: 3.5, ev: 560, sector: "Technology" },
  { name: "Project Jupiter", irr: 23.6, moic: 2.7, ev: 290, sector: "Healthcare" },
];

// Sector radar data
const sectorRadarData = [
  { metric: "IRR", healthcare: 22, technology: 29, industrials: 26, finserv: 20, consumer: 21 },
  { metric: "MOIC", healthcare: 70, technology: 85, industrials: 72, finserv: 60, consumer: 65 },
  { metric: "Approval %", healthcare: 68, technology: 72, industrials: 75, finserv: 60, consumer: 55 },
  { metric: "Deal Flow", healthcare: 65, technology: 90, industrials: 55, finserv: 50, consumer: 35 },
  { metric: "Avg Hold", healthcare: 60, technology: 75, industrials: 65, finserv: 70, consumer: 55 },
  { metric: "Margin", healthcare: 72, technology: 55, industrials: 68, finserv: 78, consumer: 60 },
];

// IC conversion funnel
const funnelData = [
  { stage: "Sourced", value: 245, pct: 100 },
  { stage: "Screened", value: 128, pct: 52 },
  { stage: "CIM Review", value: 67, pct: 27 },
  { stage: "Mgmt Meeting", value: 38, pct: 16 },
  { stage: "LOI Submitted", value: 22, pct: 9 },
  { stage: "IC-1", value: 18, pct: 7 },
  { stage: "DD / IC-2+", value: 12, pct: 5 },
  { stage: "Approved", value: 8, pct: 3 },
  { stage: "Closed", value: 6, pct: 2 },
];

// Value creation bridge per deal
const valueCreationBridge = [
  { category: "Revenue Growth", contribution: 35, color: "#3b82f6" },
  { category: "EBITDA Margin", contribution: 22, color: "#10b981" },
  { category: "Multiple Expansion", contribution: 18, color: "#8b5cf6" },
  { category: "Debt Paydown", contribution: 15, color: "#f59e0b" },
  { category: "Add-on M&A", contribution: 10, color: "#ec4899" },
];

// ─── Interfaces ───────────────────────────────────────────────────

interface Meeting {
  id: string;
  deal_name: string;
  sector: string;
  meeting_date: string;
  deal_size: string;
  outcome: string;
  summary: string;
}

interface DrillDownState {
  type: "sector" | "vintage" | "deal" | "funnel" | "irr" | "kpi" | null;
  data: any;
  title: string;
}

// ─── Custom Tooltip ────────────────────────────────────────────────

function PETooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-elevated rounded-lg px-3 py-2 text-xs shadow-lg border border-border">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}{p.name?.includes("IRR") || p.name?.includes("%") ? "%" : p.name?.includes("MOIC") ? "x" : ""}</span>
        </div>
      ))}
    </div>
  );
}

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="glass-elevated rounded-lg px-3 py-2 text-xs shadow-lg border border-border">
      <p className="font-semibold mb-1">{d.name}</p>
      <p className="text-muted-foreground">{d.sector}</p>
      <div className="mt-1 space-y-0.5">
        <p>IRR: <span className="font-medium">{d.irr}%</span></p>
        <p>MOIC: <span className="font-medium">{d.moic}x</span></p>
        <p>EV: <span className="font-medium">${d.ev}M</span></p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drillDown, setDrillDown] = useState<DrillDownState>({ type: null, data: null, title: "" });
  const [expandedVintage, setExpandedVintage] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: meetingsData } = await supabase
        .from("ic_meetings")
        .select("*")
        .order("meeting_date", { ascending: false });
      setMeetings(meetingsData || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeDrillDown = () => setDrillDown({ type: null, data: null, title: "" });

  const handleVintageClick = (vintage: typeof vintageData[0]) => {
    setDrillDown({
      type: "vintage",
      data: vintage,
      title: `Vintage ${vintage.vintage} — ${vintage.deals} Deals`,
    });
  };

  const handleDealClick = (deal: typeof dealAttribution[0]) => {
    setDrillDown({
      type: "deal",
      data: deal,
      title: `${deal.name} — Deal Attribution`,
    });
  };

  const handleFunnelClick = (stage: typeof funnelData[0]) => {
    const stageMeetings = meetings.filter(m => {
      if (stage.stage === "Approved") return m.outcome === "approved";
      if (stage.stage === "Closed") return m.outcome === "approved";
      return true;
    });
    setDrillDown({
      type: "funnel",
      data: { ...stage, meetings: stageMeetings.slice(0, 10) },
      title: `${stage.stage} — ${stage.value} Deals (${stage.pct}% conversion)`,
    });
  };

  const handleIRRClick = (bucket: typeof irrDistribution[0]) => {
    const dealsInRange = dealAttribution.filter(d => {
      if (bucket.range === "<0%") return d.irr < 0;
      if (bucket.range === "30%+") return d.irr >= 30;
      const [lo, hi] = bucket.range.replace("%", "").split("-").map(Number);
      return d.irr >= lo && d.irr < hi;
    });
    setDrillDown({
      type: "irr",
      data: { ...bucket, deals: dealsInRange },
      title: `IRR Range: ${bucket.range} — ${bucket.count} Deals`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Fund Analytics & Intelligence</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Portfolio performance, deal attribution, and IC conversion analytics &middot; Fund VII
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-medium">
            Fund VII &middot; $2.4B AUM
          </Badge>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        {[
          { label: "Net IRR", value: "18.4%", sub: "+2.1pp vs F6", positive: true, detail: {
            title: "Net IRR Analysis — 18.4%",
            metrics: [
              { label: "Fund VII Net IRR", value: "18.4%" },
              { label: "Fund VI Net IRR", value: "16.3%" },
              { label: "Peer Median", value: "14.2%" },
              { label: "Top Quartile", value: "21.0%" },
            ],
            insight: "Fund VII is tracking 2.1pp above Fund VI at the same point in lifecycle and sits comfortably in the top quartile. Key driver is higher entry quality — average EBITDA margin of our portfolio is 21% vs 17% in Fund VI."
          }},
          { label: "Gross MOIC", value: "2.3x", sub: "Top quartile", positive: true, detail: {
            title: "Gross MOIC Breakdown — 2.3x",
            metrics: [
              { label: "Realized MOIC", value: "2.8x" },
              { label: "Unrealized MOIC", value: "1.9x" },
              { label: "Fund VI MOIC (same vintage)", value: "2.0x" },
              { label: "Benchmark Median", value: "1.7x" },
            ],
            insight: "Realized exits are driving strong MOIC at 2.8x. Unrealized portfolio at 1.9x has upside as 3 investments are in active value creation phase with exit timelines in 2027-2028."
          }},
          { label: "DPI", value: "0.4x", sub: "Early vintage", detail: {
            title: "DPI (Distributions to Paid-In) — 0.4x",
            metrics: [
              { label: "Total Distributions", value: "$560M" },
              { label: "Total Paid-In Capital", value: "$1.4B" },
              { label: "Fund VI DPI (same age)", value: "0.3x" },
              { label: "Peer Median", value: "0.2x" },
            ],
            insight: "DPI of 0.4x is ahead of plan for this vintage stage. Early partial exit from TalentBridge HR Tech contributed $180M in distributions. Two more exits planned for H2 2026."
          }},
          { label: "TVPI", value: "1.8x", sub: "vs 1.5x median", positive: true, detail: {
            title: "TVPI (Total Value to Paid-In) — 1.8x",
            metrics: [
              { label: "NAV", value: "$2.52B" },
              { label: "Distributions", value: "$560M" },
              { label: "Paid-In Capital", value: "$1.4B" },
              { label: "Peer Median TVPI", value: "1.5x" },
            ],
            insight: "TVPI of 1.8x reflects strong portfolio appreciation. 60% of NAV is supported by recent third-party valuations or comparable transactions, providing confidence in markings."
          }},
          { label: "Deals Closed", value: "14", sub: "6 in pipeline", detail: {
            title: "Deal Activity — 14 Closed, 6 in Pipeline",
            metrics: [
              { label: "Deals Closed (Fund VII)", value: "14" },
              { label: "Currently in Pipeline", value: "6" },
              { label: "Avg Deal Size", value: "$165M equity" },
              { label: "Capital Deployed", value: "$2.31B (96%)" },
            ],
            insight: "Fund VII is 96% deployed across 14 investments. Remaining $90M reserved for follow-on investments in existing portfolio companies. 6 new opportunities in active evaluation for Fund VIII."
          }},
          { label: "Avg Hold", value: "4.2y", sub: "Target 4-5y", detail: {
            title: "Average Hold Period — 4.2 Years",
            metrics: [
              { label: "Avg Hold (Realized)", value: "3.8 years" },
              { label: "Avg Hold (Unrealized)", value: "4.5 years" },
              { label: "Target Hold Period", value: "4-5 years" },
              { label: "Longest Hold", value: "6.2 years" },
            ],
            insight: "Portfolio is within target hold period. Realized exits averaged 3.8 years driven by strong buy-and-build execution. Two investments at 5+ year marks are in active exit processes."
          }},
          { label: "Loss Ratio", value: "4.2%", sub: "Below 5% target", positive: true, detail: {
            title: "Loss Ratio — 4.2%",
            metrics: [
              { label: "Write-Downs", value: "$58.8M" },
              { label: "Total Invested", value: "$1.4B" },
              { label: "Target Max Loss Ratio", value: "5.0%" },
              { label: "Fund VI Loss Ratio", value: "6.8%" },
            ],
            insight: "Loss ratio of 4.2% is well below the 5% target and significantly improved from Fund VI (6.8%). Only one partial write-down across the portfolio — improved due diligence processes are a key factor."
          }},
          { label: "IC Pass Rate", value: "67%", sub: "Last 12 months", detail: {
            title: "IC Pass Rate — 67%",
            metrics: [
              { label: "Deals Presented to IC", value: "36" },
              { label: "Approved", value: "24" },
              { label: "Rejected", value: "8" },
              { label: "Deferred", value: "4" },
            ],
            insight: "67% approval rate reflects disciplined but not overly restrictive IC process. Deferred deals (11%) often return with improved terms — 75% of deferred deals were eventually approved after re-presentation."
          }},
        ].map((kpi, i) => (
          <div
            key={i}
            className="metric-card text-center cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
            onClick={() => setDrillDown({ type: "kpi", data: kpi.detail, title: kpi.detail.title })}
          >
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className="text-lg font-bold tabular-nums leading-none">{kpi.value}</p>
            <div className={cn("flex items-center justify-center gap-0.5 mt-1 text-[10px]", kpi.positive ? "text-emerald-500" : "text-muted-foreground")}>
              {kpi.positive && <ArrowUpRight className="w-2.5 h-2.5" />}
              <span>{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-5">
        <TabsList className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <TabsTrigger value="performance">
            <DollarSign className="w-4 h-4 mr-1.5" />
            Fund Performance
          </TabsTrigger>
          <TabsTrigger value="attribution">
            <Target className="w-4 h-4 mr-1.5" />
            Deal Attribution
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <Layers className="w-4 h-4 mr-1.5" />
            Pipeline Analytics
          </TabsTrigger>
          <TabsTrigger value="sectors">
            <PieChartIcon className="w-4 h-4 mr-1.5" />
            Sector Deep Dive
          </TabsTrigger>
        </TabsList>

        {/* ── Fund Performance Tab ─────────────────────────── */}
        <TabsContent value="performance" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {/* Value Creation Waterfall */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Value Creation Waterfall ($M)
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Gross returns decomposition across portfolio</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<PETooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* J-Curve */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  J-Curve Analysis (Net IRR %)
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Fund VII vs Fund VI vs peer benchmark</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={jCurveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip content={<PETooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="fund7" name="Fund VII" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
                    <Line type="monotone" dataKey="fund6" name="Fund VI" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke="#94a3b8" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Vintage Year Analysis */}
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Vintage Year Performance
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Click a vintage year to drill down into deal-level performance</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">Vintage</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">Deals</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">Net IRR</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">Gross MOIC</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">DPI</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">TVPI</th>
                      <th className="py-2 text-xs text-muted-foreground font-medium w-32">IRR Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vintageData.map((v) => (
                      <tr
                        key={v.vintage}
                        className="border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                        onClick={() => handleVintageClick(v)}
                      >
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                            <span className="font-medium">{v.vintage}</span>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">{v.deals}</td>
                        <td className={cn("text-right font-semibold tabular-nums", v.irr >= 25 ? "text-emerald-500" : v.irr >= 20 ? "text-foreground" : "text-amber-500")}>
                          {v.irr}%
                        </td>
                        <td className={cn("text-right font-medium tabular-nums", v.moic >= 3 ? "text-emerald-500" : "text-foreground")}>
                          {v.moic}x
                        </td>
                        <td className="text-right tabular-nums text-muted-foreground">{v.dpi}x</td>
                        <td className="text-right tabular-nums">{v.tvpi}x</td>
                        <td>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${Math.min(v.irr / 35 * 100, 100)}%`, background: v.color }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* IRR Distribution */}
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "250ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Portfolio IRR Distribution
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Click a bar to view deals in that IRR range</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={irrDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "# Deals", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<PETooltip />} />
                  <Bar dataKey="count" name="Deals" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleIRRClick}>
                    {irrDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Deal Attribution Tab ─────────────────────────── */}
        <TabsContent value="attribution" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {/* IRR vs MOIC Scatter */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Deal Returns: IRR vs MOIC
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Bubble size = enterprise value. Click a deal to drill down.</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                    <XAxis dataKey="irr" name="IRR" unit="%" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "IRR %", position: "bottom", fontSize: 10 }} />
                    <YAxis dataKey="moic" name="MOIC" unit="x" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "MOIC", angle: -90, position: "insideLeft", fontSize: 10 }} />
                    <ZAxis dataKey="ev" range={[60, 400]} />
                    <Tooltip content={<ScatterTooltip />} />
                    <Scatter
                      data={dealAttribution}
                      fill="#3b82f6"
                      fillOpacity={0.7}
                      stroke="#3b82f6"
                      strokeWidth={1}
                      cursor="pointer"
                      onClick={(data) => handleDealClick(data)}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Value Creation Bridge */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Value Creation Drivers (% of Total Returns)
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Average contribution across realized portfolio</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {valueCreationBridge.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium">{item.category}</span>
                        <span className="font-semibold tabular-nums">{item.contribution}%</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.contribution}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Organic growth drives 57% of returns</span>
                  <Badge variant="secondary" className="text-[10px]">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Insight
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deal-Level Performance Table */}
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Deal-Level Attribution
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Click any deal for detailed attribution analysis</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">Deal</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">Sector</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">EV</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">IRR</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">MOIC</th>
                      <th className="py-2 text-xs text-muted-foreground font-medium w-24">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealAttribution.sort((a, b) => b.irr - a.irr).map((deal) => (
                      <tr
                        key={deal.name}
                        className="border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                        onClick={() => handleDealClick(deal)}
                      >
                        <td className="py-2.5 font-medium">{deal.name}</td>
                        <td>
                          <Badge variant="secondary" className="text-[10px]">{deal.sector}</Badge>
                        </td>
                        <td className="text-right tabular-nums">${deal.ev}M</td>
                        <td className={cn("text-right font-semibold tabular-nums", deal.irr >= 25 ? "text-emerald-500" : deal.irr >= 20 ? "text-foreground" : "text-amber-500")}>
                          {deal.irr}%
                        </td>
                        <td className={cn("text-right font-medium tabular-nums", deal.moic >= 3 ? "text-emerald-500" : "text-foreground")}>
                          {deal.moic}x
                        </td>
                        <td>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(deal.irr / 35 * 100, 100)}%`,
                                background: deal.irr >= 25 ? "#10b981" : deal.irr >= 20 ? "#3b82f6" : "#f59e0b",
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pipeline Analytics Tab ───────────────────────── */}
        <TabsContent value="pipeline" className="space-y-5">
          {/* IC Conversion Funnel */}
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                IC Conversion Funnel (Last 12 Months)
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Click any stage to view deals at that point</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-2">
                {funnelData.map((stage, i) => (
                  <div
                    key={stage.stage}
                    className="group cursor-pointer hover:bg-secondary/30 rounded-lg p-2 transition-colors"
                    onClick={() => handleFunnelClick(stage)}
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stage.stage}</span>
                        <Badge variant="secondary" className="text-[10px] tabular-nums">{stage.value}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{stage.pct}%</span>
                    </div>
                    <div className="h-6 bg-secondary rounded-md overflow-hidden relative">
                      <div
                        className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                        style={{
                          width: `${stage.pct}%`,
                          background: `hsl(${221 - i * 15}, 83%, ${53 + i * 3}%)`,
                          minWidth: stage.pct < 5 ? "40px" : undefined,
                        }}
                      >
                        {stage.pct >= 10 && (
                          <span className="text-[10px] text-white font-medium">{stage.value}</span>
                        )}
                      </div>
                    </div>
                    {i < funnelData.length - 1 && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                        {Math.round((funnelData[i + 1].value / stage.value) * 100)}% conversion to next stage
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">AI Pipeline Insight</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Your sourced-to-closed conversion rate of 2.4% is above the industry median of 1.8%.
                      The biggest drop-off is at CIM Review (48% attrition) — consider pre-screening criteria refinement.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            {/* Time in Stage */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Average Days in Stage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={[
                      { stage: "Initial Review", days: 7, target: 5 },
                      { stage: "CIM/Screening", days: 12, target: 10 },
                      { stage: "Mgmt Meeting", days: 15, target: 14 },
                      { stage: "LOI", days: 10, target: 10 },
                      { stage: "DD", days: 45, target: 40 },
                      { stage: "IC Process", days: 18, target: 14 },
                      { stage: "Closing", days: 30, target: 30 },
                    ]}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit=" d" />
                    <YAxis dataKey="stage" type="category" width={90} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<PETooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="days" name="Actual" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="target" name="Target" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} fillOpacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* IC Outcomes Over Time */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  IC Outcomes Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={[
                      { q: "Q1'24", approved: 3, rejected: 2, deferred: 1 },
                      { q: "Q2'24", approved: 4, rejected: 1, deferred: 2 },
                      { q: "Q3'24", approved: 2, rejected: 3, deferred: 1 },
                      { q: "Q4'24", approved: 5, rejected: 2, deferred: 0 },
                      { q: "Q1'25", approved: 4, rejected: 1, deferred: 1 },
                      { q: "Q2'25", approved: 3, rejected: 2, deferred: 2 },
                      { q: "Q3'25", approved: 5, rejected: 1, deferred: 1 },
                      { q: "Q4'25", approved: 6, rejected: 2, deferred: 0 },
                      { q: "Q1'26", approved: 4, rejected: 1, deferred: 1 },
                    ]}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                    <XAxis dataKey="q" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<PETooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                    <Area type="monotone" dataKey="approved" name="Approved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="deferred" name="Deferred" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="rejected" name="Rejected" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sector Deep Dive Tab ─────────────────────────── */}
        <TabsContent value="sectors" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {/* Sector Radar */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                  Sector Comparison Radar
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Multi-dimensional sector scoring</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={sectorRadarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid stroke="hsl(220, 13%, 91%)" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip content={<PETooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                    <Radar name="Healthcare" dataKey="healthcare" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Technology" dataKey="technology" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Industrials" dataKey="industrials" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Fin Services" dataKey="finserv" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={1.5} />
                    <Radar name="Consumer" dataKey="consumer" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sector Capital Deployment */}
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Capital Deployment by Sector
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Technology", value: 1800, color: "#3b82f6" },
                        { name: "Healthcare", value: 1240, color: "#10b981" },
                        { name: "Financial Svc", value: 1340, color: "#8b5cf6" },
                        { name: "Industrials", value: 780, color: "#6366f1" },
                        { name: "Consumer", value: 385, color: "#f59e0b" },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {[
                        { color: "#3b82f6" },
                        { color: "#10b981" },
                        { color: "#8b5cf6" },
                        { color: "#6366f1" },
                        { color: "#f59e0b" },
                      ].map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<PETooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sector Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            {[
              { sector: "Technology", deals: 6, irr: 29.1, moic: 3.2, deployed: "$1.8B", approval: 72, color: "#3b82f6" },
              { sector: "Healthcare", deals: 4, irr: 22.0, moic: 2.5, deployed: "$1.24B", approval: 68, color: "#10b981" },
              { sector: "Fin Services", deals: 3, irr: 20.0, moic: 2.1, deployed: "$1.34B", approval: 60, color: "#8b5cf6" },
              { sector: "Industrials", deals: 3, irr: 26.0, moic: 2.7, deployed: "$780M", approval: 75, color: "#6366f1" },
              { sector: "Consumer", deals: 1, irr: 21.5, moic: 2.4, deployed: "$385M", approval: 55, color: "#f59e0b" },
            ].map((s) => (
              <Card key={s.sector} className="glass hover:border-primary/30 transition-all cursor-pointer" onClick={() => {
                const sectorKey = s.sector.toLowerCase().replace(/ /g, "_").replace("fin_services", "financial_services");
                const sectorMeetings = meetings.filter(m => m.sector === sectorKey);
                setDrillDown({ type: "sector", data: sectorMeetings, title: `${s.sector} — IC Meetings` });
              }}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="font-semibold text-sm">{s.sector}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Avg IRR</p>
                      <p className={cn("font-semibold", s.irr >= 25 ? "text-emerald-500" : "text-foreground")}>{s.irr}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">MOIC</p>
                      <p className="font-semibold">{s.moic}x</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deployed</p>
                      <p className="font-semibold">{s.deployed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approval</p>
                      <p className="font-semibold">{s.approval}%</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.approval}%`, background: s.color, opacity: 0.7 }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Drill-down Dialog */}
      <Dialog open={drillDown.type !== null} onOpenChange={() => closeDrillDown()}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={closeDrillDown} className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {drillDown.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {drillDown.type === "vintage" && drillDown.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Net IRR", value: `${drillDown.data.irr}%`, color: drillDown.data.irr >= 25 ? "text-emerald-500" : "" },
                    { label: "Gross MOIC", value: `${drillDown.data.moic}x` },
                    { label: "DPI", value: `${drillDown.data.dpi}x` },
                    { label: "TVPI", value: `${drillDown.data.tvpi}x` },
                  ].map((m) => (
                    <div key={m.label} className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className={cn("text-xl font-bold tabular-nums", m.color)}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">Vintage Analysis</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {drillDown.data.irr >= 25
                          ? `Strong vintage with ${drillDown.data.irr}% IRR driven by favorable entry multiples and operational improvements. Top quartile performance relative to peers.`
                          : `Vintage tracking at ${drillDown.data.irr}% IRR. ${drillDown.data.dpi < 0.5 ? "Still early in hold period — expect DPI improvement as exits materialize." : "Healthy DPI indicates strong cash-on-cash returns."}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {drillDown.type === "deal" && drillDown.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Sector", value: drillDown.data.sector },
                    { label: "Enterprise Value", value: `$${drillDown.data.ev}M` },
                    { label: "Target IRR", value: `${drillDown.data.irr}%`, color: drillDown.data.irr >= 25 ? "text-emerald-500" : "" },
                    { label: "Target MOIC", value: `${drillDown.data.moic}x` },
                  ].map((m) => (
                    <div key={m.label} className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className={cn("text-lg font-bold tabular-nums", m.color)}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Estimated Value Creation Split</h4>
                  {valueCreationBridge.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{item.category}</span>
                        <span className="font-medium tabular-nums">{item.contribution}%</span>
                      </div>
                      <Progress value={item.contribution} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drillDown.type === "funnel" && drillDown.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground">Deals at Stage</p>
                    <p className="text-xl font-bold tabular-nums">{drillDown.data.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                    <p className="text-xl font-bold tabular-nums">{drillDown.data.pct}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground">From Total Sourced</p>
                    <p className="text-xl font-bold tabular-nums">245</p>
                  </div>
                </div>
                {drillDown.data.meetings?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recent Meetings</h4>
                    {drillDown.data.meetings.map((m: Meeting) => (
                      <div key={m.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{m.deal_name}</p>
                          <p className="text-xs text-muted-foreground">{m.sector?.replace(/_/g, " ")} &middot; {new Date(m.meeting_date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[10px] capitalize",
                          m.outcome === "approved" && "border-green-500 text-green-500",
                          m.outcome === "rejected" && "border-red-500 text-red-500",
                        )}>
                          {m.outcome || "pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drillDown.type === "irr" && drillDown.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground">IRR Range</p>
                    <p className="text-xl font-bold">{drillDown.data.range}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground">Deals in Range</p>
                    <p className="text-xl font-bold tabular-nums">{drillDown.data.count}</p>
                  </div>
                </div>
                {drillDown.data.deals?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Deals</h4>
                    {drillDown.data.deals.map((d: any) => (
                      <div key={d.name} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.sector} &middot; ${d.ev}M EV</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-semibold text-sm tabular-nums", d.irr >= 25 ? "text-emerald-500" : "")}>{d.irr}% IRR</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{d.moic}x MOIC</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drillDown.type === "kpi" && drillDown.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {drillDown.data.metrics.map((m: any) => (
                    <div key={m.label} className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-xl font-bold tabular-nums">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">AI Analysis</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{drillDown.data.insight}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {drillDown.type === "sector" && (
              <div className="space-y-3">
                {(drillDown.data as Meeting[])?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No IC meetings found for this sector</p>
                ) : (
                  (drillDown.data as Meeting[])?.map((meeting) => (
                    <div key={meeting.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <h4 className="font-medium truncate">{meeting.deal_name}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {meeting.sector?.replace(/_/g, " ")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(meeting.meeting_date).toLocaleDateString()}
                            </span>
                            {meeting.deal_size && <span>${meeting.deal_size}</span>}
                          </div>
                          {meeting.summary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.summary}</p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 capitalize",
                            meeting.outcome === "approved" && "border-green-500 text-green-500",
                            meeting.outcome === "rejected" && "border-red-500 text-red-500",
                            meeting.outcome === "pending" && "border-yellow-500 text-yellow-500",
                            meeting.outcome === "deferred" && "border-blue-500 text-blue-500"
                          )}
                        >
                          {meeting.outcome || "pending"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
