import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "What were the main concerns raised in the TechVentures IC?",
  "Show me valuation multiples discussed in recent deals",
  "What questions does the IC typically ask about customer concentration?",
  "Summarize ESG due diligence requirements from past ICs",
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your IC Prep AI assistant. I can help you analyze past investment committee documents, identify patterns in IC questions, and prepare you for upcoming meetings. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on my analysis of your IC documents, I found several relevant insights regarding "${input}". 

Here are the key findings:

1. **Pattern Recognition**: This topic appeared in 12 IC meetings over the past year, with consistent questions around risk assessment and market positioning.

2. **Common Questions Asked**:
   - What are the key competitive advantages?
   - How defensible is the market position?
   - What are the main risks to the investment thesis?

3. **Historical Context**: Similar deals in this sector had a 73% approval rate when these concerns were adequately addressed.

Would you like me to dive deeper into any specific aspect?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
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
                <p className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
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
  );
}
