import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SectorType } from "@/hooks/useUserPermissions";

export type ICStage = "ic1" | "ic2" | "ic3" | "ic4" | "ic_final" | "approved" | "rejected";

interface ICDraft {
  id: string;
  deal_name: string;
  sector: SectorType;
  investment_thesis: string | null;
  company_overview: string | null;
  market_analysis: string | null;
  financial_highlights: string | null;
  key_risks: string | null;
  deal_terms: string | null;
  raw_notes: string | null;
  generated_document: string | null;
  status: string;
  ic_date: string | null;
  created_at: string;
  updated_at: string;
  // New detailed fields
  management_summary: string | null;
  firm_summary: string | null;
  product_offering: string | null;
  comp_analysis: string | null;
  financial_snapshot: string | null;
}

export function useICDrafts() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<ICDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchDrafts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ic_drafts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      toast.error("Failed to load IC drafts");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const createDraft = async (draftData: Partial<ICDraft>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("ic_drafts")
        .insert({
          user_id: user.id,
          deal_name: draftData.deal_name || "Untitled Deal",
          sector: draftData.sector || "technology",
          investment_thesis: draftData.investment_thesis,
          company_overview: draftData.company_overview,
          market_analysis: draftData.market_analysis,
          financial_highlights: draftData.financial_highlights,
          key_risks: draftData.key_risks,
          deal_terms: draftData.deal_terms,
          raw_notes: draftData.raw_notes,
          ic_date: draftData.ic_date,
          management_summary: draftData.management_summary,
          firm_summary: draftData.firm_summary,
          product_offering: draftData.product_offering,
          comp_analysis: draftData.comp_analysis,
          financial_snapshot: draftData.financial_snapshot,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      
      setDrafts(prev => [data, ...prev]);
      toast.success("Draft created successfully");
      return data;
    } catch (error) {
      console.error("Error creating draft:", error);
      toast.error("Failed to create draft");
      return null;
    }
  };

  const updateDraft = async (id: string, updates: Partial<ICDraft>) => {
    try {
      const { error } = await supabase
        .from("ic_drafts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
      toast.success("Draft saved");
    } catch (error) {
      console.error("Error updating draft:", error);
      toast.error("Failed to save draft");
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ic_drafts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setDrafts(prev => prev.filter(d => d.id !== id));
      toast.success("Draft deleted");
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Failed to delete draft");
    }
  };

  const generateDocument = async (draftId: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ic-document", {
        body: { action: "generate_document", draftId },
      });

      if (error) throw error;
      
      if (data.document) {
        setDrafts(prev => prev.map(d => 
          d.id === draftId 
            ? { ...d, generated_document: data.document, status: "review" } 
            : d
        ));
        toast.success("IC Document generated successfully");
        return data.document;
      }
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
    return null;
  };

  return {
    drafts,
    isLoading,
    isGenerating,
    createDraft,
    updateDraft,
    deleteDraft,
    generateDocument,
    refetch: fetchDrafts,
  };
}
