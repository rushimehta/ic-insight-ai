import { useEffect, useState, Fragment } from "react";
import {
  FileText, MessageSquare, Clock, DollarSign, Target, ArrowUpRight,
  BarChart3, Activity, ChevronRight, ChevronDown,
  Layers, Zap, Globe, Sparkles, Calendar, ArrowRight
} from "lucide-react";
import { InsightCard } from "./InsightCard";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";

// ─── Interfaces ─────────────────────────────────────────────────────

interface PEDeal {
  id: string;
  name: string;
  company: string;
  sector: string;
  stage: string;
  icStage: string;
  ev: string;
  evNum: number;
  ebitda: string;
  evEbitda: string;
  irr: number;
  moic: number;
  status: "approved" | "rejected" | "pending" | "in_diligence" | "loi";
  leadPartner: string;
  nextIC: string;
  daysInStage: number;
  fundingRound: string;
  leverage: string;
  equityCheck: string;
  sponsor: string;
  vintage: number;
  holdPeriod: string;
  revenue: string;
  revenueGrowth: number;
  ebitdaMargin: number;
  sparkline: number[];
}

interface SectorMetrics {
  sector: string;
  icon: string;
  activeDeals: number;
  avgEVEbitda: number;
  avgIRR: number;
  capitalDeployed: string;
  deployedNum: number;
  approvalRate: number;
  dealFlow: number[];
  color: string;
}

interface DashboardStats {
  documentsCount: number;
  meetingsCount: number;
  draftsCount: number;
  pendingReviewCount: number;
  approvalRate: number;
}

// ─── Sample PE Deal Data ────────────────────────────────────────────

const sampleDeals: PEDeal[] = [
  {
    id: "1", name: "Project Atlas", company: "MedDevice Holdings Inc.", sector: "Healthcare",
    stage: "IC Scheduled", icStage: "IC-2", ev: "$425M", evNum: 425, ebitda: "$34M",
    evEbitda: "12.5x", irr: 22.4, moic: 2.8, status: "pending", leadPartner: "J. Morrison",
    nextIC: "2026-03-15", daysInStage: 12, fundingRound: "LBO",
    leverage: "5.2x", equityCheck: "$185M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "4-5 yrs", revenue: "$312M", revenueGrowth: 14.2, ebitdaMargin: 28.1,
    sparkline: [18, 20, 19, 22, 21, 24, 22]
  },
  {
    id: "2", name: "Project Beacon", company: "CloudScale Systems", sector: "Technology",
    stage: "Due Diligence", icStage: "IC-1", ev: "$680M", evNum: 680, ebitda: "$37M",
    evEbitda: "18.2x", irr: 28.1, moic: 3.2, status: "in_diligence", leadPartner: "S. Chen",
    nextIC: "2026-03-22", daysInStage: 8, fundingRound: "Growth Equity",
    leverage: "3.0x", equityCheck: "$310M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "5-7 yrs", revenue: "$189M", revenueGrowth: 42.5, ebitdaMargin: 19.6,
    sparkline: [22, 25, 24, 28, 27, 30, 28]
  },
  {
    id: "3", name: "Project Citadel", company: "Premier Waste Solutions", sector: "Industrials",
    stage: "IC Complete", icStage: "IC-3", ev: "$310M", evNum: 310, ebitda: "$32M",
    evEbitda: "9.8x", irr: 25.3, moic: 2.5, status: "approved", leadPartner: "R. Patel",
    nextIC: "-", daysInStage: 3, fundingRound: "LBO",
    leverage: "5.8x", equityCheck: "$125M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "4-5 yrs", revenue: "$478M", revenueGrowth: 8.1, ebitdaMargin: 22.4,
    sparkline: [20, 22, 23, 25, 24, 26, 25]
  },
  {
    id: "4", name: "Project Delta", company: "NexGen Insurance Group", sector: "Financial Services",
    stage: "IC Scheduled", icStage: "IC Final", ev: "$890M", evNum: 890, ebitda: "$63M",
    evEbitda: "14.1x", irr: 19.2, moic: 2.1, status: "pending", leadPartner: "M. Williams",
    nextIC: "2026-03-12", daysInStage: 21, fundingRound: "LBO",
    leverage: "4.5x", equityCheck: "$420M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "5-6 yrs", revenue: "$1.2B", revenueGrowth: 6.3, ebitdaMargin: 18.7,
    sparkline: [16, 17, 18, 19, 18, 20, 19]
  },
  {
    id: "5", name: "Project Echo", company: "TalentBridge HR Tech", sector: "Technology",
    stage: "Approved", icStage: "IC Final", ev: "$215M", evNum: 215, ebitda: "$10M",
    evEbitda: "22.0x", irr: 32.4, moic: 3.8, status: "approved", leadPartner: "A. Foster",
    nextIC: "-", daysInStage: 5, fundingRound: "Growth Equity",
    leverage: "2.5x", equityCheck: "$145M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "5-7 yrs", revenue: "$68M", revenueGrowth: 58.3, ebitdaMargin: 14.2,
    sparkline: [26, 28, 30, 29, 32, 31, 34]
  },
  {
    id: "6", name: "Project Falcon", company: "GreenPark Logistics", sector: "Industrials",
    stage: "Initial Review", icStage: "-", ev: "$175M", evNum: 175, ebitda: "$21M",
    evEbitda: "8.2x", irr: 26.7, moic: 2.9, status: "in_diligence", leadPartner: "D. Kim",
    nextIC: "TBD", daysInStage: 4, fundingRound: "LBO",
    leverage: "5.5x", equityCheck: "$72M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "3-5 yrs", revenue: "$290M", revenueGrowth: 11.4, ebitdaMargin: 24.8,
    sparkline: [21, 23, 24, 25, 26, 27, 27]
  },
  {
    id: "7", name: "Project Granite", company: "Apex Dental Partners", sector: "Healthcare",
    stage: "Passed", icStage: "IC-2", ev: "$520M", evNum: 520, ebitda: "$34M",
    evEbitda: "15.3x", irr: 16.1, moic: 1.8, status: "rejected", leadPartner: "J. Morrison",
    nextIC: "-", daysInStage: 0, fundingRound: "Platform Build-Up",
    leverage: "6.2x", equityCheck: "$210M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "5-7 yrs", revenue: "$245M", revenueGrowth: 18.2, ebitdaMargin: 13.8,
    sparkline: [14, 15, 16, 15, 17, 16, 16]
  },
  {
    id: "8", name: "Project Horizon", company: "DataVault Analytics", sector: "Technology",
    stage: "Due Diligence", icStage: "IC-1", ev: "$340M", evNum: 340, ebitda: "$21M",
    evEbitda: "16.5x", irr: 24.8, moic: 2.6, status: "in_diligence", leadPartner: "S. Chen",
    nextIC: "2026-04-01", daysInStage: 15, fundingRound: "Growth Equity",
    leverage: "3.2x", equityCheck: "$195M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "5-6 yrs", revenue: "$112M", revenueGrowth: 35.7, ebitdaMargin: 18.5,
    sparkline: [20, 22, 21, 24, 23, 25, 25]
  },
  {
    id: "9", name: "Project Ironclad", company: "Fortis Cybersecurity", sector: "Technology",
    stage: "LOI Submitted", icStage: "Pre-IC", ev: "$560M", evNum: 560, ebitda: "$28M",
    evEbitda: "20.0x", irr: 30.2, moic: 3.5, status: "loi", leadPartner: "S. Chen",
    nextIC: "2026-04-08", daysInStage: 6, fundingRound: "Growth Equity",
    leverage: "2.8x", equityCheck: "$340M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "5-7 yrs", revenue: "$156M", revenueGrowth: 62.1, ebitdaMargin: 17.9,
    sparkline: [24, 27, 26, 29, 28, 31, 30]
  },
  {
    id: "10", name: "Project Jupiter", company: "AmeriCare Home Health", sector: "Healthcare",
    stage: "IC Scheduled", icStage: "IC-1", ev: "$290M", evNum: 290, ebitda: "$29M",
    evEbitda: "10.0x", irr: 23.6, moic: 2.7, status: "pending", leadPartner: "R. Patel",
    nextIC: "2026-03-28", daysInStage: 9, fundingRound: "LBO",
    leverage: "5.0x", equityCheck: "$118M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "4-5 yrs", revenue: "$410M", revenueGrowth: 12.8, ebitdaMargin: 21.3,
    sparkline: [19, 21, 22, 23, 22, 24, 24]
  },
  {
    id: "11", name: "Project Keystone", company: "Summit Consumer Brands", sector: "Consumer",
    stage: "Due Diligence", icStage: "IC-1", ev: "$385M", evNum: 385, ebitda: "$35M",
    evEbitda: "11.0x", irr: 21.5, moic: 2.4, status: "in_diligence", leadPartner: "M. Williams",
    nextIC: "2026-04-05", daysInStage: 11, fundingRound: "LBO",
    leverage: "4.8x", equityCheck: "$165M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "4-6 yrs", revenue: "$520M", revenueGrowth: 7.4, ebitdaMargin: 18.1,
    sparkline: [18, 19, 20, 21, 20, 22, 22]
  },
  {
    id: "12", name: "Project Liberty", company: "PayStream Financial", sector: "Financial Services",
    stage: "Initial Review", icStage: "-", ev: "$445M", evNum: 445, ebitda: "$38M",
    evEbitda: "11.7x", irr: 20.8, moic: 2.3, status: "in_diligence", leadPartner: "A. Foster",
    nextIC: "TBD", daysInStage: 3, fundingRound: "LBO",
    leverage: "4.2x", equityCheck: "$225M", sponsor: "Fund VII", vintage: 2026,
    holdPeriod: "4-5 yrs", revenue: "$380M", revenueGrowth: 15.6, ebitdaMargin: 22.9,
    sparkline: [17, 18, 19, 20, 21, 20, 21]
  },
];

const sectorMetrics: SectorMetrics[] = [
  { sector: "Healthcare", icon: "H", activeDeals: 4, avgEVEbitda: 12.6, avgIRR: 22.0, capitalDeployed: "$1.24B", deployedNum: 1240, approvalRate: 68, dealFlow: [3, 5, 4, 6, 5, 7, 4], color: "#3b82f6" },
  { sector: "Technology", icon: "T", activeDeals: 6, avgEVEbitda: 19.2, avgIRR: 29.1, capitalDeployed: "$1.80B", deployedNum: 1800, approvalRate: 72, dealFlow: [4, 6, 5, 8, 7, 9, 6], color: "#8b5cf6" },
  { sector: "Industrials", icon: "I", activeDeals: 3, avgEVEbitda: 9.0, avgIRR: 26.0, capitalDeployed: "$780M", deployedNum: 780, approvalRate: 75, dealFlow: [2, 3, 3, 4, 3, 5, 3], color: "#10b981" },
  { sector: "Financial Services", icon: "F", activeDeals: 3, avgEVEbitda: 12.9, avgIRR: 20.0, capitalDeployed: "$1.34B", deployedNum: 1340, approvalRate: 60, dealFlow: [2, 2, 3, 3, 2, 4, 3], color: "#f59e0b" },
  { sector: "Consumer", icon: "C", activeDeals: 1, avgEVEbitda: 11.0, avgIRR: 21.5, capitalDeployed: "$385M", deployedNum: 385, approvalRate: 55, dealFlow: [1, 2, 1, 3, 2, 2, 1], color: "#ef4444" },
];

const upcomingICs = [
  { deal: "Project Delta", date: "Mar 12", stage: "IC Final", type: "Final Decision", priority: "critical" as const, partner: "M. Williams" },
  { deal: "Project Atlas", date: "Mar 15", stage: "IC-2", type: "Deep Dive", priority: "high" as const, partner: "J. Morrison" },
  { deal: "Project Beacon", date: "Mar 22", stage: "IC-1", type: "Initial Presentation", priority: "medium" as const, partner: "S. Chen" },
  { deal: "Project Jupiter", date: "Mar 28", stage: "IC-1", type: "Initial Presentation", priority: "medium" as const, partner: "R. Patel" },
  { deal: "Project Horizon", date: "Apr 1", stage: "IC-1", type: "Follow-Up", priority: "normal" as const, partner: "S. Chen" },
  { deal: "Project Keystone", date: "Apr 5", stage: "IC-1", type: "Initial Presentation", priority: "normal" as const, partner: "M. Williams" },
];

const dealFlowTrend = [
  { month: "Sep", sourced: 12, screened: 8, ic: 3, closed: 1 },
  { month: "Oct", sourced: 15, screened: 10, ic: 4, closed: 2 },
  { month: "Nov", sourced: 18, screened: 11, ic: 5, closed: 1 },
  { month: "Dec", sourced: 14, screened: 9, ic: 3, closed: 2 },
  { month: "Jan", sourced: 20, screened: 13, ic: 6, closed: 2 },
  { month: "Feb", sourced: 22, screened: 15, ic: 7, closed: 3 },
  { month: "Mar", sourced: 19, screened: 12, ic: 5, closed: 2 },
];

const fundDeploymentData = [
  { name: "Deployed", value: 1400, color: "hsl(221, 83%, 53%)" },
  { name: "Reserved", value: 350, color: "hsl(262, 83%, 58%)" },
  { name: "Dry Powder", value: 650, color: "hsl(220, 14%, 80%)" },
];

// ─── Utility Maps ───────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "badge-positive" },
  rejected: { label: "Passed", className: "badge-negative" },
  pending: { label: "IC Pending", className: "badge-neutral" },
  in_diligence: { label: "Diligence", className: "badge-info" },
  loi: { label: "LOI", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

const priorityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  normal: "bg-slate-400",
};

function irrColor(irr: number) {
  if (irr >= 25) return "text-emerald-500";
  if (irr >= 20) return "text-amber-500";
  return "text-red-400";
}

function moicColor(moic: number) {
  if (moic >= 3.0) return "text-emerald-500";
  if (moic >= 2.0) return "text-foreground";
  return "text-red-400";
}

// ─── Mini Sparkline Component ───────────────────────────────────────

function MiniSparkline({ data, color = "hsl(221, 83%, 53%)" }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="h-7 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, "")})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Custom Tooltip ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-elevated rounded-lg px-3 py-2 text-xs shadow-lg border border-border">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function RoleDashboard() {
  const { roles, sectors, isChairmanOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    documentsCount: 0, meetingsCount: 0, draftsCount: 0, pendingReviewCount: 0, approvalRate: 0,
  });
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!permissionsLoading) fetchStats();
  }, [permissionsLoading, roles, sectors]);

  const fetchStats = async () => {
    try {
      const { count: docsCount } = await supabase.from("documents").select("*", { count: "exact", head: true });
      const { count: meetingsCount } = await supabase.from("ic_meetings").select("*", { count: "exact", head: true });
      const { count: draftsCount } = await supabase.from("ic_drafts").select("*", { count: "exact", head: true });
      const { count: pendingCount } = await supabase.from("meeting_notes").select("*", { count: "exact", head: true }).eq("status", "draft");
      const { data: meetings } = await supabase.from("ic_meetings").select("outcome");
      const approved = meetings?.filter(m => m.outcome === "approved").length || 0;
      const total = meetings?.length || 1;
      setStats({
        documentsCount: docsCount || 0,
        meetingsCount: meetingsCount || 0,
        draftsCount: draftsCount || 0,
        pendingReviewCount: pendingCount || 0,
        approvalRate: Math.round((approved / total) * 100),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDeals = selectedSector
    ? sampleDeals.filter(d => d.sector === selectedSector)
    : sampleDeals;

  const activeDeals = sampleDeals.filter(d => d.status !== "rejected");
  const totalPipelineEV = activeDeals.reduce((s, d) => s + d.evNum, 0);
  const avgIRR = (activeDeals.reduce((s, d) => s + d.irr, 0) / activeDeals.length).toFixed(1);
  const avgMOIC = (activeDeals.reduce((s, d) => s + d.moic, 0) / activeDeals.length).toFixed(1);
  const totalEquity = activeDeals.reduce((s, d) => s + parseFloat(d.equityCheck.replace(/[$M]/g, "")), 0);

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Deal Command Center</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Real-time portfolio intelligence &middot; Fund VII
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 font-medium">
              {roles.includes("admin") ? "Administrator" : roles.includes("ic_chairman") ? "IC Chairman" : roles.includes("ic_member") ? "IC Member" : "Deal Team"}
            </Badge>
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-medium">
              Fund VII &middot; $2.4B
            </Badge>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        {[
          {
            label: "Active Deals", value: activeDeals.length.toString(), sub: "+3 this quarter",
            subColor: "text-emerald-500", icon: ArrowUpRight, nav: "/pipeline",
          },
          {
            label: "Pipeline EV", value: `$${(totalPipelineEV / 1000).toFixed(1)}B`, sub: "Total enterprise value",
            nav: "/pipeline",
          },
          {
            label: "Avg Target IRR", value: `${avgIRR}%`, sub: "+1.2pp vs Fund VI",
            subColor: "text-emerald-500", icon: ArrowUpRight, valueColor: irrColor(parseFloat(avgIRR)),
          },
          {
            label: "Avg MOIC", value: `${avgMOIC}x`, sub: "Blended target",
            valueColor: moicColor(parseFloat(avgMOIC)),
          },
          {
            label: "Equity in Pipeline", value: `$${(totalEquity / 1000).toFixed(1)}B`, sub: `${activeDeals.length} active opportunities`,
          },
          {
            label: "IC Meetings YTD", value: (stats.meetingsCount || 14).toString(),
            sub: `${stats.approvalRate || 67}% approval rate`, nav: "/history",
          },
          {
            label: "IC Decks Filed", value: (stats.documentsCount || 47).toString(),
            sub: "Searchable archive", nav: "/repository",
          },
        ].map((kpi, i) => {
          const SubIcon = kpi.icon;
          return (
            <div
              key={i}
              onClick={kpi.nav ? () => navigate(kpi.nav!) : undefined}
              className={cn(
                "metric-card text-center group",
                kpi.nav && "drill-down"
              )}
            >
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                {kpi.label}
              </p>
              <p className={cn("text-xl font-bold tabular-nums leading-none", kpi.valueColor)}>
                {kpi.value}
              </p>
              <div className={cn(
                "flex items-center justify-center gap-1 mt-1.5 text-[11px]",
                kpi.subColor || "text-muted-foreground"
              )}>
                {SubIcon && <SubIcon className="w-3 h-3" />}
                <span>{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Deal Flow Trend + Fund Deployment Row ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Deal Flow Area Chart */}
        <div className="lg:col-span-8 glass rounded-xl overflow-hidden">
          <div className="section-header px-5 pt-4 pb-0">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Deal Flow Trend
              </h3>
              <p className="section-subtitle">Monthly pipeline progression</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/pipeline")}>
              Full Pipeline <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="h-52 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dealFlowTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <defs>
                  <linearGradient id="gradSourced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradIC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="sourced" name="Sourced" stroke="hsl(221, 83%, 53%)" strokeWidth={2} fill="url(#gradSourced)" dot={false} />
                <Area type="monotone" dataKey="screened" name="Screened" stroke="hsl(262, 83%, 58%)" strokeWidth={2} fill="url(#gradIC)" dot={false} />
                <Area type="monotone" dataKey="ic" name="IC Stage" stroke="hsl(43, 96%, 56%)" strokeWidth={2} fill="transparent" dot={false} />
                <Area type="monotone" dataKey="closed" name="Closed" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fill="url(#gradClosed)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fund Deployment Donut */}
        <div className="lg:col-span-4 glass rounded-xl p-5">
          <h3 className="section-title flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            Fund VII Deployment
          </h3>
          <p className="section-subtitle mb-3">$2.4B total commitment</p>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundDeploymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {fundDeploymentData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold tabular-nums leading-none">58%</p>
                  <p className="text-[10px] text-muted-foreground">deployed</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {[
                { label: "Deployed", value: "$1.40B", pct: "58%", color: "bg-blue-500" },
                { label: "Reserved", value: "$350M", pct: "15%", color: "bg-purple-500" },
                { label: "Dry Powder", value: "$650M", pct: "27%", color: "bg-slate-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", item.color)} />
                  <span className="text-muted-foreground flex-1">{item.label}</span>
                  <span className="font-medium tabular-nums">{item.value}</span>
                  <span className="text-muted-foreground tabular-nums w-8 text-right">{item.pct}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pipeline coverage</span>
                  <span className="font-semibold tabular-nums">3.1x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content: Pipeline Table + Sidebar ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Pipeline Table */}
        <div className="lg:col-span-9 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="glass rounded-xl overflow-hidden">
            <div className="section-header px-5 pt-4 pb-0">
              <div>
                <h3 className="section-title flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Active Deal Pipeline
                </h3>
                <p className="section-subtitle">
                  {selectedSector ? `Filtered: ${selectedSector}` : "All sectors"} &middot; {filteredDeals.length} deals &middot; Click to expand
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedSector && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedSector(null)}>
                    Clear Filter
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate("/pipeline")}>
                  Kanban View <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto mt-3">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-8 px-3"></th>
                    <th>Deal / Company</th>
                    <th>Sector</th>
                    <th>EV</th>
                    <th>EV/EBITDA</th>
                    <th>IRR</th>
                    <th>MOIC</th>
                    <th>Trend</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => {
                    const isExpanded = expandedDealId === deal.id;
                    const sc = statusConfig[deal.status];
                    return (
                      <Fragment key={deal.id}>
                        <tr
                          onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}
                          className={cn(isExpanded && "bg-secondary/20")}
                        >
                          <td className="w-8 px-3 text-muted-foreground">
                            {isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5" />
                              : <ChevronRight className="w-3.5 h-3.5" />
                            }
                          </td>
                          <td>
                            <p className="font-medium text-sm">{deal.name}</p>
                            <p className="text-xs text-muted-foreground">{deal.company}</p>
                          </td>
                          <td>
                            <Badge variant="secondary" className="text-[10px] font-medium">{deal.sector}</Badge>
                          </td>
                          <td className="tabular-nums font-medium text-sm">{deal.ev}</td>
                          <td className="tabular-nums text-sm">{deal.evEbitda}</td>
                          <td>
                            <span className={cn("text-sm font-semibold tabular-nums", irrColor(deal.irr))}>
                              {deal.irr.toFixed(1)}%
                            </span>
                          </td>
                          <td>
                            <span className={cn("text-sm font-medium tabular-nums", moicColor(deal.moic))}>
                              {deal.moic.toFixed(1)}x
                            </span>
                          </td>
                          <td>
                            <MiniSparkline data={deal.sparkline} color={deal.irr >= 25 ? "hsl(160, 84%, 39%)" : "hsl(221, 83%, 53%)"} />
                          </td>
                          <td>
                            <Badge variant="outline" className={cn("text-[10px] border font-medium", sc.className)}>
                              {sc.label}
                            </Badge>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-secondary/10 hover:bg-secondary/10">
                            <td colSpan={9} className="px-5 py-4 !border-b-2 !border-b-primary/10">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3 text-sm mb-4">
                                {[
                                  { label: "Lead Partner", value: deal.leadPartner },
                                  { label: "IC Stage", value: deal.icStage },
                                  { label: "Next IC", value: deal.nextIC },
                                  { label: "Deal Type", value: deal.fundingRound },
                                  { label: "Days in Stage", value: deal.daysInStage.toString(), warn: deal.daysInStage > 14 },
                                  { label: "Leverage", value: deal.leverage },
                                  { label: "Equity Check", value: deal.equityCheck },
                                  { label: "Revenue", value: deal.revenue },
                                  { label: "Rev Growth", value: `${deal.revenueGrowth}%`, positive: deal.revenueGrowth > 15 },
                                  { label: "EBITDA Margin", value: `${deal.ebitdaMargin}%` },
                                  { label: "Hold Period", value: deal.holdPeriod },
                                  { label: "Sponsor", value: deal.sponsor },
                                  { label: "Vintage", value: deal.vintage.toString() },
                                  { label: "EBITDA", value: deal.ebitda },
                                  { label: "Pipeline Stage", value: deal.stage },
                                ].map((field) => (
                                  <div key={field.label}>
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{field.label}</p>
                                    <p className={cn(
                                      "font-medium tabular-nums",
                                      field.warn && "text-amber-500",
                                      field.positive && "text-emerald-500"
                                    )}>
                                      {field.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => { e.stopPropagation(); navigate("/chat"); }}
                                >
                                  <MessageSquare className="w-3 h-3 mr-1.5" /> AI Deal Analysis
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => { e.stopPropagation(); navigate("/questions"); }}
                                >
                                  <Target className="w-3 h-3 mr-1.5" /> IC Questions
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => { e.stopPropagation(); navigate("/generator"); }}
                                >
                                  <FileText className="w-3 h-3 mr-1.5" /> Generate Memo
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 ml-auto"
                                  onClick={(e) => { e.stopPropagation(); navigate("/pipeline"); }}
                                >
                                  View in Pipeline <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-5">

          {/* Upcoming ICs */}
          <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">IC Calendar</h3>
              </div>
              <Badge variant="secondary" className="text-[10px] font-medium">{upcomingICs.length} upcoming</Badge>
            </div>
            <div className="divide-y divide-border/40">
              {upcomingICs.map((ic, i) => (
                <div
                  key={i}
                  className="px-4 py-2.5 hover:bg-secondary/30 transition-colors cursor-pointer flex items-start gap-2.5"
                  onClick={() => navigate("/history")}
                >
                  <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", priorityDot[ic.priority])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{ic.deal}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums ml-2 shrink-0">{ic.date}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span>{ic.stage}</span>
                      <span className="opacity-40">&middot;</span>
                      <span>{ic.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Heat Map */}
          <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "250ms" }}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Sector Heat Map</h3>
              </div>
              {selectedSector && (
                <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={() => setSelectedSector(null)}>
                  Clear
                </Button>
              )}
            </div>
            <div className="divide-y divide-border/40">
              {sectorMetrics.map((sm) => {
                const isActive = selectedSector === sm.sector;
                const heatIntensity = Math.min(sm.avgIRR / 35, 1);
                return (
                  <button
                    key={sm.sector}
                    onClick={() => setSelectedSector(isActive ? null : sm.sector)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-secondary/30 transition-all",
                      isActive && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center"
                          style={{
                            background: `${sm.color}${Math.round(heatIntensity * 40 + 15).toString(16)}`,
                            color: sm.color,
                          }}
                        >
                          {sm.icon}
                        </div>
                        <span className="font-medium text-sm">{sm.sector}</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{sm.activeDeals} deals</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <p className="text-muted-foreground">EV/EBITDA</p>
                        <p className="font-semibold tabular-nums">{sm.avgEVEbitda}x</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg IRR</p>
                        <p className={cn("font-semibold tabular-nums", irrColor(sm.avgIRR))}>{sm.avgIRR}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deployed</p>
                        <p className="font-semibold tabular-nums">{sm.capitalDeployed}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${sm.approvalRate}%`,
                          background: sm.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{sm.approvalRate}% approval rate</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New IC Memo", icon: FileText, nav: "/generator" },
                { label: "Upload Deck", icon: ArrowUpRight, nav: "/documents" },
                { label: "Deal Advisor", icon: MessageSquare, nav: "/chat" },
                { label: "IC Questions", icon: Target, nav: "/questions" },
                { label: "Connectors", icon: Globe, nav: "/connectors" },
                { label: "Full Pipeline", icon: Layers, nav: "/pipeline" },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs justify-start gap-1.5 px-2.5"
                  onClick={() => navigate(action.nav)}
                >
                  <action.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Intelligence + Insights Row ──────────────────── */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: "350ms" }}>
        <div className="section-header">
          <div>
            <h3 className="section-title flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Deal Intelligence
            </h3>
            <p className="section-subtitle">Pattern analysis across IC history and market data</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/chat")}>
            Ask AI <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="cursor-pointer" onClick={() => navigate("/chat")}>
            <InsightCard
              type="warning"
              title="Valuation Alert: Project Delta"
              description="EV/EBITDA of 14.1x is 18% above sector median for insurance platforms. Historical IC approval at this multiple is 42%."
              source="AI Valuation Analysis"
              delay={400}
            />
          </div>
          <div className="cursor-pointer" onClick={() => navigate("/analytics")}>
            <InsightCard
              type="trend"
              title="Healthcare Multiples Expanding"
              description="Healthcare services EV/EBITDA expanded from 11.2x to 12.6x over 12 months. Project Atlas positioned favorably at 12.5x entry."
              source="Market Intelligence"
              delay={450}
            />
          </div>
          <div className="cursor-pointer" onClick={() => navigate("/questions")}>
            <InsightCard
              type="insight"
              title="IC Pattern: Key-Person Risk"
              description="Last 8 rejected deals had management concentration as a top-3 concern. Project Beacon should address key-person dependencies before IC-1."
              source="IC Pattern Analysis"
              delay={500}
            />
          </div>
          <div className="cursor-pointer" onClick={() => navigate("/pipeline")}>
            <InsightCard
              type="warning"
              title="Due Diligence Bottleneck"
              description="Project Beacon (15 days) and Project Keystone (11 days) in DD without QoE reports. Avg completion at peer funds: 10 days."
              source="Process Monitoring"
              delay={550}
            />
          </div>
        </div>
      </div>

      {/* ── Fund Performance Summary Row ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        {/* Portfolio Returns */}
        <div
          className="glass rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => navigate("/analytics")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Fund VII Portfolio Returns
            </h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Net IRR", value: "18.4%", sub: "+2.1pp vs benchmark", positive: true },
              { label: "Gross MOIC", value: "2.3x", sub: "Fund VI: 2.1x", positive: true },
              { label: "DPI", value: "0.4x", sub: "Early vintage" },
              { label: "TVPI", value: "1.8x", sub: "Top quartile", positive: true },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className="text-lg font-bold tabular-nums">{m.value}</p>
                <p className={cn("text-[11px]", m.positive ? "text-emerald-500" : "text-muted-foreground")}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent IC Decisions */}
        <div
          className="glass rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => navigate("/history")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent IC Decisions
            </h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="space-y-2.5">
            {[
              { deal: "Project Echo", outcome: "Approved", date: "Mar 4", badge: "badge-positive" },
              { deal: "Project Citadel", outcome: "Approved", date: "Mar 2", badge: "badge-positive" },
              { deal: "Project Granite", outcome: "Passed", date: "Feb 28", badge: "badge-negative" },
              { deal: "Project Delta", outcome: "Deferred", date: "Feb 25", badge: "badge-neutral" },
              { deal: "Project Falcon", outcome: "IC-1 Set", date: "Feb 22", badge: "badge-info" },
            ].map((d) => (
              <div key={d.deal} className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{d.deal}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground tabular-nums">{d.date}</span>
                  <Badge variant="outline" className={cn("text-[10px] font-medium", d.badge)}>{d.outcome}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Memory & Learning */}
        <div
          className="glass rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
          onClick={() => navigate("/chat")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Memory & Learning
            </h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="space-y-3">
            {[
              { label: "Knowledge Chunks", value: "2,847", progress: 78 },
              { label: "Deal Patterns", value: "342", progress: 65 },
              { label: "IC Feedback Loops", value: "156", progress: 52 },
              { label: "Sector Insights", value: "89", progress: 41 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground text-xs">{item.label}</span>
                  <span className="font-medium tabular-nums text-xs">{item.value}</span>
                </div>
                <Progress value={item.progress} className="h-1.5" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Last trained: 2 hours ago &middot; 98.4% confidence
          </p>
        </div>
      </div>
    </div>
  );
}
