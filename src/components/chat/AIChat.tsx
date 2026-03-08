import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, ThumbsUp, ThumbsDown, Search, Target, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function AIChat() {
  const { messages, isLoading, sendMessage, submitFeedback } = useChat();
  const [input, setInput] = useState("");
  const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);
  const [fullSourceContent, setFullSourceContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Deal Advisor AI</h2>
              <p className="text-muted-foreground">
                Query your IC knowledge base, analyze past decisions, and prepare for upcoming committees
              </p>
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
    </>
  );
}
