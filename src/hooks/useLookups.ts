import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LookupItem {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

export function useLookups() {
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLookups = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptRes, locRes] = await Promise.all([
        supabase.from("lookup_departments").select("*").order("display_name"),
        supabase.from("lookup_locations").select("*").order("display_name"),
      ]);

      if (deptRes.data) setDepartments(deptRes.data);
      if (locRes.data) setLocations(locRes.data);
    } catch (error) {
      console.error("Error fetching lookups:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  return {
    departments,
    locations,
    isLoading,
    refetch: fetchLookups,
  };
}
