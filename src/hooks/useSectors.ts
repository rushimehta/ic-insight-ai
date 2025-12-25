import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Sector {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSectors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sectors")
        .select("*")
        .order("display_name");

      if (error) throw error;
      setSectors(data || []);
    } catch (error) {
      console.error("Error fetching sectors:", error);
      toast.error("Failed to load sectors");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  const createSector = async (sectorData: { name: string; display_name: string; description?: string }) => {
    try {
      const { data, error } = await supabase
        .from("sectors")
        .insert({
          name: sectorData.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: sectorData.display_name,
          description: sectorData.description,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSectors(prev => [...prev, data].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      toast.success("Sector created successfully");
      return data;
    } catch (error: any) {
      console.error("Error creating sector:", error);
      if (error.code === '23505') {
        toast.error("A sector with this name already exists");
      } else {
        toast.error("Failed to create sector");
      }
      return null;
    }
  };

  const updateSector = async (id: string, updates: Partial<Sector>) => {
    try {
      const { error } = await supabase
        .from("sectors")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setSectors(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success("Sector updated");
    } catch (error) {
      console.error("Error updating sector:", error);
      toast.error("Failed to update sector");
    }
  };

  const toggleSectorActive = async (id: string, isActive: boolean) => {
    await updateSector(id, { is_active: isActive });
  };

  const deleteSector = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sectors")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setSectors(prev => prev.filter(s => s.id !== id));
      toast.success("Sector deleted");
    } catch (error) {
      console.error("Error deleting sector:", error);
      toast.error("Failed to delete sector. It may be in use.");
    }
  };

  const activeSectors = sectors.filter(s => s.is_active);

  return {
    sectors,
    activeSectors,
    isLoading,
    createSector,
    updateSector,
    toggleSectorActive,
    deleteSector,
    refetch: fetchSectors,
  };
}
