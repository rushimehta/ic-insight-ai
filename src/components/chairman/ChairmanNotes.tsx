import { useState } from "react";
import {
  ClipboardList, Plus, Sparkles, Loader2, Trash2, Users, Calendar,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, DollarSign,
  ArrowRight, Target, Shield, BarChart3, MessageSquare, Eye,
  FileText, Briefcase, TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useMeetingNotes } from "@/hooks/useMeetingNotes";

const DECISION_COLORS: Record<string, string> = {
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  approved_with_conditions: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  deferred: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  needs_more_info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  proceed_to_next: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const IC_STAGES = [
  { value: "ic1", label: "IC1 - Initial Screening" },
  { value: "ic2", label: "IC2 - Deep Dive / DD Authorization" },
  { value: "ic3", label: "IC3 - Due Diligence Review" },
  { value: "ic4", label: "IC4 - Final Terms & Structuring" },
  { value: "ic_final", label: "IC Final - Investment Decision" },
];

const IC_STAGE_COLORS: Record<string, string> = {
  ic1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ic2: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ic3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ic4: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ic_final: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const VOTE_OPTIONS = [
  { value: "approve", label: "Approve", icon: ThumbsUp, color: "text-emerald-500" },
  { value: "reject", label: "Reject", icon: ThumbsDown, color: "text-red-500" },
  { value: "defer", label: "Defer", icon: AlertCircle, color: "text-amber-500" },
  { value: "abstain", label: "Abstain", icon: MessageSquare, color: "text-muted-foreground" },
];

export function ChairmanNotes() {
  const { notes, isLoading, isGenerating, createNote, updateNote, deleteNote, generateSummary } = useMeetingNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    discussion: true, concerns: true, actions: true, takeaways: true,
    vote: true, conditions: true, expenses: false,
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const handleCreateNote = async () => {
    const newNote = await createNote({ deal_name: "New IC Meeting", meeting_date: new Date().toISOString().split("T")[0] });
    if (newNote) setSelectedNoteId(newNote.id);
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!selectedNoteId) return;
    updateNote(selectedNoteId, { [field]: value });
  };

  const handleGenerateSummary = async () => {
    if (!selectedNoteId) return;
    await generateSummary(selectedNoteId);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">IC Meeting Tracker</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Record IC discussions, voting outcomes, conditions, and action items
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Notes List */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">IC Meetings</h3>
              <Button variant="ghost" size="icon" onClick={handleCreateNote} className="h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No IC meeting records</p>
                <Button variant="link" size="sm" onClick={handleCreateNote}>
                  Record first IC meeting
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-2">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        selectedNoteId === note.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{note.deal_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.meeting_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {(note as any).ic_stage && (
                            <Badge className={cn("text-[10px] shrink-0 border", IC_STAGE_COLORS[(note as any).ic_stage] || "")}>
                              {(note as any).ic_stage?.toUpperCase()}
                            </Badge>
                          )}
                          {note.decision && (
                            <Badge className={cn("text-[10px] shrink-0 border", DECISION_COLORS[note.decision])}>
                              {note.decision.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-9">
          {!selectedNote ? (
            <div className="glass rounded-xl p-12 text-center">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Record IC Meeting</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                Capture deal presentations, committee questions, voting outcomes, conditions,
                and action items from IC meetings
              </p>
              <Button variant="glow" onClick={handleCreateNote}>
                <Plus className="w-4 h-4 mr-2" />
                New IC Meeting Record
              </Button>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Input
                      value={selectedNote.deal_name}
                      onChange={(e) => handleFieldChange("deal_name", e.target.value)}
                      className="font-medium text-lg border-none p-0 h-auto focus-visible:ring-0"
                      placeholder="Deal / Project Name"
                    />
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <Input
                          type="date"
                          value={selectedNote.meeting_date}
                          onChange={(e) => handleFieldChange("meeting_date", e.target.value)}
                          className="border-none p-0 h-auto text-xs focus-visible:ring-0 w-auto"
                        />
                      </div>
                      <Select
                        value={(selectedNote as any).ic_stage || "ic1"}
                        onValueChange={(v) => handleFieldChange("ic_stage", v)}
                      >
                        <SelectTrigger className="h-6 text-xs border-none bg-transparent p-0 w-auto gap-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IC_STAGES.map(stage => (
                            <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="glow" size="sm" onClick={handleGenerateSummary} disabled={isGenerating || !selectedNote.raw_notes}>
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate Takeaways
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete IC Meeting Record</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the record for "{selectedNote.deal_name}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteNote(selectedNote.id); setSelectedNoteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <Tabs defaultValue="capture" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger value="capture" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Meeting Notes
                  </TabsTrigger>
                  <TabsTrigger value="structured" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Structured Output
                  </TabsTrigger>
                  <TabsTrigger value="vote" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Decision & Vote
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[560px]">
                  {/* Meeting Notes Tab */}
                  <TabsContent value="capture" className="m-0 p-6 space-y-6">
                    {/* Attendees */}
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        IC Attendees
                      </label>
                      <Textarea
                        value={(selectedNote as any).attendees || ""}
                        onChange={(e) => handleFieldChange("attendees", e.target.value)}
                        placeholder="IC Chairman: Robert Chen (Managing Partner)
IC Members: Sarah Williams (Partner), David Kim (Partner), Jennifer Lee (Partner), Marcus Brown (Operating Partner)
Deal Team: Alex Morrison (VP), Chris Park (Associate), Lisa Zhang (Analyst)
Presenters: CEO Sarah Mitchell, CFO David Park (MedDevice Holdings)
Observers: Emily Davis (Legal Counsel)"
                        rows={5}
                        className="text-sm"
                      />
                    </div>

                    {/* Presentation Summary */}
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        Deal Presentation Summary
                      </label>
                      <Textarea
                        value={(selectedNote as any).presentation_summary || ""}
                        onChange={(e) => handleFieldChange("presentation_summary", e.target.value)}
                        placeholder="The deal team presented Project Atlas (MedDevice Holdings) for IC2 - Deep Dive authorization.

Key presentation points:
- $425M EV / 12.5x LTM EBITDA for 100% of equity
- Medical device company with $85M revenue, 28% EBITDA margins
- 95% recurring revenue from 2,500+ hospital customers
- Clear value creation plan: margin expansion + add-on acquisitions
- Requesting $2.8M DD expense authorization"
                        rows={6}
                        className="text-sm"
                      />
                    </div>

                    {/* Raw Discussion Notes */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Raw Discussion & Q&A Notes</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Capture the IC discussion verbatim. AI will structure into takeaways, concerns, and action items.
                      </p>
                      <Textarea
                        value={selectedNote.raw_notes || ""}
                        onChange={(e) => handleFieldChange("raw_notes", e.target.value)}
                        placeholder="[Chairman Chen] Opened meeting. Deal team has 15 minutes for presentation followed by Q&A.

[VP Morrison] Presented Project Atlas overview - MedDevice Holdings, $425M EV at 12.5x EBITDA. Highlighted 95% recurring revenue and market leadership position in single-use surgical instruments.

[Partner Williams] Question on customer concentration - what's the revenue breakdown by top customers?
[VP Morrison] Top 10 customers = 32%, largest single customer is 6%. 97% retention rate over 5 years.
[Partner Williams] That's manageable. How sticky are these relationships?
[CEO Mitchell] We have 2-3 year GPO contracts. Switching costs are high - training, compliance revalidation, procurement system integration.

[Partner Kim] I'm concerned about the entry multiple. 12.5x feels rich for a medical device company of this size. What are comps trading at?
[VP Morrison] Public comps: Teleflex at 18x, ICU Medical at 15x. Private transactions in the space: 10-14x range. We're at the mid-point.
[Partner Kim] But those are larger, more diversified businesses. What's the discount for size?
[Associate Park] We've run sensitivity analysis. At 12.5x entry and 14x exit, base case IRR is 22.4% with 2.8x MOIC.

[Operating Partner Brown] What's the management team's track record on integrations? The add-on strategy is critical.
[CEO Mitchell] We've completed 2 acquisitions in the last 5 years. First one integrated smoothly. Second took longer but is now fully on platform.
[Operating Partner Brown] I'd want to see a more detailed integration playbook. What's the average time to integrate?
[CEO Mitchell] 6-9 months for full integration.

[Partner Lee] What about the regulatory landscape? Any FDA headwinds?
[CFO Park] We have a perfect FDA inspection record for 15 years. We invest heavily in quality systems - $2M annually.

[Chairman Chen] What's the leverage at close?
[VP Morrison] 7.5x total debt. Senior at 5.9x. Interest coverage at 2.8x with strong FCF conversion.
[Chairman Chen] That's on the higher side. What's the downside scenario?
[Analyst Zhang] In the downside case (revenue decline 10%), we maintain covenant compliance. The revolver provides additional liquidity buffer.

[Chairman Chen] Thank you. Let's move to deliberation.

[Partner Williams] I'm supportive. Strong business, essential products, reasonable entry.
[Partner Kim] Supportive but want to see the QofE report before final approval. Multiple still concerns me.
[Partner Lee] Supportive. Regulatory moat is real.
[Operating Partner Brown] Supportive but condition on detailed integration playbook for add-on strategy.

[Chairman Chen] Consensus is to proceed. Approved for IC3 (full DD) with conditions. DD expense authorization of $2.8M approved."
                        rows={14}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>

                  {/* Structured Output Tab */}
                  <TabsContent value="structured" className="m-0 p-6 space-y-6">
                    {/* AI Generated Summary */}
                    {selectedNote.ai_generated_summary && (
                      <div className="border border-primary/20 rounded-xl p-4 bg-primary/5">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          AI-Generated Summary
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">{selectedNote.ai_generated_summary}</p>
                      </div>
                    )}

                    {/* Key Takeaways */}
                    <Collapsible open={expandedSections.takeaways}>
                      <CollapsibleTrigger onClick={() => toggleSection("takeaways")} className="flex items-center justify-between w-full text-left">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          Key Takeaways & IC Sentiment
                        </h4>
                        {expandedSections.takeaways ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <Textarea
                          value={(selectedNote as any).key_takeaways?.join?.("\n") || ""}
                          onChange={(e) => handleFieldChange("key_takeaways", e.target.value.split("\n").filter(Boolean))}
                          placeholder="• IC generally supportive of the opportunity - strong business fundamentals
• Entry multiple concern raised but mitigated by public comp analysis
• Customer concentration acceptable at 32% top-10 (97% retention)
• Integration capability needs validation before final approval
• FDA regulatory moat viewed as significant competitive advantage
• Leverage at 7.5x on higher side but supported by recurring revenue profile"
                          rows={6}
                          className="text-sm"
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Investment Thesis Progress */}
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Thesis Validation Status
                      </label>
                      <Textarea
                        value={(selectedNote as any).thesis_progress || ""}
                        onChange={(e) => handleFieldChange("thesis_progress", e.target.value)}
                        placeholder="THESIS ELEMENT STATUS:
✅ Recurring Revenue Quality: VALIDATED - 95% recurring, 97% retention confirmed
✅ Market Leadership: VALIDATED - #1 independent player, regulatory moat confirmed
⚠️ Margin Expansion: PARTIALLY VALIDATED - needs QofE confirmation
⚠️ Add-On Strategy: NEEDS WORK - integration playbook required
✅ Management Team: VALIDATED - strong CEO, good customer relationships
⚠️ Exit Multiple: UNCERTAIN - depends on platform build success"
                        rows={6}
                        className="text-sm"
                      />
                    </div>

                    {/* Key Concerns */}
                    {selectedNote.key_concerns?.length > 0 && (
                      <Collapsible open={expandedSections.concerns}>
                        <CollapsibleTrigger onClick={() => toggleSection("concerns")} className="flex items-center justify-between w-full text-left">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            IC Concerns Raised ({selectedNote.key_concerns.length})
                          </h4>
                          {expandedSections.concerns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <ul className="space-y-2">
                            {selectedNote.key_concerns.map((concern, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                  <p>{concern.concern}</p>
                                  {concern.raised_by && (<p className="text-xs text-muted-foreground mt-1">Raised by: {concern.raised_by}</p>)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Discussion Points */}
                    {selectedNote.discussion_points?.length > 0 && (
                      <Collapsible open={expandedSections.discussion}>
                        <CollapsibleTrigger onClick={() => toggleSection("discussion")} className="flex items-center justify-between w-full text-left">
                          <h4 className="font-medium text-sm">Discussion Points ({selectedNote.discussion_points.length})</h4>
                          {expandedSections.discussion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <ul className="space-y-2">
                            {selectedNote.discussion_points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Action Items */}
                    {selectedNote.action_items?.length > 0 && (
                      <Collapsible open={expandedSections.actions}>
                        <CollapsibleTrigger onClick={() => toggleSection("actions")} className="flex items-center justify-between w-full text-left">
                          <h4 className="font-medium text-sm">Action Items ({selectedNote.action_items.length})</h4>
                          {expandedSections.actions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="space-y-2">
                            {selectedNote.action_items.map((action, i) => (
                              <div key={i} className="flex items-start justify-between gap-4 text-sm bg-secondary/50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <div className="w-5 h-5 rounded-full border-2 border-primary shrink-0 mt-0.5" />
                                  <span>{action.item}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-medium">{action.owner}</p>
                                  {action.due_date && (<p className="text-xs text-muted-foreground">{action.due_date}</p>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Further Investigation */}
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        Open Items & Further Investigation
                      </label>
                      <Textarea
                        value={(selectedNote as any).further_investigation || ""}
                        onChange={(e) => handleFieldChange("further_investigation", e.target.value)}
                        placeholder="• Complete Quality of Earnings report (Deloitte) - required before IC3
• Develop detailed add-on acquisition integration playbook with deal team
• Schedule customer reference calls (5 remaining)
• Environmental Phase I for both manufacturing facilities
• Management compensation benchmarking against PE-backed peers"
                        rows={5}
                        className="text-sm"
                      />
                    </div>
                  </TabsContent>

                  {/* Decision & Vote Tab */}
                  <TabsContent value="vote" className="m-0 p-6 space-y-6">
                    {/* IC Decision */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">IC Decision</label>
                        <Select value={selectedNote.decision || ""} onValueChange={(v) => handleFieldChange("decision", v)}>
                          <SelectTrigger><SelectValue placeholder="Select decision" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="approved_with_conditions">Approved with Conditions</SelectItem>
                            <SelectItem value="proceed_to_next">Proceed to Next IC Stage</SelectItem>
                            <SelectItem value="deferred">Deferred</SelectItem>
                            <SelectItem value="needs_more_info">Needs More Information</SelectItem>
                            <SelectItem value="rejected">Rejected / Pass</SelectItem>
                          </SelectContent>
                        </Select>
                        {selectedNote.decision && (
                          <Badge className={cn("mt-2 text-sm px-3 py-1 border", DECISION_COLORS[selectedNote.decision])}>
                            {selectedNote.decision.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Decision Rationale</label>
                        <Textarea
                          value={selectedNote.decision_rationale || ""}
                          onChange={(e) => handleFieldChange("decision_rationale", e.target.value)}
                          placeholder="Strong business fundamentals with clear value creation path. Entry multiple acceptable given quality of business and add-on opportunity. Proceeding to full DD with $2.8M expense authorization."
                          rows={3}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* IC Vote Tracker */}
                    <Collapsible open={expandedSections.vote}>
                      <CollapsibleTrigger onClick={() => toggleSection("vote")} className="flex items-center justify-between w-full text-left">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          IC Member Votes
                        </h4>
                        {expandedSections.vote ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <Textarea
                          value={(selectedNote as any).vote_record || ""}
                          onChange={(e) => handleFieldChange("vote_record", e.target.value)}
                          placeholder="VOTE RECORD:
Robert Chen (Chairman): APPROVE - Strong conviction in business quality
Sarah Williams (Partner): APPROVE - Supportive, likes recurring revenue profile
David Kim (Partner): APPROVE WITH CONDITIONS - Wants QofE before IC3
Jennifer Lee (Partner): APPROVE - Regulatory moat is compelling
Marcus Brown (Operating Partner): APPROVE WITH CONDITIONS - Integration playbook required

RESULT: 5-0 APPROVE (2 with conditions)
QUORUM: Met (5 of 5 voting members present)"
                          rows={8}
                          className="text-sm font-mono"
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Conditions for Approval */}
                    <Collapsible open={expandedSections.conditions}>
                      <CollapsibleTrigger onClick={() => toggleSection("conditions")} className="flex items-center justify-between w-full text-left">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Conditions for Approval
                        </h4>
                        {expandedSections.conditions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <Textarea
                          value={(selectedNote as any).conditions || ""}
                          onChange={(e) => handleFieldChange("conditions", e.target.value)}
                          placeholder="1. Complete Quality of Earnings report before IC3 presentation
2. Develop detailed M&A integration playbook with timelines and resource plan
3. Complete remaining 5 customer reference calls with documented findings
4. Negotiate management employment agreements with 2-year non-competes
5. Environmental Phase I results to be clean or with manageable remediation costs"
                          rows={5}
                          className="text-sm"
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* IC Expenses */}
                    <Collapsible open={expandedSections.expenses}>
                      <CollapsibleTrigger onClick={() => toggleSection("expenses")} className="flex items-center justify-between w-full text-left">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          IC Authorized Expenses
                        </h4>
                        {expandedSections.expenses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={(selectedNote as any).ic_expenses_covered || false}
                            onCheckedChange={(checked) => handleFieldChange("ic_expenses_covered", checked)}
                          />
                          <span className="text-sm">IC authorized due diligence expense budget</span>
                        </label>
                        {(selectedNote as any).ic_expenses_covered && (
                          <div className="grid grid-cols-2 gap-4 pl-6">
                            <div>
                              <label className="text-xs font-medium mb-1 block">Authorized Amount</label>
                              <Input
                                type="number"
                                value={(selectedNote as any).ic_expenses_amount || ""}
                                onChange={(e) => handleFieldChange("ic_expenses_amount", e.target.value)}
                                placeholder="2800000"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Expense Breakdown</label>
                              <Input
                                value={(selectedNote as any).ic_expenses_notes || ""}
                                onChange={(e) => handleFieldChange("ic_expenses_notes", e.target.value)}
                                placeholder="Financial DD $800K, Commercial DD $650K, Legal $750K..."
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Next Steps */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Next Steps</label>
                      <Textarea
                        value={selectedNote.next_steps || ""}
                        onChange={(e) => handleFieldChange("next_steps", e.target.value)}
                        placeholder="1. Deal team to engage Deloitte for Quality of Earnings (target completion: 4 weeks)
2. Schedule remaining customer reference calls by March 22
3. Develop M&A integration playbook (VP Morrison to lead)
4. Legal to begin negotiating management employment agreements
5. Order Environmental Phase I for Minneapolis and Texas facilities
6. Target IC3 presentation: April 15, 2026"
                        rows={5}
                        className="text-sm"
                      />
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
