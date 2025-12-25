import { useState } from "react";
import { FileText, Plus, Sparkles, Loader2, Save, Trash2, Eye, Calendar, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useICDrafts } from "@/hooks/useICDrafts";

const SECTORS = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "financial_services", label: "Financial Services" },
  { value: "consumer_retail", label: "Consumer & Retail" },
  { value: "industrials", label: "Industrials" },
  { value: "energy", label: "Energy" },
  { value: "real_estate", label: "Real Estate" },
  { value: "media_entertainment", label: "Media & Entertainment" },
  { value: "infrastructure", label: "Infrastructure" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-primary/20 text-primary",
  review: "bg-warning/20 text-warning",
  final: "bg-success/20 text-success",
  presented: "bg-info/20 text-info",
};

export function ICDocumentGenerator() {
  const { drafts, isLoading, isGenerating, createDraft, updateDraft, deleteDraft, generateDocument } = useICDrafts();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const selectedDraft = drafts.find(d => d.id === selectedDraftId);

  const handleCreateDraft = async () => {
    const newDraft = await createDraft({
      deal_name: "New Deal",
      sector: "technology",
    });
    if (newDraft) {
      setSelectedDraftId(newDraft.id);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!selectedDraftId) return;
    updateDraft(selectedDraftId, { [field]: value });
  };

  const handleGenerate = async () => {
    if (!selectedDraftId) return;
    await generateDocument(selectedDraftId);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">IC Document Generator</h2>
        <p className="text-muted-foreground mt-1">
          Create professional investment committee memoranda from raw drafts and notes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Drafts List */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">Your Drafts</h3>
              <Button variant="ghost" size="icon" onClick={handleCreateDraft} className="h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No drafts yet</p>
                <Button variant="link" size="sm" onClick={handleCreateDraft}>
                  Create your first draft
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-2">
                  {drafts.map((draft) => (
                    <button
                      key={draft.id}
                      onClick={() => {
                        setSelectedDraftId(draft.id);
                        setShowPreview(false);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        selectedDraftId === draft.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{draft.deal_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{draft.sector?.replace("_", " ")}</p>
                        </div>
                        <Badge className={cn("text-[10px] shrink-0", STATUS_COLORS[draft.status])}>
                          {draft.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="lg:col-span-9">
          {!selectedDraft ? (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select or Create a Draft</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Choose a draft from the list or create a new one to start building your IC memorandum
              </p>
              <Button variant="glow" onClick={handleCreateDraft}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Draft
              </Button>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedDraft.deal_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Last updated {new Date(selectedDraft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "Edit" : "Preview"}
                  </Button>
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate IC Memo
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      deleteDraft(selectedDraft.id);
                      setSelectedDraftId(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {showPreview && selectedDraft.generated_document ? (
                <ScrollArea className="h-[600px]">
                  <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{selectedDraft.generated_document}</div>
                  </div>
                </ScrollArea>
              ) : (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="thesis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                      Investment Thesis
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger value="risks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                      Risks & Terms
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                      Raw Notes
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[520px]">
                    <div className="p-6 space-y-4">
                      <TabsContent value="overview" className="m-0 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Deal Name</label>
                            <Input
                              value={selectedDraft.deal_name}
                              onChange={(e) => handleFieldChange("deal_name", e.target.value)}
                              placeholder="Enter deal name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Sector</label>
                            <Select
                              value={selectedDraft.sector}
                              onValueChange={(v) => handleFieldChange("sector", v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SECTORS.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">IC Date</label>
                          <Input
                            type="date"
                            value={selectedDraft.ic_date || ""}
                            onChange={(e) => handleFieldChange("ic_date", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Company Overview</label>
                          <Textarea
                            value={selectedDraft.company_overview || ""}
                            onChange={(e) => handleFieldChange("company_overview", e.target.value)}
                            placeholder="Describe the target company, its business model, key products/services..."
                            rows={6}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="thesis" className="m-0 space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Investment Thesis</label>
                          <Textarea
                            value={selectedDraft.investment_thesis || ""}
                            onChange={(e) => handleFieldChange("investment_thesis", e.target.value)}
                            placeholder="Articulate the core investment thesis, key value drivers, and why this is an attractive opportunity..."
                            rows={10}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="analysis" className="m-0 space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Market Analysis</label>
                          <Textarea
                            value={selectedDraft.market_analysis || ""}
                            onChange={(e) => handleFieldChange("market_analysis", e.target.value)}
                            placeholder="Market size, growth trends, competitive landscape, regulatory environment..."
                            rows={6}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Financial Highlights</label>
                          <Textarea
                            value={selectedDraft.financial_highlights || ""}
                            onChange={(e) => handleFieldChange("financial_highlights", e.target.value)}
                            placeholder="Revenue, EBITDA, margins, growth rates, key financial metrics..."
                            rows={6}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="risks" className="m-0 space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Key Risks & Mitigants</label>
                          <Textarea
                            value={selectedDraft.key_risks || ""}
                            onChange={(e) => handleFieldChange("key_risks", e.target.value)}
                            placeholder="Key investment risks and proposed mitigants..."
                            rows={6}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Deal Terms & Structure</label>
                          <Textarea
                            value={selectedDraft.deal_terms || ""}
                            onChange={(e) => handleFieldChange("deal_terms", e.target.value)}
                            placeholder="Valuation, transaction structure, governance, key terms..."
                            rows={6}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="notes" className="m-0 space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Raw Notes & Drafts</label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Paste any raw notes, draft content, or unstructured information here. The AI will help organize and polish it.
                          </p>
                          <Textarea
                            value={selectedDraft.raw_notes || ""}
                            onChange={(e) => handleFieldChange("raw_notes", e.target.value)}
                            placeholder="Paste your raw notes, meeting transcripts, draft content..."
                            rows={15}
                            className="font-mono text-sm"
                          />
                        </div>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
