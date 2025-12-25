import { useState } from "react";
import { ClipboardList, Plus, Sparkles, Loader2, Trash2, Users, Calendar, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, DollarSign, ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useMeetingNotes } from "@/hooks/useMeetingNotes";

const DECISION_COLORS: Record<string, string> = {
  approved: "bg-success/20 text-success border-success/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  deferred: "bg-warning/20 text-warning border-warning/30",
  needs_more_info: "bg-info/20 text-info border-info/30",
};

const IC_STAGES = [
  { value: "ic1", label: "IC1 - Initial Review" },
  { value: "ic2", label: "IC2 - Deep Dive" },
  { value: "ic3", label: "IC3 - Due Diligence" },
  { value: "ic4", label: "IC4 - Final Terms" },
  { value: "ic_final", label: "IC Final - Decision" },
];

const IC_STAGE_COLORS: Record<string, string> = {
  ic1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ic2: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ic3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ic4: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ic_final: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function ChairmanNotes() {
  const { notes, isLoading, isGenerating, createNote, updateNote, deleteNote, generateSummary } = useMeetingNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    discussion: true,
    concerns: true,
    actions: true,
    takeaways: true,
    expenses: false,
  });
  
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const handleCreateNote = async () => {
    const newNote = await createNote({
      deal_name: "New IC Meeting",
      meeting_date: new Date().toISOString().split("T")[0],
    });
    if (newNote) {
      setSelectedNoteId(newNote.id);
    }
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">IC Chairman Notes</h2>
            <p className="text-muted-foreground">
              Capture detailed meeting discussions, decisions, and action items
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Notes List */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">Meeting Notes</h3>
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
                <p className="text-sm">No meeting notes yet</p>
                <Button variant="link" size="sm" onClick={handleCreateNote}>
                  Create your first note
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
                              {note.decision.replace("_", " ")}
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
              <h3 className="text-lg font-medium mb-2">Select or Create Meeting Notes</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Choose existing notes or create new ones to capture IC meeting discussions
              </p>
              <Button variant="glow" onClick={handleCreateNote}>
                <Plus className="w-4 h-4 mr-2" />
                New Meeting Notes
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
                      placeholder="Meeting title"
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
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={isGenerating || !selectedNote.raw_notes}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Takeaways
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      deleteNote(selectedNote.id);
                      setSelectedNoteId(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="p-6 space-y-6">
                  {/* Raw Notes Input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Raw Meeting Notes</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Capture the discussion as it happens. The AI will structure it into actionable takeaways.
                    </p>
                    <Textarea
                      value={selectedNote.raw_notes || ""}
                      onChange={(e) => handleFieldChange("raw_notes", e.target.value)}
                      placeholder="Type or paste your meeting notes here...

Example:
- Chairman opened with review of updated valuation model
- CFO presented revised sensitivity analysis showing 15-20% IRR range
- John (IC Member) raised concern about customer concentration - top 3 customers = 45% revenue
- Team discussed mitigation through pipeline diversification and new enterprise deals
- Sarah (Partner) questioned management's execution capability given recent departures
- Management team provided detailed retention plan and succession roadmap
- Legal flagged outstanding IP assignment issue with founding CTO
- Decision: Proceed to IC4 with conditions
- IC approved covering $75K for remaining legal due diligence expenses
- Action: Legal to circulate revised SPA by Friday
- Action: Deal team to schedule management presentations for next week"
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* AI Generated Content */}
                  {selectedNote.ai_generated_summary && (
                    <div className="border border-primary/20 rounded-xl p-4 bg-primary/5">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI Generated Summary
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedNote.ai_generated_summary}</p>
                    </div>
                  )}

                  {/* Decision */}
                  {selectedNote.decision && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Decision</label>
                        <Badge className={cn("text-sm px-3 py-1 border", DECISION_COLORS[selectedNote.decision])}>
                          {selectedNote.decision.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rationale</label>
                        <p className="text-sm text-muted-foreground">{selectedNote.decision_rationale}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  <Collapsible open={expandedSections.takeaways}>
                    <CollapsibleTrigger 
                      onClick={() => toggleSection("takeaways")}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Key Takeaways
                      </h4>
                      {expandedSections.takeaways ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <Textarea
                        value={(selectedNote as any).key_takeaways?.join?.("\n") || ""}
                        onChange={(e) => handleFieldChange("key_takeaways", e.target.value.split("\n").filter(Boolean))}
                        placeholder="Enter key takeaways, one per line:
• Valuation justified at 8x forward revenue based on growth trajectory
• Management team demonstrated strong execution capability
• IP issues must be resolved before closing
• Customer concentration risk is manageable with current pipeline"
                        rows={4}
                        className="text-sm"
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Further Investigation */}
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-primary" />
                      Further Investigation Required
                    </label>
                    <Textarea
                      value={(selectedNote as any).further_investigation || ""}
                      onChange={(e) => handleFieldChange("further_investigation", e.target.value)}
                      placeholder="Areas requiring additional due diligence or analysis:
• Deep dive into customer contract terms and renewal rates
• Reference calls with 3-5 key enterprise customers
• Technical architecture review with CTO
• Competitive threat assessment from new market entrants"
                      rows={4}
                      className="text-sm"
                    />
                  </div>

                  {/* Thesis Progress */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Investment Thesis Progress</label>
                    <Textarea
                      value={(selectedNote as any).thesis_progress || ""}
                      onChange={(e) => handleFieldChange("thesis_progress", e.target.value)}
                      placeholder="Updates to investment thesis based on this IC meeting:
• Original thesis around market expansion validated by new customer pipeline data
• Revenue quality thesis strengthened - 92% recurring, 150% NDR
• Management execution thesis needs more evidence - requested detailed roadmap
• Exit thesis updated - strategic interest from 2 potential acquirers confirmed"
                      rows={4}
                      className="text-sm"
                    />
                  </div>

                  {/* Discussion Points */}
                  {selectedNote.discussion_points?.length > 0 && (
                    <Collapsible open={expandedSections.discussion}>
                      <CollapsibleTrigger 
                        onClick={() => toggleSection("discussion")}
                        className="flex items-center justify-between w-full text-left"
                      >
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

                  {/* Key Concerns */}
                  {selectedNote.key_concerns?.length > 0 && (
                    <Collapsible open={expandedSections.concerns}>
                      <CollapsibleTrigger 
                        onClick={() => toggleSection("concerns")}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <h4 className="font-medium text-sm">Key Concerns ({selectedNote.key_concerns.length})</h4>
                        {expandedSections.concerns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <ul className="space-y-2">
                          {selectedNote.key_concerns.map((concern, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm bg-warning/5 border border-warning/20 rounded-lg p-3">
                              <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                              <div>
                                <p>{concern.concern}</p>
                                {concern.raised_by && (
                                  <p className="text-xs text-muted-foreground mt-1">Raised by: {concern.raised_by}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Action Items */}
                  {selectedNote.action_items?.length > 0 && (
                    <Collapsible open={expandedSections.actions}>
                      <CollapsibleTrigger 
                        onClick={() => toggleSection("actions")}
                        className="flex items-center justify-between w-full text-left"
                      >
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
                                {action.due_date && (
                                  <p className="text-xs text-muted-foreground">{action.due_date}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* IC Expenses */}
                  <Collapsible open={expandedSections.expenses}>
                    <CollapsibleTrigger 
                      onClick={() => toggleSection("expenses")}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        IC Covered Expenses
                      </h4>
                      {expandedSections.expenses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={(selectedNote as any).ic_expenses_covered || false}
                          onCheckedChange={(checked) => handleFieldChange("ic_expenses_covered", checked)}
                        />
                        <span className="text-sm">IC approved covering due diligence expenses</span>
                      </label>
                      {(selectedNote as any).ic_expenses_covered && (
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Approved Amount</label>
                            <Input
                              type="number"
                              value={(selectedNote as any).ic_expenses_amount || ""}
                              onChange={(e) => handleFieldChange("ic_expenses_amount", e.target.value)}
                              placeholder="75000"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Expense Notes</label>
                            <Input
                              value={(selectedNote as any).ic_expenses_notes || ""}
                              onChange={(e) => handleFieldChange("ic_expenses_notes", e.target.value)}
                              placeholder="Legal DD, technical review, etc."
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Next Steps */}
                  {selectedNote.next_steps && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Next Steps</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedNote.next_steps}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
