import { useEffect, useState } from "react";
import {
  FileText, MessageSquare, TrendingUp, Users, Briefcase, Clock,
  CheckCircle, Building2, DollarSign, Target, ArrowUpRight,
  ArrowDownRight, BarChart3, PieChart, Activity, ChevronRight,
  Layers, AlertTriangle, Zap, Globe, TrendingDown, Eye
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { InsightCard } from "./InsightCard";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// ─── Sample PE Deal Data ────────────────────────────────────────────
interface PEDeal {
  id: string;
  name: string;
  company: string;
  sector: string;
  stage: string;
  icStage: string;
  ev: string;
  evEbitda: string;
  irr: string;
  moic: string;
  status: "approved" | "rejected" | "pending" | "in_diligence";
  leadPartner: string;
  nextIC: string;
  daysInStage: number;
  fundingRound: string;
}

const sampleDeals: PEDeal[] = [
  { id: "1", name: "Project Atlas", company: "MedDevice Holdings", sector: "Healthcare", stage: "IC Scheduled", icStage: "IC2", ev: "$425M", evEbitda: "12.5x", irr: "22%", moic: "2.8x", status: "pending", leadPartner: "J. Morrison", nextIC: "2026-03-15", daysInStage: 12, fundingRound: "LBO" },
  { id: "2", name: "Project Beacon", company: "CloudScale Systems", sector: "Technology", stage: "Due Diligence", icStage: "IC1", ev: "$680M", evEbitda: "18.2x", irr: "28%", moic: "3.2x", status: "in_diligence", leadPartner: "S. Chen", nextIC: "2026-03-22", daysInStage: 8, fundingRound: "Growth Equity" },
  { id: "3", name: "Project Citadel", company: "Premier Waste Solutions", sector: "Industrials", stage: "IC Complete", icStage: "IC3", ev: "$310M", evEbitda: "9.8x", irr: "25%", moic: "2.5x", status: "approved", leadPartner: "R. Patel", nextIC: "-", daysInStage: 3, fundingRound: "LBO" },
  { id: "4", name: "Project Delta", company: "NexGen Insurance Group", sector: "Financial Services", stage: "IC Scheduled", icStage: "IC Final", ev: "$890M", evEbitda: "14.1x", irr: "19%", moic: "2.1x", status: "pending", leadPartner: "M. Williams", nextIC: "2026-03-12", daysInStage: 21, fundingRound: "LBO" },
  { id: "5", name: "Project Echo", company: "TalentBridge HR Tech", sector: "Technology", stage: "Approved", icStage: "IC Final", ev: "$215M", evEbitda: "22.0x", irr: "32%", moic: "3.8x", status: "approved", leadPartner: "A. Foster", nextIC: "-", daysInStage: 5, fundingRound: "Growth Equity" },
  { id: "6", name: "Project Falcon", company: "GreenPark Logistics", sector: "Industrials", stage: "Initial Review", icStage: "-", ev: "$175M", evEbitda: "8.2x", irr: "26%", moic: "2.9x", status: "in_diligence", leadPartner: "D. Kim", nextIC: "TBD", daysInStage: 4, fundingRound: "LBO" },
  { id: "7", name: "Project Granite", company: "Apex Dental Partners", sector: "Healthcare", stage: "Passed", icStage: "IC2", ev: "$520M", evEbitda: "15.3x", irr: "16%", moic: "1.8x", status: "rejected", leadPartner: "J. Morrison", nextIC: "-", daysInStage: 0, fundingRound: "Platform Build-Up" },
  { id: "8", name: "Project Horizon", company: "DataVault Analytics", sector: "Technology", stage: "Due Diligence", icStage: "IC1", ev: "$340M", evEbitda: "16.5x", irr: "24%", moic: "2.6x", status: "in_diligence", leadPartner: "S. Chen", nextIC: "2026-04-01", daysInStage: 15, fundingRound: "Growth Equity" },
];

interface SectorMetrics {
  sector: string;
  activeDeals: number;
  avgEVEbitda: number;
  avgIRR: number;
  capitalDeployed: string;
  approvalRate: number;
}

const sectorMetrics: SectorMetrics[] = [
  { sector: "Healthcare", activeDeals: 4, avgEVEbitda: 13.9, avgIRR: 22, capitalDeployed: "$1.2B", approvalRate: 68 },
  { sector: "Technology", activeDeals: 6, avgEVEbitda: 18.9, avgIRR: 28, capitalDeployed: "$1.8B", approvalRate: 72 },
  { sector: "Industrials", activeDeals: 3, avgEVEbitda: 9.0, avgIRR: 25, capitalDeployed: "$780M", approvalRate: 75 },
  { sector: "Financial Services", activeDeals: 2, avgEVEbitda: 12.5, avgIRR: 20, capitalDeployed: "$650M", approvalRate: 60 },
  { sector: "Consumer", activeDeals: 2, avgEVEbitda: 11.2, avgIRR: 21, capitalDeployed: "$420M", approvalRate: 55 },
];

const upcomingICs = [
  { deal: "Project Delta", date: "Mar 12, 2026", stage: "IC Final", type: "Final Decision", priority: "critical" },
  { deal: "Project Atlas", date: "Mar 15, 2026", stage: "IC2", type: "Deep Dive", priority: "high" },
  { deal: "Project Beacon", date: "Mar 22, 2026", stage: "IC1", type: "Initial Presentation", priority: "medium" },
  { deal: "Project Horizon", date: "Apr 1, 2026", stage: "IC1", type: "Initial Presentation", priority: "normal" },
];

const statusColors: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  in_diligence: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  normal: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

interface DashboardStats {
  documentsCount: number;
  meetingsCount: number;
  draftsCount: number;
  pendingReviewCount: number;
  approvalRate: number;
}

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
  const totalPipelineEV = "$3.06B";
  const avgPortfolioIRR = "24.5%";
  const avgMOIC = "2.7x";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Deal Command Center</h2>
            <p className="text-muted-foreground mt-1">Real-time portfolio intelligence and IC pipeline overview</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              {roles.includes("admin") ? "Administrator" : roles.includes("ic_chairman") ? "IC Chairman" : roles.includes("ic_member") ? "IC Member" : "Deal Team"}
            </Badge>
            <Badge className="bg-primary/10 text-primary border border-primary/20">
              Fund VII &middot; $2.4B
            </Badge>
          </div>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="glass rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate("/pipeline")}>
          <p className="text-xs text-muted-foreground mb-1">Active Deals</p>
          <p className="text-2xl font-bold">{activeDeals.length}</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-emerald-500 text-xs">
            <ArrowUpRight className="w-3 h-3" /> +2 this month
          </div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pipeline EV</p>
          <p className="text-2xl font-bold">{totalPipelineEV}</p>
          <p className="text-xs text-muted-foreground mt-1">Total enterprise value</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Avg Target IRR</p>
          <p className="text-2xl font-bold text-emerald-500">{avgPortfolioIRR}</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-emerald-500 text-xs">
            <ArrowUpRight className="w-3 h-3" /> +1.2% vs Fund VI
          </div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Avg MOIC</p>
          <p className="text-2xl font-bold">{avgMOIC}</p>
          <p className="text-xs text-muted-foreground mt-1">Blended target</p>
        </div>
        <div className="glass rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate("/history")}>
          <p className="text-xs text-muted-foreground mb-1">IC Meetings YTD</p>
          <p className="text-2xl font-bold">{(stats.meetingsCount || 14)}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.approvalRate || 67}% approval rate</p>
        </div>
        <div className="glass rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate("/repository")}>
          <p className="text-xs text-muted-foreground mb-1">IC Decks Archived</p>
          <p className="text-2xl font-bold">{stats.documentsCount || 47}</p>
          <p className="text-xs text-muted-foreground mt-1">Searchable history</p>
        </div>
      </div>

      {/* Main Content: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Upcoming ICs + Sector Drill-Down */}
        <div className="lg:col-span-3 space-y-6">
          {/* Upcoming ICs */}
          <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Upcoming ICs</h3>
              </div>
              <Badge variant="secondary" className="text-xs">{upcomingICs.length}</Badge>
            </div>
            <div className="divide-y divide-border/50">
              {upcomingICs.map((ic, i) => (
                <div key={i} className="p-3 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate("/history")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{ic.deal}</span>
                    <Badge variant="outline" className={cn("text-[10px] border", priorityColors[ic.priority])}>
                      {ic.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ic.date}</span>
                    <span>{ic.stage} &middot; {ic.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Performance Drill-Down */}
          <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Sector Overview</h3>
              </div>
              {selectedSector && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedSector(null)}>
                  Clear
                </Button>
              )}
            </div>
            <div className="divide-y divide-border/50">
              {sectorMetrics.map((sm) => (
                <button
                  key={sm.sector}
                  onClick={() => setSelectedSector(selectedSector === sm.sector ? null : sm.sector)}
                  className={cn(
                    "w-full p-3 text-left hover:bg-secondary/30 transition-all",
                    selectedSector === sm.sector && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm">{sm.sector}</span>
                    <span className="text-xs text-muted-foreground">{sm.activeDeals} deals</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">EV/EBITDA</p>
                      <p className="font-medium">{sm.avgEVEbitda}x</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg IRR</p>
                      <p className="font-medium text-emerald-500">{sm.avgIRR}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approval</p>
                      <p className="font-medium">{sm.approvalRate}%</p>
                    </div>
                  </div>
                  <Progress value={sm.approvalRate} className="h-1 mt-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Active Deal Pipeline */}
        <div className="lg:col-span-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Active Deal Pipeline
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSector ? `Filtered: ${selectedSector}` : "All sectors"} &middot; Click deal to expand
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/pipeline")}>
                View Kanban <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Deal</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Sector</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">EV</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">EV/EBITDA</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">IRR</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">MOIC</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <>
                      <tr
                        key={deal.id}
                        onClick={() => setExpandedDealId(expandedDealId === deal.id ? null : deal.id)}
                        className="border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{deal.name}</p>
                            <p className="text-xs text-muted-foreground">{deal.company}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="secondary" className="text-xs">{deal.sector}</Badge>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium">{deal.ev}</td>
                        <td className="px-3 py-3 text-sm">{deal.evEbitda}</td>
                        <td className="px-3 py-3">
                          <span className={cn("text-sm font-medium", parseFloat(deal.irr) >= 25 ? "text-emerald-500" : parseFloat(deal.irr) >= 20 ? "text-amber-500" : "text-red-400")}>
                            {deal.irr}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium">{deal.moic}</td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={cn("text-[10px] border", statusColors[deal.status])}>
                            {deal.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                      </tr>
                      {expandedDealId === deal.id && (
                        <tr key={`${deal.id}-detail`} className="bg-secondary/10">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Lead Partner</p>
                                <p className="font-medium">{deal.leadPartner}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">IC Stage</p>
                                <p className="font-medium">{deal.icStage}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Next IC Date</p>
                                <p className="font-medium">{deal.nextIC}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Deal Type</p>
                                <p className="font-medium">{deal.fundingRound}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Days in Stage</p>
                                <p className="font-medium">{deal.daysInStage}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Pipeline Stage</p>
                                <p className="font-medium">{deal.stage}</p>
                              </div>
                              <div className="col-span-2 flex gap-2">
                                <Button variant="outline" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); navigate("/chat"); }}>
                                  <MessageSquare className="w-3 h-3 mr-1" /> Ask AI About Deal
                                </Button>
                                <Button variant="outline" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); navigate("/questions"); }}>
                                  <Target className="w-3 h-3 mr-1" /> Prep IC Questions
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights + Quick Actions */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions */}
          <div className="glass rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationDelay: "250ms" }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-sm" onClick={() => navigate("/generator")}>
                <FileText className="w-4 h-4 mr-2 text-primary" /> New IC Memo
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-sm" onClick={() => navigate("/documents")}>
                <ArrowUpRight className="w-4 h-4 mr-2 text-primary" /> Upload IC Deck
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-sm" onClick={() => navigate("/chat")}>
                <MessageSquare className="w-4 h-4 mr-2 text-primary" /> Ask Deal Advisor AI
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-sm" onClick={() => navigate("/connectors")}>
                <Globe className="w-4 h-4 mr-2 text-primary" /> Data Connectors
              </Button>
            </div>
          </div>

          {/* AI-Powered Deal Insights */}
          <div className="space-y-3 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h3 className="font-semibold text-sm flex items-center gap-2 px-1">
              <Activity className="w-4 h-4 text-primary" />
              Deal Intelligence
            </h3>
            <InsightCard
              type="warning"
              title="Valuation Alert: Project Delta"
              description="EV/EBITDA of 14.1x is 18% above sector median for insurance platforms. Historical IC approval at this multiple is 42%."
              source="AI Valuation Analysis"
              delay={350}
            />
            <InsightCard
              type="trend"
              title="Healthcare Multiples Rising"
              description="Healthcare services EV/EBITDA expanded from 11.2x to 13.9x over 12 months. Project Atlas positioned favorably at 12.5x."
              source="Market Intelligence"
              delay={400}
            />
            <InsightCard
              type="insight"
              title="IC Pattern: Management Risk"
              description="Last 8 rejected deals had management concentration as a top-3 concern. Ensure Project Beacon addresses key-person dependencies."
              source="IC Pattern Analysis"
              delay={450}
            />
            <InsightCard
              type="warning"
              title="Due Diligence Gap"
              description="Project Beacon has been in DD for 15 days without a quality of earnings report. Similar deals averaged 10 days at this stage."
              source="Process Monitoring"
              delay={500}
            />
          </div>

          {/* Fund Deployment Tracker */}
          <div className="glass rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationDelay: "350ms" }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Fund VII Deployment
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Capital Deployed</span>
                  <span className="font-medium">$1.4B / $2.4B</span>
                </div>
                <Progress value={58} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">58% deployed &middot; 4 platform investments</p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Dry Powder</span>
                  <span className="font-medium text-emerald-500">$1.0B</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Pipeline Coverage</span>
                  <span className="font-medium">3.1x</span>
                </div>
                <p className="text-xs text-muted-foreground">Pipeline vs remaining commitment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
