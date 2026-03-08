import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ICMeeting {
  id: string;
  dealName: string;
  company: string;
  sector: string;
  date: string;
  icStage: string;
  outcome: "approved" | "rejected" | "deferred" | "pending" | "conditions";
  ev: string;
  keyTopic: string;
}

const recentICMeetings: ICMeeting[] = [
  { id: "1", dealName: "Project Citadel", company: "Premier Waste Solutions", sector: "Industrials", date: "2026-03-05", icStage: "IC3", outcome: "approved", ev: "$310M", keyTopic: "Add-on pipeline validation" },
  { id: "2", dealName: "Project Echo", company: "TalentBridge HR Tech", sector: "Technology", date: "2026-03-01", icStage: "IC Final", outcome: "approved", ev: "$215M", keyTopic: "Final terms & closing conditions" },
  { id: "3", dealName: "Project Granite", company: "Apex Dental Partners", sector: "Healthcare", date: "2026-02-25", icStage: "IC2", outcome: "rejected", ev: "$520M", keyTopic: "Reimbursement risk too high" },
  { id: "4", dealName: "Project Atlas", company: "MedDevice Holdings", sector: "Healthcare", date: "2026-02-20", icStage: "IC1", outcome: "conditions", ev: "$425M", keyTopic: "DD authorization with conditions" },
  { id: "5", dealName: "Project Beacon", company: "CloudScale Systems", sector: "Technology", date: "2026-02-15", icStage: "IC1", outcome: "approved", ev: "$680M", keyTopic: "Growth equity screening approved" },
];

const outcomeColors: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  deferred: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  conditions: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

const stageColors: Record<string, string> = {
  IC1: "text-blue-400",
  IC2: "text-purple-400",
  IC3: "text-orange-400",
  "IC Final": "text-emerald-400",
};

export function RecentDealsTable() {
  const navigate = useNavigate();

  return (
    <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Recent IC Meetings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest investment committee decisions</p>
        </div>
        <button
          onClick={() => navigate("/history")}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          View all history →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wider">Deal</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Sector</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Date</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Stage</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">EV</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Outcome</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 uppercase tracking-wider">Key Topic</th>
            </tr>
          </thead>
          <tbody>
            {recentICMeetings.map((meeting) => (
              <tr
                key={meeting.id}
                className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer"
                onClick={() => navigate("/history")}
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-sm">{meeting.dealName}</span>
                    <p className="text-xs text-muted-foreground">{meeting.company}</p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge variant="secondary" className="text-xs">{meeting.sector}</Badge>
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm text-muted-foreground">{meeting.date}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("text-sm font-medium", stageColors[meeting.icStage] || "text-foreground")}>
                    {meeting.icStage}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm font-medium">{meeting.ev}</span>
                </td>
                <td className="px-3 py-3">
                  <Badge variant="outline" className={cn("capitalize text-[10px] border", outcomeColors[meeting.outcome])}>
                    {meeting.outcome === "conditions" ? "approved w/ conditions" : meeting.outcome}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-muted-foreground">{meeting.keyTopic}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
