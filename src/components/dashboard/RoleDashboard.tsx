import { useEffect, useState } from "react";
import { FileText, MessageSquare, HelpCircle, TrendingUp, Users, Briefcase, Clock, CheckCircle, AlertTriangle, Building2 } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { InsightCard } from "./InsightCard";
import { RecentDealsTable } from "./RecentDealsTable";
import { useUserPermissions, AppRole, SectorType } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardStats {
  documentsCount: number;
  meetingsCount: number;
  draftsCount: number;
  pendingReviewCount: number;
  approvalRate: number;
}

interface Insight {
  type: "insight" | "warning" | "trend";
  title: string;
  description: string;
  source: string;
}

export function RoleDashboard() {
  const { roles, sectors, isChairmanOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
  const [stats, setStats] = useState<DashboardStats>({
    documentsCount: 0,
    meetingsCount: 0,
    draftsCount: 0,
    pendingReviewCount: 0,
    approvalRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!permissionsLoading) {
      fetchStats();
    }
  }, [permissionsLoading, roles, sectors]);

  const fetchStats = async () => {
    try {
      // Fetch documents count
      const { count: docsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

      // Fetch IC meetings count
      const { count: meetingsCount } = await supabase
        .from("ic_meetings")
        .select("*", { count: "exact", head: true });

      // Fetch drafts count
      const { count: draftsCount } = await supabase
        .from("ic_drafts")
        .select("*", { count: "exact", head: true });

      // Fetch pending meeting notes (for chairman)
      const { count: pendingCount } = await supabase
        .from("meeting_notes")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");

      // Calculate approval rate from IC meetings
      const { data: meetings } = await supabase
        .from("ic_meetings")
        .select("outcome");

      const approved = meetings?.filter(m => m.outcome === "approved").length || 0;
      const total = meetings?.length || 1;
      const approvalRate = Math.round((approved / total) * 100);

      setStats({
        documentsCount: docsCount || 0,
        meetingsCount: meetingsCount || 0,
        draftsCount: draftsCount || 0,
        pendingReviewCount: pendingCount || 0,
        approvalRate,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Role-specific insights
  const getInsights = (): Insight[] => {
    if (isChairmanOrAdmin) {
      return [
        {
          type: "warning",
          title: "Pending Meeting Notes",
          description: `${stats.pendingReviewCount} meeting notes are in draft status and need to be finalized.`,
          source: "Chairman Dashboard",
        },
        {
          type: "insight",
          title: "Cross-Sector Trends",
          description: "Healthcare and Technology sectors showing highest IC activity this quarter.",
          source: "Analytics",
        },
        {
          type: "trend",
          title: "Question Pattern Analysis",
          description: "ESG and sustainability questions increased 40% in recent ICs across all sectors.",
          source: "AI Analysis",
        },
      ];
    }

    if (roles.includes("ic_member")) {
      return [
        {
          type: "insight",
          title: "Upcoming ICs in Your Sectors",
          description: `${sectors.length} sector(s) with active pipeline deals requiring IC review.`,
          source: "Sector Dashboard",
        },
        {
          type: "trend",
          title: "Common Questions This Month",
          description: "Management team experience and customer concentration are top themes.",
          source: "Question Prep",
        },
        {
          type: "warning",
          title: "Due Diligence Gaps",
          description: "3 deals flagged for additional sector-specific due diligence review.",
          source: "Deal Pipeline",
        },
      ];
    }

    // Deal team insights
    return [
      {
        type: "insight",
        title: "IC Preparation Tips",
        description: "Review past IC questions for similar deals to prepare stronger presentations.",
        source: "AI Recommendations",
      },
      {
        type: "trend",
        title: "Successful Pitch Patterns",
        description: "Deals with clear competitive moat sections have 23% higher approval rate.",
        source: "Pattern Analysis",
      },
      {
        type: "warning",
        title: "Common Rejection Reasons",
        description: "Valuation justification and management team concerns are top pushback areas.",
        source: "IC History",
      },
    ];
  };

  const getRoleLabel = (): string => {
    if (roles.includes("admin")) return "Administrator";
    if (roles.includes("ic_chairman")) return "IC Chairman";
    if (roles.includes("ic_member")) return "IC Member";
    if (roles.includes("deal_team")) return "Deal Team";
    return "Team Member";
  };

  const insights = getInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">AI-powered insights from your investment committee history</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              {getRoleLabel()}
            </Badge>
            {isChairmanOrAdmin && (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                All Sectors Access
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Role-specific Welcome Banner */}
      {isChairmanOrAdmin && (
        <div className="glass rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Full Access Enabled</p>
              <p className="text-sm text-muted-foreground">
                As {roles.includes("admin") ? "an Administrator" : "IC Chairman"}, you can view all ICs across all sectors and manage meeting notes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sector Access Banner for IC Members */}
      {!isChairmanOrAdmin && sectors.length > 0 && (
        <div className="glass rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="font-medium">Your Sector Access</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {sectors.map(sector => (
                  <Badge key={sector} variant="secondary" className="text-xs capitalize">
                    {sector.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Role-specific */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Documents Analyzed"
          value={stats.documentsCount.toLocaleString()}
          subtitle="PDFs & Emails"
          icon={FileText}
          delay={100}
        />
        <StatsCard
          title="IC Meetings"
          value={stats.meetingsCount.toLocaleString()}
          subtitle="Last 24 months"
          icon={MessageSquare}
          delay={150}
        />
        {isChairmanOrAdmin ? (
          <>
            <StatsCard
              title="Pending Notes"
              value={stats.pendingReviewCount.toString()}
              subtitle="Draft meeting notes"
              icon={Clock}
              delay={200}
            />
            <StatsCard
              title="Approval Rate"
              value={`${stats.approvalRate}%`}
              subtitle="All sectors"
              icon={CheckCircle}
              delay={250}
            />
          </>
        ) : (
          <>
            <StatsCard
              title="Your Drafts"
              value={stats.draftsCount.toString()}
              subtitle="IC documents"
              icon={Briefcase}
              delay={200}
            />
            <StatsCard
              title="Approval Rate"
              value={`${stats.approvalRate}%`}
              subtitle="Deal success rate"
              icon={TrendingUp}
              delay={250}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deals Table */}
        <div className="lg:col-span-2">
          <RecentDealsTable />
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="font-semibold">
              {isChairmanOrAdmin ? "Chairman Insights" : "AI Insights"}
            </h3>
            <span className="text-xs text-primary cursor-pointer hover:underline">View all →</span>
          </div>
          {insights.map((insight, index) => (
            <InsightCard
              key={index}
              {...insight}
              delay={300 + index * 100}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
