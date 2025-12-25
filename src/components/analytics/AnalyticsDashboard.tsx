import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, Loader2, ArrowLeft, X, FileText, Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  sectorKey: string;
  approved: number;
  rejected: number;
  pending: number;
  deferred: number;
  total: number;
  approvalRate: number;
}

interface Meeting {
  id: string;
  deal_name: string;
  sector: string;
  meeting_date: string;
  deal_size: string;
  outcome: string;
  summary: string;
}

interface QuestionCategory {
  category: string;
  count: number;
  percentage: number;
  questions: { text: string; frequency: number }[];
}

interface DrillDownState {
  type: "sector" | "question" | "month" | null;
  data: any;
  title: string;
}

export function AnalyticsDashboard() {
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [questionData, setQuestionData] = useState<QuestionCategory[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drillDown, setDrillDown] = useState<DrillDownState>({ type: null, data: null, title: "" });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all IC meetings
      const { data: meetingsData } = await supabase
        .from("ic_meetings")
        .select("*")
        .order("meeting_date", { ascending: false });

      setMeetings(meetingsData || []);

      // Aggregate by sector
      const sectorMap: Record<string, { approved: number; rejected: number; pending: number; deferred: number }> = {};
      (meetingsData || []).forEach((m: any) => {
        const sector = m.sector || "other";
        if (!sectorMap[sector]) {
          sectorMap[sector] = { approved: 0, rejected: 0, pending: 0, deferred: 0 };
        }
        if (m.outcome === "approved") sectorMap[sector].approved++;
        else if (m.outcome === "rejected") sectorMap[sector].rejected++;
        else if (m.outcome === "deferred") sectorMap[sector].deferred++;
        else sectorMap[sector].pending++;
      });

      const sectorStats: SectorData[] = Object.entries(sectorMap).map(([sector, counts]) => ({
        sector: sector.replace(/_/g, " "),
        sectorKey: sector,
        ...counts,
        total: counts.approved + counts.rejected + counts.pending + counts.deferred,
        approvalRate: counts.approved + counts.rejected > 0 
          ? Math.round((counts.approved / (counts.approved + counts.rejected)) * 100) 
          : 0,
      }));
      setSectorData(sectorStats);

      // Aggregate by month for trends
      const monthMap: Record<string, { deals: number; approved: number; rejected: number }> = {};
      (meetingsData || []).forEach((m: any) => {
        const date = new Date(m.meeting_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { deals: 0, approved: 0, rejected: 0 };
        }
        monthMap[monthKey].deals++;
        if (m.outcome === "approved") monthMap[monthKey].approved++;
        if (m.outcome === "rejected") monthMap[monthKey].rejected++;
      });

      const trends = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-24)
        .map(([month, data]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          monthKey: month,
          ...data,
        }));
      setTrendData(trends);

      // Fetch question patterns with full data
      const { data: questions } = await supabase
        .from("question_patterns")
        .select("*");

      const categoryMap: Record<string, { count: number; questions: { text: string; frequency: number }[] }> = {};
      (questions || []).forEach((q: any) => {
        if (!categoryMap[q.category]) {
          categoryMap[q.category] = { count: 0, questions: [] };
        }
        categoryMap[q.category].count += q.frequency || 1;
        categoryMap[q.category].questions.push({ text: q.question_text, frequency: q.frequency || 1 });
      });

      const totalQuestions = Object.values(categoryMap).reduce((sum, c) => sum + c.count, 0);
      const questionStats: QuestionCategory[] = Object.entries(categoryMap)
        .map(([category, data]) => ({
          category,
          count: data.count,
          percentage: totalQuestions > 0 ? Math.round((data.count / totalQuestions) * 100) : 0,
          questions: data.questions.sort((a, b) => b.frequency - a.frequency),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setQuestionData(questionStats);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectorClick = (data: any) => {
    const sectorKey = data.sectorKey || data.sector?.replace(/ /g, "_");
    const sectorMeetings = meetings.filter(m => m.sector === sectorKey);
    setDrillDown({
      type: "sector",
      data: sectorMeetings,
      title: `${data.sector} - IC Meetings (${sectorMeetings.length})`,
    });
  };

  const handleQuestionClick = (data: QuestionCategory) => {
    setDrillDown({
      type: "question",
      data: data.questions,
      title: `${data.category} - Questions (${data.count})`,
    });
  };

  const handleMonthClick = (data: any) => {
    const monthMeetings = meetings.filter(m => {
      const date = new Date(m.meeting_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return monthKey === data.monthKey;
    });
    setDrillDown({
      type: "month",
      data: monthMeetings,
      title: `${data.month} - IC Meetings (${monthMeetings.length})`,
    });
  };

  const pieData = sectorData.map(s => ({
    name: s.sector,
    value: s.total,
    sectorKey: s.sectorKey,
    color: SECTOR_COLORS[s.sectorKey] || "#64748b",
  }));

  const closeDrillDown = () => setDrillDown({ type: null, data: null, title: "" });

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
          Investment committee performance metrics and trends. <span className="text-primary">Click any chart element to drill down.</span>
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
                <p className="text-xs text-muted-foreground">Click a bar to view deals</p>
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
                    <Bar 
                      dataKey="approvalRate" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]} 
                      cursor="pointer"
                      onClick={handleSectorClick}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Deal Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Deal Distribution by Sector</CardTitle>
                <p className="text-xs text-muted-foreground">Click a segment to view deals</p>
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
                      cursor="pointer"
                      onClick={(data) => handleSectorClick({ sector: data.name, sectorKey: data.sectorKey })}
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
              <p className="text-xs text-muted-foreground">Click a data point to view monthly details</p>
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
                  <Area 
                    type="monotone" 
                    dataKey="deals" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorDeals)" 
                    name="Total Deals" 
                    cursor="pointer"
                    activeDot={{ 
                      r: 6, 
                      cursor: "pointer",
                      onClick: (props: any) => props?.payload && handleMonthClick(props.payload)
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorApproved)" 
                    name="Approved" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-base">Sector Performance Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground">Click a bar to view underlying deals</p>
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
                  <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" cursor="pointer" onClick={handleSectorClick} />
                  <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" cursor="pointer" onClick={handleSectorClick} />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" cursor="pointer" onClick={handleSectorClick} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-base">Monthly IC Activity Trends</CardTitle>
              <p className="text-xs text-muted-foreground">Click a data point to view monthly IC meetings</p>
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
                  <Line 
                    type="monotone" 
                    dataKey="deals" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ r: 6, cursor: "pointer" }} 
                    activeDot={{ 
                      r: 8, 
                      cursor: "pointer",
                      onClick: (props: any) => props?.payload && handleMonthClick(props.payload)
                    }}
                    name="Total Deals" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    name="Approved" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rejected" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    name="Rejected" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card className="glass opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-base">Question Categories Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">Click a category to view specific questions</p>
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
                    formatter={(value: number) => [value, "Questions Asked"]}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]} 
                    name="Questions Asked" 
                    cursor="pointer"
                    onClick={(data) => handleQuestionClick(data as unknown as QuestionCategory)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
            {drillDown.type === "sector" || drillDown.type === "month" ? (
              <div className="space-y-3">
                {(drillDown.data as Meeting[])?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No meetings found</p>
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
            ) : drillDown.type === "question" ? (
              <div className="space-y-3">
                {(drillDown.data as { text: string; frequency: number }[])?.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm">{q.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Asked {q.frequency} times
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
