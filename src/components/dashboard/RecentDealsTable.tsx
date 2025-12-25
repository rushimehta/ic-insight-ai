import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  name: string;
  sector: string;
  date: string;
  status: "approved" | "rejected" | "pending";
  questionsCount: number;
}

const mockDeals: Deal[] = [
  { id: "1", name: "TechVentures Series B", sector: "Technology", date: "2024-01-15", status: "approved", questionsCount: 24 },
  { id: "2", name: "HealthCare Plus Acquisition", sector: "Healthcare", date: "2024-01-12", status: "approved", questionsCount: 31 },
  { id: "3", name: "GreenEnergy Fund III", sector: "Energy", date: "2024-01-10", status: "pending", questionsCount: 18 },
  { id: "4", name: "FinTech Innovations", sector: "Financial Services", date: "2024-01-08", status: "rejected", questionsCount: 42 },
  { id: "5", name: "Real Estate Growth", sector: "Real Estate", date: "2024-01-05", status: "approved", questionsCount: 27 },
];

const statusColors = {
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

export function RecentDealsTable() {
  return (
    <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Recent Investment Committees</h3>
        <p className="text-xs text-muted-foreground mt-1">Last 5 IC meetings</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Deal Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Sector</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Questions</th>
            </tr>
          </thead>
          <tbody>
            {mockDeals.map((deal, index) => (
              <tr 
                key={deal.id} 
                className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-sm">{deal.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{deal.sector}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{deal.date}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("capitalize text-xs", statusColors[deal.status])}>
                    {deal.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{deal.questionsCount}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
