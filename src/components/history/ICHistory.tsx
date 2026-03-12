import { useState, useEffect } from "react";
import { Search, Calendar, Filter, FileText, Users, Clock, CheckCircle, XCircle, AlertCircle, Loader2, TrendingUp, DollarSign, ArrowRight, BarChart3, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ICMeeting {
  id: string;
  deal_name: string;
  sector: string | null;
  meeting_date: string;
  outcome: string | null;
  deal_size: string | null;
  attendees: string[] | null;
  questions_asked: string[] | null;
  summary: string | null;
  key_concerns: string[] | null;
}

const sampleHistoryMeetings: ICMeeting[] = [
  {
    id: "hist-1", deal_name: "NexGen Insurance Group", sector: "financial_services",
    meeting_date: "2026-02-18", outcome: "approved", deal_size: "$890M",
    attendees: ["R. Chen", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    questions_asked: ["What is the regulatory risk profile?", "How does the LBO model hold under stress scenarios?", "What are the management retention terms?"],
    summary: "Final IC approved the acquisition of NexGen Insurance Group at $890M EV. Strong consensus on the thesis around consolidation in specialty insurance. Management buyout structure approved with standard incentive terms.",
    key_concerns: ["Regulatory approval timeline", "Integration complexity", "Rate environment sensitivity"]
  },
  {
    id: "hist-2", deal_name: "TalentBridge HR Tech", sector: "technology",
    meeting_date: "2026-01-28", outcome: "approved", deal_size: "$215M",
    attendees: ["R. Chen", "S. Williams", "D. Kim", "J. Lee"],
    questions_asked: ["What drives the 58% revenue growth?", "How defensible is the AI matching technology?", "What is the path to profitability?"],
    summary: "Growth equity investment in TalentBridge approved. Committee impressed by the AI-driven talent matching platform and strong unit economics. $145M equity check from Fund VII.",
    key_concerns: ["Customer concentration", "Competitive moat durability", "Cash burn rate"]
  },
  {
    id: "hist-3", deal_name: "Apex Dental Partners", sector: "healthcare",
    meeting_date: "2026-01-15", outcome: "rejected", deal_size: "$520M",
    attendees: ["R. Chen", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    questions_asked: ["What justifies the 15.3x multiple for a dental roll-up?", "How fragmented is the remaining market?", "What are the integration risks?"],
    summary: "IC declined to proceed with Apex Dental Partners. Concerns around high entry multiple (15.3x EBITDA) relative to achievable synergies and the maturing dental consolidation landscape.",
    key_concerns: ["High entry multiple", "Market saturation", "Dentist retention risk", "Reimbursement pressure"]
  },
  {
    id: "hist-4", deal_name: "Premier Waste Solutions", sector: "industrials",
    meeting_date: "2025-12-10", outcome: "approved", deal_size: "$310M",
    attendees: ["R. Chen", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    questions_asked: ["What are the environmental liability risks?", "How sustainable are the route density economics?", "What is the M&A pipeline for tuck-ins?"],
    summary: "Approved at IC-2 to proceed to final due diligence. Strong industrial thesis around waste management consolidation. Attractive entry multiple of 9.8x with clear path to value creation via route optimization.",
    key_concerns: ["Environmental liabilities", "Municipal contract renewals", "Fuel cost volatility"]
  },
  {
    id: "hist-5", deal_name: "CloudScale Systems", sector: "technology",
    meeting_date: "2025-11-20", outcome: "deferred", deal_size: "$680M",
    attendees: ["R. Chen", "S. Williams", "D. Kim"],
    questions_asked: ["Can the 42% growth sustain post-expansion?", "What is the competitive positioning vs hyperscalers?", "Is the $680M valuation justified?"],
    summary: "IC deferred the CloudScale investment for additional analysis. Committee wants to see updated customer churn data and a more detailed competitive positioning study before proceeding.",
    key_concerns: ["Valuation richness", "Hyperscaler competition", "Customer churn trends"]
  },
  {
    id: "hist-6", deal_name: "MedDevice Holdings Inc.", sector: "healthcare",
    meeting_date: "2025-10-05", outcome: "approved", deal_size: "$425M",
    attendees: ["R. Chen", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    questions_asked: ["What are the FDA pipeline risks?", "How concentrated is the customer base?", "What synergies come from the add-on strategy?"],
    summary: "IC-1 approved advancement to DD phase. Strong medical device platform with 14% organic growth and a compelling add-on acquisition pipeline. $2.8M DD expense budget authorized.",
    key_concerns: ["FDA regulatory risk", "Customer concentration >15%", "Reimbursement headwinds"]
  },
];

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Approved" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected" },
  deferred: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", label: "Deferred" },
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/10", label: "Pending" },
};

export function ICHistory() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<ICMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [selectedMeeting, setSelectedMeeting] = useState<ICMeeting | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("ic_meetings")
        .select("*")
        .order("meeting_date", { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
      if (!data || data.length === 0) {
        setMeetings(sampleHistoryMeetings);
      }
    } catch (error) {
      console.error("Error fetching IC meetings:", error);
      toast.error("Failed to load IC history");
    } finally {
      setIsLoading(false);
    }
  };

  const sectors = [...new Set(meetings.map(m => m.sector).filter(Boolean))];

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch =
      meeting.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meeting.sector || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || (meeting.outcome || "pending") === statusFilter;
    const matchesSector = sectorFilter === "all" || meeting.sector === sectorFilter;
    return matchesSearch && matchesStatus && matchesSector;
  });

  const getStatus = (outcome: string | null) => outcome || "pending";
  const getStatusConfig = (outcome: string | null) => statusConfig[getStatus(outcome)] || statusConfig.pending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Summary stats
  const totalMeetings = meetings.length;
  const approvedCount = meetings.filter(m => m.outcome === "approved").length;
  const rejectedCount = meetings.filter(m => m.outcome === "rejected").length;
  const approvalRate = totalMeetings > 0 ? Math.round((approvedCount / Math.max(approvedCount + rejectedCount, 1)) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-xl font-semibold tracking-tight">IC Meeting Archive</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Historical record of investment committee proceedings and outcomes</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="metric-card-compact flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{totalMeetings}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Meetings</p>
          </div>
        </div>
        <div className="metric-card-compact flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{approvedCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approved</p>
          </div>
        </div>
        <div className="metric-card-compact flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">{rejectedCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rejected</p>
          </div>
        </div>
        <div className="metric-card-compact flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{approvalRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approval Rate</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, sectors..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="deferred">Deferred</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map((sector) => (
              <SelectItem key={sector} value={sector!}>
                {sector!.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredMeetings.length} of {totalMeetings} meetings
      </p>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Meetings List */}
        <div className="lg:col-span-2 space-y-2">
          {filteredMeetings.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No IC meetings found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {meetings.length === 0
                  ? "IC meetings will appear here once they are recorded."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            filteredMeetings.map((meeting, index) => {
              const config = getStatusConfig(meeting.outcome);
              const StatusIcon = config.icon;
              const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
              const questionCount = Array.isArray(meeting.questions_asked) ? meeting.questions_asked.length : 0;

              return (
                <div
                  key={meeting.id}
                  onClick={() => setSelectedMeeting(meeting)}
                  className={cn(
                    "glass rounded-lg p-4 cursor-pointer transition-all duration-150 opacity-0 animate-fade-in group",
                    selectedMeeting?.id === meeting.id
                      ? "border-primary/40 shadow-md"
                      : "hover:shadow-md hover:border-primary/15"
                  )}
                  style={{ animationDelay: `${100 + index * 30}ms` }}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                        <StatusIcon className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{meeting.deal_name}</h4>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {(meeting.sector || "Unknown").replace(/_/g, " ")}
                          {meeting.deal_size && <span className="ml-2 font-medium text-foreground">{meeting.deal_size}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px] border font-medium", config.bg, config.color)}>
                        {config.label}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground ml-11">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(meeting.meeting_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {attendeeCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {attendeeCount}
                      </span>
                    )}
                    {questionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {questionCount} questions
                      </span>
                    )}
                  </div>
                  {Array.isArray(meeting.key_concerns) && meeting.key_concerns.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5 ml-11">
                      {(meeting.key_concerns as string[]).slice(0, 3).map((concern, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] font-normal">
                          {typeof concern === "string" ? concern : (concern as any).concern || ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Details Panel */}
        <div className="glass rounded-xl p-5 h-fit sticky top-6 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
          {selectedMeeting ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{selectedMeeting.deal_name}</h3>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {(selectedMeeting.sector || "Unknown").replace(/_/g, " ")}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-xs border font-medium", getStatusConfig(selectedMeeting.outcome).bg, getStatusConfig(selectedMeeting.outcome).color)}>
                  {getStatusConfig(selectedMeeting.outcome).label}
                </Badge>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Date</span>
                  <span className="font-medium text-xs">{new Date(selectedMeeting.meeting_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                {selectedMeeting.deal_size && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Deal Size</span>
                    <span className="font-medium text-xs tabular-nums">{selectedMeeting.deal_size}</span>
                  </div>
                )}
                {Array.isArray(selectedMeeting.attendees) && selectedMeeting.attendees.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Attendees</span>
                    <span className="font-medium text-xs">{selectedMeeting.attendees.length}</span>
                  </div>
                )}
              </div>

              {selectedMeeting.summary && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Summary</p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{selectedMeeting.summary}</p>
                </div>
              )}

              {Array.isArray(selectedMeeting.questions_asked) && selectedMeeting.questions_asked.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Questions Asked</p>
                  <ul className="space-y-1">
                    {(selectedMeeting.questions_asked as string[]).map((q, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary shrink-0 mt-0.5">&#8226;</span>
                        <span className="leading-relaxed">{typeof q === "string" ? q : JSON.stringify(q)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(selectedMeeting.key_concerns) && selectedMeeting.key_concerns.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Key Concerns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMeeting.key_concerns as any[]).map((concern, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-normal">
                        {typeof concern === "string" ? concern : concern.concern || ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-3 border-t border-border flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => navigate("/chat")}>
                  <MessageSquare className="w-3 h-3 mr-1" /> Ask AI
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => navigate("/generator")}>
                  <FileText className="w-3 h-3 mr-1" /> View Memo
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">Select a meeting to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
