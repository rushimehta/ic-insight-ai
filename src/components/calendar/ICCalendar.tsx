import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
  Users, Building2, Briefcase, Target, X, MapPin, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type ViewMode = "month" | "week";

interface ICMeeting {
  id: string;
  dealName: string;
  projectName: string;
  date: string;
  time: string;
  duration: string;
  stage: string;
  type: string;
  sector: string;
  dealTeam: { name: string; role: string }[];
  icMembers: string[];
  ev: string;
  equityCheck: string;
  sponsor: string;
  location: string;
  meetingLink: string;
  agenda: string[];
  priority: "critical" | "high" | "medium" | "normal";
  status: "confirmed" | "tentative" | "rescheduled";
}

const sampleICMeetings: ICMeeting[] = [
  {
    id: "cal-1", dealName: "NexGen Insurance Group", projectName: "Project Delta",
    date: "2026-03-12", time: "9:00 AM", duration: "3 hours",
    stage: "IC Final", type: "Final Investment Decision",
    sector: "Financial Services",
    dealTeam: [
      { name: "M. Williams", role: "Lead Partner" },
      { name: "T. Anderson", role: "VP" },
      { name: "K. Nguyen", role: "Associate" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    ev: "$890M", equityCheck: "$420M", sponsor: "Fund VII",
    location: "Main Board Room", meetingLink: "https://zoom.us/j/ic-meeting-cal-1", priority: "critical", status: "confirmed",
    agenda: [
      "Final terms review and updated LBO model",
      "Management employment agreements status",
      "Regulatory approval timeline",
      "Final DD findings presentation",
      "Vote on investment recommendation",
    ],
  },
  {
    id: "cal-2", dealName: "MedDevice Holdings Inc.", projectName: "Project Atlas",
    date: "2026-03-15", time: "10:00 AM", duration: "2.5 hours",
    stage: "IC-2", type: "Deep Dive / DD Authorization",
    sector: "Healthcare",
    dealTeam: [
      { name: "J. Morrison", role: "Lead Partner" },
      { name: "A. Morrison", role: "VP" },
      { name: "C. Park", role: "Associate" },
      { name: "L. Zhang", role: "Analyst" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    ev: "$425M", equityCheck: "$185M", sponsor: "Fund VII",
    location: "Conference Room A", meetingLink: "https://zoom.us/j/ic-meeting-cal-2", priority: "high", status: "confirmed",
    agenda: [
      "Commercial DD findings presentation",
      "Updated financial model with QoE adjustments",
      "Customer concentration deep dive",
      "Add-on acquisition pipeline review",
      "DD expense authorization request ($2.8M)",
    ],
  },
  {
    id: "cal-3", dealName: "CloudScale Systems", projectName: "Project Beacon",
    date: "2026-03-22", time: "2:00 PM", duration: "2 hours",
    stage: "IC-1", type: "Initial Presentation",
    sector: "Technology",
    dealTeam: [
      { name: "S. Chen", role: "Lead Partner" },
      { name: "R. Gupta", role: "VP" },
      { name: "E. Martinez", role: "Associate" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    ev: "$680M", equityCheck: "$310M", sponsor: "Fund VII",
    location: "Virtual / Teams", meetingLink: "https://teams.microsoft.com/l/meetup-join/ic-meeting-cal-3", priority: "medium", status: "confirmed",
    agenda: [
      "Company and market overview",
      "Investment thesis presentation",
      "Preliminary LBO model review",
      "Key risk identification",
      "Initial IC feedback and next steps",
    ],
  },
  {
    id: "cal-4", dealName: "AmeriCare Home Health", projectName: "Project Jupiter",
    date: "2026-03-28", time: "9:30 AM", duration: "2 hours",
    stage: "IC-1", type: "Initial Presentation",
    sector: "Healthcare",
    dealTeam: [
      { name: "R. Patel", role: "Lead Partner" },
      { name: "N. Thompson", role: "VP" },
      { name: "J. Baker", role: "Associate" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim", "J. Lee"],
    ev: "$290M", equityCheck: "$118M", sponsor: "Fund VII",
    location: "Main Board Room", meetingLink: "https://zoom.us/j/ic-meeting-cal-4", priority: "medium", status: "confirmed",
    agenda: [
      "Home health market landscape",
      "Company positioning and competitive advantages",
      "Reimbursement risk analysis",
      "Value creation plan overview",
      "Preliminary return analysis",
    ],
  },
  {
    id: "cal-5", dealName: "DataVault Analytics", projectName: "Project Horizon",
    date: "2026-04-01", time: "11:00 AM", duration: "2 hours",
    stage: "IC-1", type: "Follow-Up Discussion",
    sector: "Technology",
    dealTeam: [
      { name: "S. Chen", role: "Lead Partner" },
      { name: "P. Walters", role: "VP" },
      { name: "M. Lopez", role: "Associate" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    ev: "$340M", equityCheck: "$195M", sponsor: "Fund VII",
    location: "Conference Room B", meetingLink: "https://zoom.us/j/ic-meeting-cal-5", priority: "normal", status: "tentative",
    agenda: [
      "Updated market analysis per IC feedback",
      "Revised financial projections",
      "Management reference check results",
      "Technology platform assessment",
      "Request to proceed to DD",
    ],
  },
  {
    id: "cal-6", dealName: "Summit Consumer Brands", projectName: "Project Keystone",
    date: "2026-04-05", time: "10:00 AM", duration: "2 hours",
    stage: "IC-1", type: "Initial Presentation",
    sector: "Consumer",
    dealTeam: [
      { name: "M. Williams", role: "Lead Partner" },
      { name: "A. Richardson", role: "VP" },
      { name: "C. Young", role: "Associate" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    ev: "$385M", equityCheck: "$165M", sponsor: "Fund VII",
    location: "Main Board Room", meetingLink: "https://zoom.us/j/ic-meeting-cal-6", priority: "normal", status: "confirmed",
    agenda: [
      "Consumer brands portfolio overview",
      "Channel strategy and DTC growth plan",
      "Brand health metrics and NPS data",
      "Margin expansion opportunity analysis",
      "Preliminary investment framework",
    ],
  },
  {
    id: "cal-7", dealName: "Fortis Cybersecurity", projectName: "Project Ironclad",
    date: "2026-04-08", time: "2:00 PM", duration: "2 hours",
    stage: "Pre-IC", type: "Pre-IC Strategy Session",
    sector: "Technology",
    dealTeam: [
      { name: "S. Chen", role: "Lead Partner" },
      { name: "D. Wright", role: "VP" },
      { name: "S. Kumar", role: "Associate" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim"],
    ev: "$560M", equityCheck: "$340M", sponsor: "Fund VII",
    location: "Virtual / Teams", meetingLink: "https://teams.microsoft.com/l/meetup-join/ic-meeting-cal-7", priority: "medium", status: "tentative",
    agenda: [
      "Cybersecurity market thesis overview",
      "Competitive landscape positioning",
      "ARR growth trajectory and unit economics",
      "Preliminary valuation framework",
      "Process timeline and LOI strategy",
    ],
  },
  {
    id: "cal-8", dealName: "Premier Waste Solutions", projectName: "Project Citadel",
    date: "2026-04-15", time: "9:00 AM", duration: "3 hours",
    stage: "IC Final", type: "Final Investment Decision",
    sector: "Industrials",
    dealTeam: [
      { name: "R. Patel", role: "Lead Partner" },
      { name: "B. Harris", role: "VP" },
      { name: "L. Chen", role: "Associate" },
    ],
    icMembers: ["R. Chen (Chair)", "S. Williams", "D. Kim", "J. Lee", "M. Brown"],
    ev: "$310M", equityCheck: "$125M", sponsor: "Fund VII",
    location: "Main Board Room", meetingLink: "https://zoom.us/j/ic-meeting-cal-8", priority: "critical", status: "confirmed",
    agenda: [
      "Full DD findings summary",
      "Final LBO model and sensitivity analysis",
      "Legal and environmental DD results",
      "Management incentive plan review",
      "Final vote on investment recommendation",
    ],
  },
];

const priorityConfig = {
  critical: { color: "bg-red-500", label: "Critical", badge: "bg-red-500/10 text-red-500 border-red-500/20" },
  high: { color: "bg-amber-500", label: "High", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  medium: { color: "bg-blue-500", label: "Medium", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  normal: { color: "bg-slate-400", label: "Normal", badge: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

const statusConfig = {
  confirmed: { label: "Confirmed", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  tentative: { label: "Tentative", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  rescheduled: { label: "Rescheduled", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function ICCalendar() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [selectedMeeting, setSelectedMeeting] = useState<ICMeeting | null>(null);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + delta);
    } else {
      newDate.setDate(newDate.getDate() + delta * 7);
    }
    setCurrentDate(newDate);
  };

  const getMeetingsForDate = (dateStr: string) => {
    return sampleICMeetings.filter(m => m.date === dateStr);
  };

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = offset - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const today = formatDate(new Date(2026, 2, 9)); // current date

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">IC Calendar</h2>
            <p className="text-muted-foreground">
              Upcoming investment committee meetings, schedules, and deal team assignments
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[200px] text-center">
            {viewMode === "month"
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            }
          </h3>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs ml-2"
            onClick={() => setCurrentDate(new Date(2026, 2, 9))}
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("week")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", viewMode === "week" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", viewMode === "month" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Month
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "75ms" }}>
        {Object.entries(priorityConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", config.color)} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {dayNames.map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {viewMode === "month" ? (
          /* Month View */
          <div className="grid grid-cols-7">
            {monthDays.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = formatDate(date);
              const meetings = getMeetingsForDate(dateStr);
              const isToday = dateStr === today;

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[110px] border-b border-r border-border/50 p-1.5 transition-colors",
                    !isCurrentMonth && "bg-secondary/20 opacity-50",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                    !isToday && (isCurrentMonth ? "text-foreground" : "text-muted-foreground")
                  )}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {meetings.map(meeting => (
                      <button
                        key={meeting.id}
                        onClick={() => setSelectedMeeting(meeting)}
                        className={cn(
                          "w-full text-left px-1.5 py-1 rounded text-[10px] leading-tight truncate transition-colors hover:ring-1 hover:ring-primary/50",
                          meeting.priority === "critical" && "bg-red-500/10 text-red-600 dark:text-red-400",
                          meeting.priority === "high" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          meeting.priority === "medium" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          meeting.priority === "normal" && "bg-secondary text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityConfig[meeting.priority].color)} />
                          <span className="truncate font-medium">{meeting.projectName}</span>
                        </div>
                        <div className="text-[9px] opacity-70 ml-2.5 truncate">{meeting.stage} &middot; {meeting.time}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Week View */
          <div className="grid grid-cols-7">
            {weekDates.map((date, idx) => {
              const dateStr = formatDate(date);
              const meetings = getMeetingsForDate(dateStr);
              const isToday = dateStr === today;

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[400px] border-r border-border/50 p-2",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-center mb-3",
                    isToday && "text-primary"
                  )}>
                    <div className="text-xs text-muted-foreground">{dayNames[idx]}</div>
                    <div className={cn(
                      "text-lg font-bold w-9 h-9 flex items-center justify-center rounded-full mx-auto",
                      isToday && "bg-primary text-primary-foreground"
                    )}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {meetings.map(meeting => (
                      <button
                        key={meeting.id}
                        onClick={() => setSelectedMeeting(meeting)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg border transition-all hover:shadow-sm hover:ring-1 hover:ring-primary/50",
                          meeting.priority === "critical" && "bg-red-500/10 border-red-500/20",
                          meeting.priority === "high" && "bg-amber-500/10 border-amber-500/20",
                          meeting.priority === "medium" && "bg-blue-500/10 border-blue-500/20",
                          meeting.priority === "normal" && "bg-secondary/50 border-border"
                        )}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityConfig[meeting.priority].color)} />
                          <span className="text-xs font-semibold truncate">{meeting.projectName}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{meeting.dealName}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{meeting.time}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] mt-1.5 h-4 px-1">
                          {meeting.stage}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming ICs List */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Upcoming IC Meetings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All scheduled investment committee sessions</p>
        </div>
        <div className="divide-y divide-border/40">
          {sampleICMeetings
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(meeting => (
            <button
              key={meeting.id}
              onClick={() => setSelectedMeeting(meeting)}
              className="w-full text-left px-5 py-3 hover:bg-secondary/30 transition-colors flex items-center gap-4"
            >
              <div className="flex flex-col items-center w-14 shrink-0">
                <span className="text-[10px] text-muted-foreground uppercase">
                  {new Date(meeting.date).toLocaleDateString("en-US", { month: "short" })}
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {new Date(meeting.date).getDate()}
                </span>
              </div>
              <span className={cn("w-2 h-8 rounded-full shrink-0", priorityConfig[meeting.priority].color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{meeting.projectName}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{meeting.stage}</Badge>
                  <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 border", statusConfig[meeting.status].className)}>
                    {statusConfig[meeting.status].label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{meeting.dealName} &middot; {meeting.sector}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium tabular-nums">{meeting.time}</p>
                <p className="text-xs text-muted-foreground">{meeting.duration}</p>
              </div>
              <div className="shrink-0 ml-2">
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title={meeting.location.includes("Virtual") ? "Join Teams" : "Join Zoom"}
                >
                  <Video className="w-4 h-4 text-primary" />
                </a>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Meeting Detail Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedMeeting && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={cn("w-3 h-3 rounded-full shrink-0", priorityConfig[selectedMeeting.priority].color)} />
                  <div>
                    <span>{selectedMeeting.projectName}</span>
                    <span className="text-muted-foreground font-normal text-base ml-2">({selectedMeeting.dealName})</span>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Key Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Date", value: new Date(selectedMeeting.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) },
                    { label: "Time", value: `${selectedMeeting.time} (${selectedMeeting.duration})` },
                    { label: "Stage", value: selectedMeeting.stage },
                    { label: "Type", value: selectedMeeting.type },
                    { label: "Sector", value: selectedMeeting.sector },
                    { label: "Enterprise Value", value: selectedMeeting.ev },
                    { label: "Equity Check", value: selectedMeeting.equityCheck },
                    { label: "Fund", value: selectedMeeting.sponsor },
                  ].map(item => (
                    <div key={item.label} className="bg-secondary/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedMeeting.location}</span>
                  <Badge variant="outline" className={cn("text-[10px] border ml-auto", statusConfig[selectedMeeting.status].className)}>
                    {statusConfig[selectedMeeting.status].label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px] border", priorityConfig[selectedMeeting.priority].badge)}>
                    {priorityConfig[selectedMeeting.priority].label} Priority
                  </Badge>
                </div>

                {/* Meeting Link */}
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={selectedMeeting.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {selectedMeeting.location.includes("Virtual") || selectedMeeting.location.includes("Teams")
                      ? "Join Microsoft Teams Meeting"
                      : "Join via Zoom (Remote Dial-In)"}
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-6 px-2 ml-auto"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMeeting.meetingLink);
                      // Could add toast here
                    }}
                  >
                    Copy Link
                  </Button>
                </div>

                {/* Deal Team */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Deal Team
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedMeeting.dealTeam.map((member, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-secondary/30 rounded-lg px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-xs">{member.name}</p>
                          <p className="text-[10px] text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IC Members */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    IC Members ({selectedMeeting.icMembers.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMeeting.icMembers.map((member, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{member}</Badge>
                    ))}
                  </div>
                </div>

                {/* Agenda */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Meeting Agenda
                  </h4>
                  <ol className="space-y-1.5">
                    {selectedMeeting.agenda.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button variant="default" size="sm" className="text-xs" onClick={() => { setSelectedMeeting(null); navigate("/chairman"); }}>
                    <CalendarIcon className="w-3 h-3 mr-1.5" />
                    Open Meeting Tracker
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSelectedMeeting(null); navigate("/questions"); }}>
                    <Target className="w-3 h-3 mr-1.5" />
                    Prep Questions
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSelectedMeeting(null); navigate("/chat"); }}>
                    Deal Advisor AI
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
