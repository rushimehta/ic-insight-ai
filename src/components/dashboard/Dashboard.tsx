import { FileText, MessageSquare, HelpCircle, TrendingUp } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { InsightCard } from "./InsightCard";
import { RecentDealsTable } from "./RecentDealsTable";

const insights = [
  {
    type: "insight" as const,
    title: "Valuation Multiples Trend",
    description: "Recent ICs have shown increased scrutiny on revenue multiples above 15x, especially in SaaS deals.",
    source: "TechVentures Series B IC",
  },
  {
    type: "warning" as const,
    title: "Customer Concentration Risk",
    description: "Questions about customer concentration (>30% from single customer) appeared in 8 of last 10 ICs.",
    source: "Pattern Analysis",
  },
  {
    type: "trend" as const,
    title: "ESG Due Diligence",
    description: "ESG-related questions have increased 45% over the past quarter across all deal types.",
    source: "IC Question Trends",
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">AI-powered insights from your investment committee history</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Documents Analyzed"
          value="1,284"
          subtitle="PDFs & Emails"
          icon={FileText}
          trend={{ value: 12, positive: true }}
          delay={100}
        />
        <StatsCard
          title="IC Meetings"
          value="156"
          subtitle="Last 24 months"
          icon={MessageSquare}
          delay={150}
        />
        <StatsCard
          title="Questions Catalogued"
          value="4,721"
          subtitle="Unique questions"
          icon={HelpCircle}
          trend={{ value: 8, positive: true }}
          delay={200}
        />
        <StatsCard
          title="Success Rate"
          value="78%"
          subtitle="Deal approval rate"
          icon={TrendingUp}
          delay={250}
        />
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
            <h3 className="font-semibold">AI Insights</h3>
            <span className="text-xs text-primary">View all →</span>
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
