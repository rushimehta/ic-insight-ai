import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "deal_team" | "ic_member" | "ic_chairman" | "admin";
export type SectorType = "technology" | "healthcare" | "financial_services" | "consumer_retail" | "industrials" | "energy" | "real_estate" | "media_entertainment" | "infrastructure";

interface UserPermissions {
  roles: AppRole[];
  sectors: SectorType[];
  isChairmanOrAdmin: boolean;
  isLoading: boolean;
}

export function useUserPermissions(): UserPermissions {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [sectors, setSectors] = useState<SectorType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setSectors([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = (rolesData || []).map((r: any) => r.role as AppRole);
      setRoles(userRoles);

      // Fetch user sectors
      const { data: sectorsData } = await supabase
        .from("user_sectors")
        .select("sector")
        .eq("user_id", user.id);

      const userSectors = (sectorsData || []).map((s: any) => s.sector as SectorType);
      setSectors(userSectors);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const isChairmanOrAdmin = roles.includes("ic_chairman") || roles.includes("admin");

  return {
    roles,
    sectors,
    isChairmanOrAdmin,
    isLoading,
  };
}
