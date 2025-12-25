import { useState } from "react";
import { Search, Calendar, Filter, ChevronDown, FileText, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ICMeeting {
  id: string;
  dealName: string;
  sector: string;
  date: string;
  status: "approved" | "rejected" | "deferred";
  investmentSize: string;
  attendees: number;
  questionsAsked: number;
  duration: string;
  keyTopics: string[];
}

const mockMeetings: ICMeeting[] = [
  {
    id: "1",
    dealName: "TechVentures Series B",
    sector: "Technology",
    date: "2024-01-15",
    status: "approved",
    investmentSize: "$25M",
    attendees: 8,
    questionsAsked: 24,
    duration: "1h 45m",
    keyTopics: ["Valuation", "Market Size", "Competition"],
  },
  {
    id: "2",
    dealName: "HealthCare Plus Acquisition",
    sector: "Healthcare",
    date: "2024-01-12",
    status: "approved",
    investmentSize: "$150M",
    attendees: 12,
    questionsAsked: 31,
    duration: "2h 30m",
    keyTopics: ["Regulatory Risk", "Synergies", "Integration"],
  },
  {
    id: "3",
    dealName: "GreenEnergy Fund III",
    sector: "Energy",
    date: "2024-01-10",
    status: "deferred",
    investmentSize: "$50M",
    attendees: 9,
    questionsAsked: 18,
    duration: "1h 15m",
    keyTopics: ["ESG", "Policy Risk", "Returns"],
  },
  {
    id: "4",
    dealName: "FinTech Innovations",
    sector: "Financial Services",
    date: "2024-01-08",
    status: "rejected",
    investmentSize: "$35M",
    attendees: 10,
    questionsAsked: 42,
    duration: "2h 15m",
    keyTopics: ["Regulation", "Valuation", "Competition"],
  },
  {
    id: "5",
    dealName: "Real Estate Growth REIT",
    sector: "Real Estate",
    date: "2024-01-05",
    status: "approved",
    investmentSize: "$75M",
    attendees: 7,
    questionsAsked: 27,
    duration: "1h 30m",
    keyTopics: ["Cap Rate", "Occupancy", "Location"],
  },
];

const statusConfig = {
  approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Approved" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected" },
  deferred: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", label: "Deferred" },
};

export function ICHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<ICMeeting | null>(null);

  const filteredMeetings = mockMeetings.filter(meeting =>
    meeting.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button variant="glass" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date Range
          <ChevronDown className="w-3 h-3" />
        </Button>
        <Button variant="glass" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meetings List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredMeetings.map((meeting, index) => {
            const StatusIcon = statusConfig[meeting.status].icon;
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
                    <h4 className="font-medium">{meeting.dealName}</h4>
                    <p className="text-sm text-muted-foreground">{meeting.sector}</p>
                  </div>
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[meeting.status].bg, statusConfig[meeting.status].color)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig[meeting.status].label}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {meeting.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {meeting.attendees} attendees
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {meeting.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {meeting.keyTopics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Panel */}
        <div className="glass rounded-xl p-5 h-fit sticky top-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          {selectedMeeting ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedMeeting.dealName}</h3>
                <p className="text-sm text-muted-foreground">{selectedMeeting.sector}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Investment Size</span>
                  <span className="font-medium">{selectedMeeting.investmentSize}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Questions Asked</span>
                  <span className="font-medium">{selectedMeeting.questionsAsked}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meeting Duration</span>
                  <span className="font-medium">{selectedMeeting.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Attendees</span>
                  <span className="font-medium">{selectedMeeting.attendees}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Key Discussion Topics</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMeeting.keyTopics.map((topic, i) => (
                    <Badge key={i} variant="outline">{topic}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="glow" size="sm" className="flex-1">
                  <FileText className="w-4 h-4 mr-1" />
                  View Documents
                </Button>
              </div>
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
