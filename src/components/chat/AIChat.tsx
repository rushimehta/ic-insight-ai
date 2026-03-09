import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, ThumbsUp, ThumbsDown, Search, Target, ChevronDown, FileText, ExternalLink, BookOpen, Brain, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChat, ChatSource } from "@/hooks/useChat";
import { SourceBadge } from "./SourceBadge";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { supabase } from "@/integrations/supabase/client";

interface PromptCategory {
  sector: string;
  color: string;
  prompts: string[];
}

// ─── Context-Aware Document References ─────────────────────────────

interface DocumentRef {
  title: string;
  section: string;
  icon: typeof FileText;
  relevance: string;
  preview: string;
  keyMetrics?: { label: string; value: string }[];
}

const documentRefs: Record<string, DocumentRef[]> = {
  "atlas": [
    { title: "Project Atlas — IC2 Investment Memo", section: "Financial Analysis & LBO Model", icon: FileText, relevance: "Healthcare platform, $425M EV, 12.5x EBITDA",
      preview: "MedDevice Holdings is a leading specialty medical device distributor serving 2,800+ acute care facilities. The company has demonstrated 14.2% revenue growth and 28.1% EBITDA margins. The LBO model assumes 5.2x leverage with a $185M equity check from Fund VII.",
      keyMetrics: [{ label: "EV", value: "$425M" }, { label: "EV/EBITDA", value: "12.5x" }, { label: "IRR", value: "22.4%" }, { label: "MOIC", value: "2.8x" }] },
    { title: "Project Atlas — Value Creation Bridge", section: "Revenue Synergies & Margin Expansion", icon: TrendingUp, relevance: "100-day plan, add-on M&A pipeline",
      preview: "Value creation plan targets 35% from organic revenue growth (new product launches, geographic expansion), 22% from EBITDA margin expansion (procurement savings, SG&A optimization), and 18% from multiple expansion via platform build-out with 3 identified add-on targets.",
      keyMetrics: [{ label: "Revenue Growth", value: "35%" }, { label: "Margin Expansion", value: "22%" }, { label: "Add-ons", value: "3 targets" }] },
  ],
  "beacon": [
    { title: "Project Beacon — IC1 Teaser", section: "Cloud SaaS Metrics & Unit Economics", icon: FileText, relevance: "Technology, $680M EV, 42.5% ARR growth",
      preview: "CloudScale Systems is a high-growth cloud infrastructure platform with $189M revenue growing 42.5% YoY. ARR of $195M with 125% NDR and Rule of 40 score of 62. LTV/CAC ratio of 5.2x with 18-month payback period.",
      keyMetrics: [{ label: "ARR", value: "$195M" }, { label: "NDR", value: "125%" }, { label: "Rule of 40", value: "62" }, { label: "LTV/CAC", value: "5.2x" }] },
  ],
  "citadel": [
    { title: "Project Citadel — IC3 DD Summary", section: "Complete DD Workstream Report", icon: BookOpen, relevance: "Industrials, $310M EV, waste management",
      preview: "Premier Waste Solutions DD complete across 8 workstreams. Key findings: fleet age averages 4.2 years (industry avg 5.8), route density 15% above peers, landfill capacity sufficient for 12+ years. Customer contracts 85% recurring with 3-5 year terms.",
      keyMetrics: [{ label: "EV", value: "$310M" }, { label: "Fleet Age", value: "4.2 yrs" }, { label: "Recurring %", value: "85%" }, { label: "Approval", value: "4-1 vote" }] },
  ],
  "delta": [
    { title: "Project Delta — IC Final Memo", section: "Actuarial Review & Deal Terms", icon: FileText, relevance: "Financial Services, $890M EV, insurance platform",
      preview: "NexGen Insurance Group actuarial review completed by Milliman. Combined ratio of 94.2% is favorable vs. 97.1% industry average. Reserve adequacy confirmed within 5% confidence interval. Sources & uses: $890M EV, $420M equity from Fund VII, $470M in senior secured and mezzanine debt.",
      keyMetrics: [{ label: "EV", value: "$890M" }, { label: "Combined Ratio", value: "94.2%" }, { label: "Equity Check", value: "$420M" }, { label: "Status", value: "Deferred" }] },
  ],
  "echo": [
    { title: "Project Echo — Post-IC Approval", section: "Closing Tracker & 100-Day Plan", icon: FileText, relevance: "Technology, $215M EV, HR tech",
      preview: "TalentBridge HR Tech approved unanimously (5-0). Closing timeline: 45 days. 100-day plan includes: CTO hire, SOC 2 Type II certification, enterprise sales team expansion (8 → 15 reps), and integration of acquired talent analytics module.",
      keyMetrics: [{ label: "EV", value: "$215M" }, { label: "Vote", value: "5-0" }, { label: "IRR", value: "32.4%" }, { label: "Closing", value: "45 days" }] },
  ],
  "granite": [
    { title: "Project Granite — IC2 Pass Recommendation", section: "Pass Rationale & Lessons Learned", icon: AlertTriangle, relevance: "Healthcare, $520M EV, dental DSO — PASSED",
      preview: "IC voted 1-4 to pass on Apex Dental Partners. Key concerns: entry multiple of 15.3x too high for unproven de novo economics, same-store growth declining from 8% to 3% over 3 years, payor mix shifting toward lower-reimbursement plans, and management team concentration risk.",
      keyMetrics: [{ label: "EV", value: "$520M" }, { label: "Multiple", value: "15.3x" }, { label: "Vote", value: "1-4 (Pass)" }, { label: "SSS Growth", value: "3% ↓" }] },
  ],
  "valuation": [
    { title: "Project Atlas — Sensitivity Analysis", section: "Entry Multiple & Exit Scenario Tables", icon: TrendingUp, relevance: "IRR sensitivity to entry multiple and exit timing",
      preview: "Base case: 12.5x entry, 13.0x exit in Year 5 = 22.4% IRR / 2.8x MOIC. Downside: 12.5x entry, 11.0x exit = 15.1% IRR / 2.0x. Upside: 12.5x entry, 14.5x exit = 28.7% IRR / 3.4x. IRR highly sensitive to exit timing — Year 4 exit improves IRR by +3.2pp.",
      keyMetrics: [{ label: "Base IRR", value: "22.4%" }, { label: "Downside", value: "15.1%" }, { label: "Upside", value: "28.7%" }] },
    { title: "Project Delta — Sources & Uses", section: "Capital Structure & Returns Waterfall", icon: FileText, relevance: "Debt/equity split, management rollover, fee structure",
      preview: "Sources: $420M Fund VII equity (47%), $310M senior secured (35%), $120M mezzanine (13%), $40M management rollover (5%). Uses: $890M enterprise value, $35M transaction fees, $15M financing fees. Management rollover of 5% aligns incentives.",
      keyMetrics: [{ label: "Equity", value: "$420M" }, { label: "Sr Debt", value: "$310M" }, { label: "Mezz", value: "$120M" }, { label: "Mgmt Roll", value: "$40M" }] },
  ],
  "healthcare": [
    { title: "Project Atlas — IC2 Investment Memo", section: "Healthcare Market Analysis", icon: FileText, relevance: "Provider consolidation, reimbursement trends",
      preview: "Healthcare services market consolidating rapidly — top 10 distributors control 45% vs 30% five years ago. Medicare reimbursement rates stable with CPI+0.5% annual escalators. Medicaid expansion in 4 new states provides tailwind for patient volumes.",
      keyMetrics: [{ label: "Market Share", value: "Top 10: 45%" }, { label: "Reimb. Growth", value: "CPI+0.5%" }] },
    { title: "Project Granite — Pass Recommendation", section: "Dental DSO Risk Assessment", icon: AlertTriangle, relevance: "Payor mix, same-store growth, de novo economics",
      preview: "Risk assessment identified 3 critical issues: (1) Payor mix shifting — commercial insurance down from 62% to 54%, Medicaid up from 18% to 26%; (2) Same-store growth decelerating; (3) De novo locations require 24+ months to breakeven vs. management's 15-month projection.",
      keyMetrics: [{ label: "Commercial %", value: "54% ↓" }, { label: "De novo BE", value: "24+ months" }] },
  ],
  "technology": [
    { title: "Project Beacon — IC1 Teaser", section: "SaaS Metrics Deep Dive", icon: Brain, relevance: "Rule of 40, NDR, LTV/CAC, ARR bridge",
      preview: "CloudScale's SaaS metrics are top-decile: Rule of 40 score of 62 (42.5% growth + 19.6% margin), net dollar retention of 125%, gross retention of 94%, and LTV/CAC ratio of 5.2x. ARR bridge shows 70% from expansion, 25% from new logos, 5% contraction.",
      keyMetrics: [{ label: "Rule of 40", value: "62" }, { label: "Gross Ret.", value: "94%" }, { label: "Expansion %", value: "70%" }] },
    { title: "Project Echo — Approval Summary", section: "HR Tech Market Position", icon: FileText, relevance: "TAM/SAM/SOM, competitive landscape",
      preview: "TalentBridge addresses $42B TAM in HR technology. SAM of $8.5B in mid-market segment (100-5,000 employees). Current SOM of $68M revenue = 0.8% penetration with significant runway. Key competitors: Workday (enterprise), BambooHR (SMB), Rippling (mid-market).",
      keyMetrics: [{ label: "TAM", value: "$42B" }, { label: "SAM", value: "$8.5B" }, { label: "Penetration", value: "0.8%" }] },
  ],
};

const promptCategories: PromptCategory[] = [
  {
    sector: "Deal Analysis",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    prompts: [
      "What were the key concerns raised in past ICs for deals with similar EV/EBITDA multiples?",
      "Analyze the approval rate for deals above 12x EBITDA across all sectors",
      "What due diligence red flags have historically led to deal rejections?",
      "Compare management team risk factors across approved vs. rejected deals",
      "Which deal structures (LBO vs growth equity) have had higher IC approval rates?",
    ],
  },
  {
    sector: "Healthcare",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    prompts: [
      "What regulatory risks has the IC flagged in past healthcare deals?",
      "Show me typical EV/EBITDA ranges for healthcare services platform acquisitions",
      "What reimbursement-related concerns were raised in our past healthcare ICs?",
      "How has the IC evaluated physician/provider retention risk in healthcare deals?",
      "What are the most common value creation levers approved in healthcare platforms?",
    ],
  },
  {
    sector: "Technology",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    prompts: [
      "What metrics does the IC prioritize for SaaS/recurring revenue businesses?",
      "How has the IC evaluated customer concentration risk in technology deals?",
      "What ARR growth rates have been required for growth equity technology investments?",
      "Summarize IC feedback on technology platform build-up strategies",
      "What technology-specific due diligence items has the IC required in past deals?",
    ],
  },
  {
    sector: "Industrials",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    prompts: [
      "What cyclicality concerns has the IC raised for industrial deals?",
      "Show me how the IC has evaluated capital intensity and maintenance capex requirements",
      "What environmental and regulatory risks have been flagged in industrial acquisitions?",
      "How has the IC assessed labor market and workforce risks in manufacturing deals?",
      "What margin expansion strategies have been approved for industrial platforms?",
    ],
  },
  {
    sector: "Financial Services",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    prompts: [
      "What regulatory and compliance risks has the IC highlighted in financial services deals?",
      "How has the IC evaluated interest rate sensitivity in financial services investments?",
      "What capital requirements and reserve ratio concerns have been raised?",
      "Show me the IC's historical perspective on fintech vs. traditional financial services valuations",
      "What fraud and credit risk diligence has the IC required in past deals?",
    ],
  },
  {
    sector: "Consumer",
    color: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    prompts: [
      "How has the IC evaluated brand strength and consumer loyalty in past deals?",
      "What channel concentration risks have been raised for consumer businesses?",
      "Show me the IC's track record on consumer deals with e-commerce exposure",
      "What commodity and input cost risks has the IC flagged in consumer investments?",
      "How has the IC assessed private label and competitive threats in consumer deals?",
    ],
  },
  {
    sector: "IC Process",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    prompts: [
      "What are the most common reasons deals get deferred at IC rather than approved or rejected?",
      "Show me the average number of IC meetings before final approval by deal size",
      "What conditions for approval are most commonly attached to IC decisions?",
      "How long does the typical deal spend in each IC stage?",
      "What patterns exist between IC question themes and ultimate deal outcomes?",
    ],
  },
];

// Find relevant document references based on message content
function findDocumentRefs(text: string): DocumentRef[] {
  const lower = text.toLowerCase();
  const refs: DocumentRef[] = [];
  const seen = new Set<string>();

  for (const [key, docRefs] of Object.entries(documentRefs)) {
    if (lower.includes(key)) {
      for (const ref of docRefs) {
        if (!seen.has(ref.title)) {
          refs.push(ref);
          seen.add(ref.title);
        }
      }
    }
  }

  // Also match general terms
  if (lower.includes("ebitda") || lower.includes("multiple") || lower.includes("lbo")) {
    for (const ref of documentRefs["valuation"] || []) {
      if (!seen.has(ref.title)) { refs.push(ref); seen.add(ref.title); }
    }
  }

  return refs.slice(0, 4);
}

export function AIChat() {
  const { messages, isLoading, sendMessage, submitFeedback } = useChat();
  const [input, setInput] = useState("");
  const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);
  const [fullSourceContent, setFullSourceContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [docDrillDown, setDocDrillDown] = useState<DocumentRef | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  const handleFeedback = (messageId: string, type: "helpful" | "not_helpful") => {
    submitFeedback(messageId, type);
  };

  const handleSourceClick = async (source: ChatSource) => {
    setSelectedSource(source);
    setFullSourceContent("");
    if (source.document_id && !source.content) {
      try {
        const { data } = await supabase
          .from("document_chunks")
          .select("content, metadata, chunk_index")
          .eq("document_id", source.document_id)
          .order("chunk_index", { ascending: true });
        if (data && data.length > 0) {
          const fullContent = data.map((c: any) => c.content).join("\n\n");
          setFullSourceContent(fullContent);
          const { data: doc } = await supabase
            .from("documents")
            .select("filename, deal_name, ic_date")
            .eq("id", source.document_id)
            .single();
          if (doc) {
            setSelectedSource({
              ...source,
              metadata: { ...source.metadata, filename: doc.filename, deal_name: doc.deal_name, ic_date: doc.ic_date, total_chunks: data.length },
            });
          }
        }
      } catch (error) {
        console.error("Error fetching source content:", error);
      }
    }
  };

  const displayCategories = showAllCategories ? promptCategories : promptCategories.slice(0, 4);

  return (
    <>
      <div className={cn("flex flex-col h-[calc(100vh-120px)] transition-all duration-300", selectedSource ? "mr-[512px]" : "")}>
        {/* Header */}
        <div className="opacity-0 animate-fade-in mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Deal Advisor AI</h2>
                <p className="text-muted-foreground text-sm">
                  Query your IC knowledge base, analyze past decisions, and prepare for upcoming committees
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-500">
                <Brain className="w-3 h-3" />
                6 IC Memos Indexed
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                <Sparkles className="w-3 h-3" />
                Context-Aware
              </Badge>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 glass rounded-xl flex flex-col overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn("flex gap-3 opacity-0 animate-fade-in", message.role === "user" ? "flex-row-reverse" : "")}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  message.role === "assistant" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {message.role === "assistant" ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-xl p-4",
                  message.role === "assistant" ? "bg-secondary/50" : "bg-primary/10 border border-primary/20"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {/* Document References for AI responses */}
                  {message.role === "assistant" && message.content && (() => {
                    const refs = findDocumentRefs(message.content);
                    if (refs.length === 0) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Related Documents:
                        </p>
                        <div className="space-y-1.5">
                          {refs.map((ref, idx) => {
                            const Icon = ref.icon;
                            return (
                              <button
                                key={idx}
                                onClick={() => setDocDrillDown(ref)}
                                className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-background/50 hover:bg-secondary/80 border border-border/30 hover:border-primary/30 transition-all group"
                              >
                                <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium group-hover:text-primary transition-colors truncate">{ref.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{ref.section}</p>
                                </div>
                                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, idx) => (
                          <SourceBadge key={`${source.document_id}-${idx}`} source={source} index={idx} onClick={() => handleSourceClick(source)} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {message.role === "assistant" && message.content && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback(message.id, "helpful")}>
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback(message.id, "not_helpful")}>
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-secondary/50 rounded-xl p-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sector-Specific Prompt Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 border-t border-border/50">
              <div className="flex items-center justify-between mt-3 mb-2">
                <p className="text-xs font-medium text-muted-foreground">IC-Ready Prompts by Sector</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? "Show Less" : "Show All Sectors"}
                  <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", showAllCategories && "rotate-180")} />
                </Button>
              </div>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {displayCategories.map((cat) => (
                  <button
                    key={cat.sector}
                    onClick={() => setSelectedCategory(selectedCategory === cat.sector ? null : cat.sector)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all",
                      selectedCategory === cat.sector ? cat.color : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                    )}
                  >
                    {cat.sector}
                  </button>
                ))}
              </div>

              {/* Prompts */}
              <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                {(selectedCategory
                  ? promptCategories.find(c => c.sector === selectedCategory)?.prompts || []
                  : promptCategories[0].prompts.slice(0, 3)
                ).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="text-xs bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about past IC decisions, deal analysis, sector trends, or preparation questions..."
                className="flex-1 bg-secondary/50 rounded-lg px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button variant="glow" size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="h-12 w-12">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Side Pane */}
      <DocumentViewer
        source={selectedSource}
        fullContent={fullSourceContent}
        onClose={() => { setSelectedSource(null); setFullSourceContent(""); }}
      />

      {/* Document Reference Drill-Down Dialog */}
      <Dialog open={docDrillDown !== null} onOpenChange={() => setDocDrillDown(null)}>
        <DialogContent className="max-w-xl max-h-[80vh]">
          {docDrillDown && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <docDrillDown.icon className="w-5 h-5 text-primary shrink-0" />
                  {docDrillDown.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{docDrillDown.section}</p>
              </DialogHeader>
              <ScrollArea className="max-h-[55vh]">
                <div className="space-y-4">
                  {docDrillDown.keyMetrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {docDrillDown.keyMetrics.map(m => (
                        <div key={m.label} className="p-2.5 rounded-lg bg-secondary/50 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                          <p className="text-sm font-bold tabular-nums">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Document Excerpt</p>
                    <p className="text-sm leading-relaxed">{docDrillDown.preview}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Context</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{docDrillDown.relevance}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
