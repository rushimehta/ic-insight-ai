import { useState, useEffect } from "react";
import { Search, Calendar, Filter, ChevronDown, FileText, Users, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Approved" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected" },
  deferred: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", label: "Deferred" },
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/10", label: "Pending" },
};

export function ICHistory() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">IC History</h2>
        <p className="text-muted-foreground mt-1">Browse and search past investment committee meetings</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, sectors..."
            className="w-full bg-secondary/50 rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
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
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sector" />
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""} found
      </p>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meetings List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredMeetings.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No IC meetings found</p>
              <p className="text-sm text-muted-foreground mt-1">
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
                    "glass rounded-xl p-4 cursor-pointer transition-all duration-200 opacity-0 animate-fade-in",
                    selectedMeeting?.id === meeting.id
                      ? "border-primary/50 bg-primary/5"
                      : "glass-hover"
                  )}
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{meeting.deal_name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {(meeting.sector || "Unknown").replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.bg, config.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(meeting.meeting_date).toLocaleDateString()}
                    </span>
                    {attendeeCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {attendeeCount} attendees
                      </span>
                    )}
                    {questionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {questionCount} questions
                      </span>
                    )}
                    {meeting.deal_size && (
                      <span className="font-medium text-foreground">{meeting.deal_size}</span>
                    )}
                  </div>
                  {Array.isArray(meeting.key_concerns) && meeting.key_concerns.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {(meeting.key_concerns as string[]).slice(0, 3).map((concern, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
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
        <div className="glass rounded-xl p-5 h-fit sticky top-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          {selectedMeeting ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedMeeting.deal_name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {(selectedMeeting.sector || "Unknown").replace(/_/g, " ")}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(selectedMeeting.meeting_date).toLocaleDateString()}</span>
                </div>
                {selectedMeeting.deal_size && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deal Size</span>
                    <span className="font-medium">{selectedMeeting.deal_size}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outcome</span>
                  <Badge className={cn("text-xs border", getStatusConfig(selectedMeeting.outcome).bg, getStatusConfig(selectedMeeting.outcome).color)}>
                    {getStatusConfig(selectedMeeting.outcome).label}
                  </Badge>
                </div>
                {Array.isArray(selectedMeeting.attendees) && selectedMeeting.attendees.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attendees</span>
                    <span className="font-medium">{selectedMeeting.attendees.length}</span>
                  </div>
                )}
                {Array.isArray(selectedMeeting.questions_asked) && selectedMeeting.questions_asked.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Questions Asked</span>
                    <span className="font-medium">{selectedMeeting.questions_asked.length}</span>
                  </div>
                )}
              </div>

              {selectedMeeting.summary && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedMeeting.summary}</p>
                </div>
              )}

              {Array.isArray(selectedMeeting.questions_asked) && selectedMeeting.questions_asked.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Questions Asked</p>
                  <ul className="space-y-1">
                    {(selectedMeeting.questions_asked as string[]).map((q, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary shrink-0">•</span>
                        <span>{typeof q === "string" ? q : JSON.stringify(q)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(selectedMeeting.key_concerns) && selectedMeeting.key_concerns.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Key Concerns</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedMeeting.key_concerns as any[]).map((concern, i) => (
                      <Badge key={i} variant="outline">
                        {typeof concern === "string" ? concern : concern.concern || ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Select a meeting to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
