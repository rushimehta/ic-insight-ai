import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, ThumbsUp, ThumbsDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat, ChatSource } from "@/hooks/useChat";
import { SourceBadge } from "./SourceBadge";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { supabase } from "@/integrations/supabase/client";

const suggestedQuestions = [
  "What were the main concerns raised in the TechVentures IC?",
  "Show me valuation multiples discussed in recent deals",
  "What questions does the IC typically ask about customer concentration?",
  "Summarize ESG due diligence requirements from past ICs",
];

export function AIChat() {
  const { messages, isLoading, sendMessage, submitFeedback } = useChat();
  const [input, setInput] = useState("");
  const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);
  const [fullSourceContent, setFullSourceContent] = useState<string>("");
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

    // Fetch full content if we only have preview
    if (source.document_id && !source.content) {
      try {
        const { data } = await supabase
          .from("document_chunks")
          .select("content, metadata, chunk_index")
          .eq("document_id", source.document_id)
          .order("chunk_index", { ascending: true });

        if (data && data.length > 0) {
          // Find the best matching chunk or combine all
          const fullContent = data.map((c: any) => c.content).join("\n\n");
          setFullSourceContent(fullContent);

          // Get document metadata
          const { data: doc } = await supabase
            .from("documents")
            .select("filename, deal_name, ic_date")
            .eq("id", source.document_id)
            .single();

          if (doc) {
            setSelectedSource({
              ...source,
              metadata: {
                ...source.metadata,
                filename: doc.filename,
                deal_name: doc.deal_name,
                ic_date: doc.ic_date,
                total_chunks: data.length,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error fetching source content:", error);
      }
    }
  };

  return (
    <>
      <div className={cn(
        "flex flex-col h-[calc(100vh-120px)] transition-all duration-300",
        selectedSource ? "mr-[512px]" : ""
      )}>
        {/* Header */}
        <div className="opacity-0 animate-fade-in mb-4">
          <h2 className="text-2xl font-semibold">AI Chat</h2>
          <p className="text-muted-foreground mt-1">Query your IC knowledge base with natural language</p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 glass rounded-xl flex flex-col overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 opacity-0 animate-fade-in",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
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
                  
                  {/* Sources */}
                  {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, idx) => (
                          <SourceBadge
                            key={`${source.document_id}-${idx}`}
                            source={source}
                            index={idx}
                            onClick={() => handleSourceClick(source)}
                          />
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleFeedback(message.id, "helpful")}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleFeedback(message.id, "not_helpful")}
                        >
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

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-xs bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {question}
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
                placeholder="Ask about past IC discussions, questions, or trends..."
                className="flex-1 bg-secondary/50 rounded-lg px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                variant="glow"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-12 w-12"
              >
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
        onClose={() => {
          setSelectedSource(null);
          setFullSourceContent("");
        }}
      />
    </>
  );
}
