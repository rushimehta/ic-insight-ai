import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SectorType } from "@/hooks/useUserPermissions";
import type { Json } from "@/integrations/supabase/types";

export interface Deal {
  id: string;
  deal_name: string;
  company_name: string;
  sector: SectorType;
  stage: string;
  ic_stage: string;
  deal_size: string | null;
  description: string | null;
  lead_partner: string | null;
  deal_team: Json;
  ic_date: string | null;
  target_close_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  metadata: Json;
}

export interface DealAttributeDefinition {
  id: string;
  name: string;
  display_name: string;
  attribute_type: string;
  options: string[];
  is_required: boolean;
  is_active: boolean;
  display_order: number;
}

export interface DealAttribute {
  id: string;
  deal_id: string;
  attribute_id: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_boolean: boolean | null;
  value_json: Json;
}

export function useDeals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<DealAttributeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setDeals((data || []) as Deal[]);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAttributeDefinitions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("deal_attribute_definitions")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      
      const parsed: DealAttributeDefinition[] = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        display_name: d.display_name,
        attribute_type: d.attribute_type,
        options: Array.isArray(d.options) 
          ? d.options.map(o => String(o))
          : typeof d.options === 'string' 
            ? JSON.parse(d.options) 
            : [],
        is_required: d.is_required ?? false,
        is_active: d.is_active ?? true,
        display_order: d.display_order ?? 0,
      }));
      
      setAttributeDefinitions(parsed);
    } catch (error) {
      console.error("Error fetching attribute definitions:", error);
    }
  }, []);

  const fetchDealAttributes = useCallback(async (dealId: string): Promise<DealAttribute[]> => {
    try {
      const { data, error } = await supabase
        .from("deal_attributes")
        .select("*")
        .eq("deal_id", dealId);

      if (error) throw error;
      return (data || []) as DealAttribute[];
    } catch (error) {
      console.error("Error fetching deal attributes:", error);
      return [];
    }
  }, []);

  const saveDealAttribute = useCallback(async (
    dealId: string,
    attributeId: string,
    value: any,
    attributeType: string
  ) => {
    const attributeData: {
      deal_id: string;
      attribute_id: string;
      value_text: string | null;
      value_number: number | null;
      value_date: string | null;
      value_boolean: boolean | null;
      value_json: Json | null;
    } = {
      deal_id: dealId,
      attribute_id: attributeId,
      value_text: null,
      value_number: null,
      value_date: null,
      value_boolean: null,
      value_json: null,
    };

    switch (attributeType) {
      case "text":
        attributeData.value_text = value;
        break;
      case "number":
        attributeData.value_number = value;
        break;
      case "date":
        attributeData.value_date = value;
        break;
      case "boolean":
        attributeData.value_boolean = value;
        break;
      case "select":
        attributeData.value_text = value;
        break;
      case "multi_select":
        attributeData.value_json = value;
        break;
    }

    const { error } = await supabase
      .from("deal_attributes")
      .upsert(attributeData, { 
        onConflict: "deal_id,attribute_id" 
      });

    if (error) throw error;
  }, []);

  const createDeal = useCallback(async (dealData: {
    deal_name: string;
    company_name: string;
    sector: SectorType;
    stage?: string;
    ic_stage?: string;
    deal_size?: string | null;
    description?: string | null;
    lead_partner?: string | null;
    ic_date?: string | null;
    target_close_date?: string | null;
  }): Promise<Deal> => {
    if (!user) throw new Error("User not authenticated");

    const insertData: any = {
      deal_name: dealData.deal_name,
      company_name: dealData.company_name,
      sector: dealData.sector,
      stage: dealData.stage || "sourcing",
      ic_stage: dealData.ic_stage || "ic1",
      deal_size: dealData.deal_size ?? null,
      description: dealData.description ?? null,
      lead_partner: dealData.lead_partner ?? null,
      ic_date: dealData.ic_date ?? null,
      target_close_date: dealData.target_close_date ?? null,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("deals")
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    
    await fetchDeals();
    return data as Deal;
  }, [user, fetchDeals]);

  const updateDeal = useCallback(async (id: string, dealData: {
    deal_name?: string;
    company_name?: string;
    sector?: SectorType;
    stage?: string;
    ic_stage?: string;
    deal_size?: string | null;
    description?: string | null;
    lead_partner?: string | null;
    ic_date?: string | null;
    target_close_date?: string | null;
  }) => {
    // Cast to proper types for Supabase
    const updateData: Record<string, unknown> = {};
    if (dealData.deal_name !== undefined) updateData.deal_name = dealData.deal_name;
    if (dealData.company_name !== undefined) updateData.company_name = dealData.company_name;
    if (dealData.sector !== undefined) updateData.sector = dealData.sector;
    if (dealData.stage !== undefined) updateData.stage = dealData.stage as "sourcing" | "initial_review" | "due_diligence" | "ic_scheduled" | "ic_complete" | "approved" | "closed" | "passed";
    if (dealData.ic_stage !== undefined) updateData.ic_stage = dealData.ic_stage as "ic1" | "ic2" | "ic3" | "ic4" | "ic_final" | "approved" | "rejected";
    if (dealData.deal_size !== undefined) updateData.deal_size = dealData.deal_size;
    if (dealData.description !== undefined) updateData.description = dealData.description;
    if (dealData.lead_partner !== undefined) updateData.lead_partner = dealData.lead_partner;
    if (dealData.ic_date !== undefined) updateData.ic_date = dealData.ic_date;
    if (dealData.target_close_date !== undefined) updateData.target_close_date = dealData.target_close_date;

    const { error } = await supabase
      .from("deals")
      .update(updateData as any)
      .eq("id", id);

    if (error) throw error;
    await fetchDeals();
  }, [fetchDeals]);

  const deleteDeal = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("deals")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    fetchDeals();
    fetchAttributeDefinitions();
  }, [fetchDeals, fetchAttributeDefinitions]);

  return {
    deals,
    attributeDefinitions,
    isLoading,
    fetchDeals,
    fetchDealAttributes,
    saveDealAttribute,
    createDeal,
    updateDeal,
    deleteDeal,
    refetch: fetchDeals,
  };
}
