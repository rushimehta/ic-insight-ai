import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface ChatSource {
  document_id: string;
  similarity?: number;
  content_preview?: string;
  content?: string;
  metadata?: {
    filename?: string;
    deal_name?: string;
    ic_date?: string;
    chunk_index?: number;
    total_chunks?: number;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your IC Prep AI assistant. I can help you analyze past investment committee documents, identify patterns in IC questions, and prepare you for upcoming meetings. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user } = useAuth();

  const createSession = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ title: "New Chat", user_id: user.id })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating session:", error);
      return null;
    }
    return data.id;
  };

  const saveMessage = async (session: string, role: "user" | "assistant", content: string, sources?: string[]) => {
    await supabase
      .from("chat_messages")
      .insert({
        session_id: session,
        role,
        content,
        sources: sources || [],
      });
  };

  const sendMessage = useCallback(async (input: string, context?: { dealName?: string; sector?: string; model?: string }) => {
    if (!input.trim() || isLoading) return;

    // Create session if needed
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession();
      if (currentSessionId) {
        setSessionId(currentSessionId);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message
    if (currentSessionId) {
      await saveMessage(currentSessionId, "user", input);
    }

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: input }],
          sessionId: currentSessionId,
          context: context ? { dealName: context.dealName, sector: context.sector } : undefined,
          model: context?.model,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          throw new Error("Rate limited");
        }
        if (response.status === 402) {
          toast.error("AI credits exhausted. Please add funds to continue.");
          throw new Error("Payment required");
        }
        throw new Error("Failed to get response");
      }

      // Parse sources from header
      let sources: ChatSource[] = [];
      const sourcesHeader = response.headers.get("X-Sources");
      if (sourcesHeader) {
        try {
          sources = JSON.parse(sourcesHeader);
        } catch (e) {
          console.error("Failed to parse sources:", e);
        }
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantId = (Date.now() + 1).toString();

      // Add empty assistant message to update with sources
      setMessages(prev => [...prev, {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        sources,
      }]);

      if (reader) {
        let textBuffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });

          // Process SSE lines
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantId 
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {
              // Incomplete JSON, put back and wait
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      // Save assistant message
      if (currentSessionId && assistantContent) {
        await saveMessage(currentSessionId, "assistant", assistantContent);
      }

      // Track analytics
      await supabase.functions.invoke("analytics", {
        body: { action: "track", eventType: "chat_message", eventData: { sessionId: currentSessionId } },
      });

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId]);

  const submitFeedback = async (messageId: string, feedbackType: "helpful" | "not_helpful" | "correction", correctionText?: string) => {
    try {
      await supabase.functions.invoke("submit-feedback", {
        body: {
          messageId,
          feedbackType,
          correctionText,
        },
      });
      toast.success("Thanks for your feedback!");
    } catch (error) {
      console.error("Feedback error:", error);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    submitFeedback,
  };
}
