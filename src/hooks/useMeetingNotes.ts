import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface ActionItem {
  item: string;
  owner: string;
  due_date: string;
}

interface KeyConcern {
  concern: string;
  raised_by: string;
}

interface MeetingNote {
  id: string;
  ic_meeting_id: string | null;
  chairman_id: string | null;
  deal_name: string;
  meeting_date: string;
  attendees: string[];
  discussion_points: string[];
  key_concerns: KeyConcern[];
  action_items: ActionItem[];
  decision: string | null;
  decision_rationale: string | null;
  follow_up_required: boolean;
  next_steps: string | null;
  raw_notes: string | null;
  ai_generated_summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function parseJsonArray<T>(json: Json | null, defaultValue: T[] = []): T[] {
  if (!json) return defaultValue;
  if (Array.isArray(json)) return json as unknown as T[];
  return defaultValue;
}

function transformDbNote(data: any): MeetingNote {
  return {
    ...data,
    attendees: parseJsonArray<string>(data.attendees),
    discussion_points: parseJsonArray<string>(data.discussion_points),
    key_concerns: parseJsonArray<KeyConcern>(data.key_concerns),
    action_items: parseJsonArray<ActionItem>(data.action_items),
  };
}

export function useMeetingNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("meeting_notes")
        .select("*")
        .order("meeting_date", { ascending: false });

      if (error) throw error;
      setNotes((data || []).map(transformDbNote));
    } catch (error) {
      console.error("Error fetching meeting notes:", error);
      toast.error("Failed to load meeting notes");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async (noteData: Partial<MeetingNote>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("meeting_notes")
        .insert({
          chairman_id: user.id,
          deal_name: noteData.deal_name || "Untitled Meeting",
          meeting_date: noteData.meeting_date || new Date().toISOString().split("T")[0],
          attendees: (noteData.attendees || []) as unknown as Json,
          raw_notes: noteData.raw_notes,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      
      const transformedNote = transformDbNote(data);
      setNotes(prev => [transformedNote, ...prev]);
      toast.success("Meeting note created");
      return transformedNote;
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create meeting note");
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<MeetingNote>) => {
    try {
      const dbUpdates: any = { ...updates };
      if (updates.attendees) dbUpdates.attendees = updates.attendees as unknown as Json;
      if (updates.discussion_points) dbUpdates.discussion_points = updates.discussion_points as unknown as Json;
      if (updates.key_concerns) dbUpdates.key_concerns = updates.key_concerns as unknown as Json;
      if (updates.action_items) dbUpdates.action_items = updates.action_items as unknown as Json;

      const { error } = await supabase
        .from("meeting_notes")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
      
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
      toast.success("Meeting note saved");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to save meeting note");
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from("meeting_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success("Meeting note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete meeting note");
    }
  };

  const generateSummary = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return null;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ic-document", {
        body: {
          action: "generate_meeting_notes",
          data: {
            meetingId: noteId,
            rawNotes: note.raw_notes,
            dealName: note.deal_name,
            meetingDate: note.meeting_date,
            attendees: note.attendees,
          },
        },
      });

      if (error) throw error;
      
      if (data.notes) {
        const updatedNote: MeetingNote = {
          ...note,
          discussion_points: data.notes.discussion_points || [],
          key_concerns: data.notes.key_concerns || [],
          action_items: data.notes.action_items || [],
          decision: data.notes.decision,
          decision_rationale: data.notes.decision_rationale,
          next_steps: data.notes.next_steps,
          ai_generated_summary: data.notes.ai_generated_summary,
          status: "completed",
        };
        
        setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
        toast.success("Meeting notes generated successfully");
        return data.notes;
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate meeting notes");
    } finally {
      setIsGenerating(false);
    }
    return null;
  };

  return {
    notes,
    isLoading,
    isGenerating,
    createNote,
    updateNote,
    deleteNote,
    generateSummary,
    refetch: fetchNotes,
  };
}
