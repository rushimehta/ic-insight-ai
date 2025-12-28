import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Building2, TrendingUp } from "lucide-react";
import { useSectors } from "@/hooks/useSectors";
import { Deal } from "@/hooks/useDeals";

interface DealsBySectorViewProps {
  deals: Deal[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
];

const STAGE_ORDER = [
  "sourcing",
  "initial_review", 
  "deep_dive",
  "ic_preparation",
  "ic_review",
  "due_diligence",
  "closing",
  "closed",
  "passed"
];

export function DealsBySectorView({ deals }: DealsBySectorViewProps) {
  const { activeSectors } = useSectors();

  const sectorData = useMemo(() => {
    const grouped: Record<string, { count: number; totalSize: number; deals: Deal[] }> = {};
    
    deals.forEach(deal => {
      if (!grouped[deal.sector]) {
        grouped[deal.sector] = { count: 0, totalSize: 0, deals: [] };
      }
      grouped[deal.sector].count++;
      grouped[deal.sector].deals.push(deal);
      
      // Try to parse deal size
      const sizeMatch = deal.deal_size?.match(/\$?([\d.]+)/);
      if (sizeMatch) {
        grouped[deal.sector].totalSize += parseFloat(sizeMatch[1]);
      }
    });

    return Object.entries(grouped).map(([sector, data]) => {
      const sectorInfo = activeSectors.find(s => s.name === sector);
      return {
        name: sectorInfo?.display_name || sector.replace(/_/g, " "),
        sector,
        count: data.count,
        totalSize: data.totalSize,
        deals: data.deals,
      };
    }).sort((a, b) => b.count - a.count);
  }, [deals, activeSectors]);

  const stageData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    deals.forEach(deal => {
      grouped[deal.stage] = (grouped[deal.stage] || 0) + 1;
    });

    return STAGE_ORDER.filter(stage => grouped[stage]).map(stage => ({
      name: stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      count: grouped[stage] || 0,
    }));
  }, [deals]);

  const pieData = sectorData.map(s => ({
    name: s.name,
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Deals by Sector */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-primary" />
              Deals by Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No deals to display
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Deals by Stage */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-primary" />
              Deals by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No deals to display
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sector Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectorData.map((sector, idx) => (
          <Card key={sector.sector} className="glass">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                  />
                  <span className="font-medium">{sector.name}</span>
                </div>
                <Badge variant="secondary">{sector.count} deals</Badge>
              </div>
              <div className="space-y-2">
                {sector.deals.slice(0, 3).map(deal => (
                  <div key={deal.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 text-muted-foreground">{deal.deal_name}</span>
                    <Badge variant="outline" className="text-[10px] ml-2">
                      {deal.stage.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
                {sector.deals.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{sector.deals.length - 3} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
