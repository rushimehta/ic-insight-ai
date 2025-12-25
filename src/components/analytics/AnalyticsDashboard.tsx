import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

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
};

interface SectorData {
  sector: string;
  approved: number;
  passed: number;
  pending: number;
  total: number;
  approvalRate: number;
}

interface TrendData {
  month: string;
  deals: number;
  approved: number;
  questions: number;
}

interface QuestionCategory {
  category: string;
  count: number;
  percentage: number;
}

export function AnalyticsDashboard() {
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [questionData, setQuestionData] = useState<QuestionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch IC meetings by sector
      const { data: meetings } = await supabase
        .from("ic_meetings")
        .select("sector, outcome, meeting_date");

      // Aggregate by sector
      const sectorMap: Record<string, { approved: number; passed: number; pending: number }> = {};
      (meetings || []).forEach((m: any) => {
        const sector = m.sector || "other";
        if (!sectorMap[sector]) {
          sectorMap[sector] = { approved: 0, passed: 0, pending: 0 };
        }
        if (m.outcome === "approved") sectorMap[sector].approved++;
        else if (m.outcome === "passed" || m.outcome === "rejected") sectorMap[sector].passed++;
        else sectorMap[sector].pending++;
      });

      const sectorStats: SectorData[] = Object.entries(sectorMap).map(([sector, counts]) => ({
        sector: sector.replace("_", " "),
        ...counts,
        total: counts.approved + counts.passed + counts.pending,
        approvalRate: counts.approved + counts.passed > 0 
          ? Math.round((counts.approved / (counts.approved + counts.passed)) * 100) 
          : 0,
      }));
      setSectorData(sectorStats);

      // Aggregate by month for trends
      const monthMap: Record<string, { deals: number; approved: number }> = {};
      (meetings || []).forEach((m: any) => {
        const date = new Date(m.meeting_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { deals: 0, approved: 0 };
        }
        monthMap[monthKey].deals++;
        if (m.outcome === "approved") monthMap[monthKey].approved++;
      });

      // Fetch question patterns
      const { data: questions } = await supabase
        .from("question_patterns")
        .select("category, frequency");

      const categoryMap: Record<string, number> = {};
      let totalQuestions = 0;
      (questions || []).forEach((q: any) => {
        categoryMap[q.category] = (categoryMap[q.category] || 0) + (q.frequency || 1);
        totalQuestions += q.frequency || 1;
      });

      const questionStats: QuestionCategory[] = Object.entries(categoryMap)
        .map(([category, count]) => ({
          category,
          count,
          percentage: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setQuestionData(questionStats);

      // Create trend data with questions
      const trends: TrendData[] = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, data]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          deals: data.deals,
          approved: data.approved,
          questions: Math.floor(Math.random() * 50) + 20, // Placeholder for demo
        }));
      setTrendData(trends);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pieData = sectorData.map(s => ({
    name: s.sector,
    value: s.total,
    color: SECTOR_COLORS[s.sector.replace(" ", "_")] || "#64748b",
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Investment committee performance metrics and trends
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sectors">
            <PieChartIcon className="w-4 h-4 mr-2" />
            By Sector
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="questions">
            <Activity className="w-4 h-4 mr-2" />
            Question Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {/* Approval Rate by Sector */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Approval Rate by Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="sector" type="category" width={100} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`${value}%`, "Approval Rate"]}
                    />
                    <Bar dataKey="approvalRate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Deal Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Deal Distribution by Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Deal Flow Over Time */}
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <CardTitle className="text-base">Deal Flow Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="deals" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorDeals)" name="Total Deals" />
                  <Area type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" name="Approved" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-base">Sector Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sectorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="sector" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                  <Bar dataKey="passed" stackId="a" fill="#ef4444" name="Passed" />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-base">Monthly IC Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="deals" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Total Deals" />
                  <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Approved" />
                  <Line type="monotone" dataKey="questions" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Questions Asked" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-base">Question Categories Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={questionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="category" type="category" width={150} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number, name: string) => [value, name === "count" ? "Questions" : name]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Questions Asked" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
