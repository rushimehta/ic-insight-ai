import { useState, useEffect } from "react";
import { Users, Shield, Building2, Search, Loader2, AlertTriangle, UserPlus, Link2, Settings2, Sliders, Globe, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSectors } from "@/hooks/useSectors";
import { SectorManagement } from "@/components/admin/SectorManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { LookupManagement } from "@/components/admin/LookupManagement";
import { DealAttributeManagement } from "@/components/admin/DealAttributeManagement";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { SSOConfiguration } from "@/components/admin/SSOConfiguration";
import { SharePointIntegration } from "@/components/integrations/SharePointIntegration";
import type { AppRole, SectorType } from "@/hooks/useUserPermissions";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string | null;
  department: string | null;
  primary_sector: SectorType | null;
}

interface UserWithRoles extends UserProfile {
  email: string;
  roles: AppRole[];
  sectors: SectorType[];
}

const ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "deal_team", label: "Deal Team", description: "Can prepare and submit IC documents" },
  { value: "ic_member", label: "IC Member", description: "Can view ICs in assigned sectors and ask questions" },
  { value: "ic_chairman", label: "IC Chairman", description: "Full IC access, can record meeting notes" },
  { value: "admin", label: "Admin", description: "Full system access including user management" },
];

export function AdminPanel() {
  const { activeSectors } = useSectors();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  const selectedUser = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch all user sectors
      const { data: allSectors, error: sectorsError } = await supabase
        .from("user_sectors")
        .select("*");

      if (sectorsError) throw sectorsError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile: UserProfile) => ({
        ...profile,
        email: "", // We don't have access to auth.users email directly
        roles: (allRoles || [])
          .filter((r: any) => r.user_id === profile.id)
          .map((r: any) => r.role as AppRole),
        sectors: (allSectors || [])
          .filter((s: any) => s.user_id === profile.id)
          .map((s: any) => s.sector as SectorType),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = async (userId: string, role: AppRole, enabled: boolean) => {
    try {
      if (enabled) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      }

      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          roles: enabled 
            ? [...u.roles, role]
            : u.roles.filter(r => r !== role)
        };
      }));
      toast.success(`Role ${enabled ? "added" : "removed"}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleSectorToggle = async (userId: string, sector: SectorType, enabled: boolean) => {
    try {
      if (enabled) {
        const { error } = await supabase
          .from("user_sectors")
          .insert({ user_id: userId, sector });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_sectors")
          .delete()
          .eq("user_id", userId)
          .eq("sector", sector);
        if (error) throw error;
      }

      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          sectors: enabled 
            ? [...u.sectors, sector]
            : u.sectors.filter(s => s !== sector)
        };
      }));
      toast.success(`Sector ${enabled ? "added" : "removed"}`);
    } catch (error) {
      console.error("Error updating sector:", error);
      toast.error("Failed to update sector");
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">Administration</h2>
        <p className="text-muted-foreground mt-1">
          Manage users, roles, and sector configurations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="add-user" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="sso" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            SSO
          </TabsTrigger>
          <TabsTrigger value="sectors" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Sectors
          </TabsTrigger>
          <TabsTrigger value="lookups" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Lookups
          </TabsTrigger>
          <TabsTrigger value="deal-attrs" className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Deal Attributes
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Info Banner */}
          <div className="glass rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Role-Based Access Control</p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Admin/Chairman</strong> roles have access to all ICs across all sectors. 
                <strong> IC Members</strong> only see ICs in their assigned sectors. 
                <strong> Deal Team</strong> members can create and submit ICs for their sectors.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* User List */}
            <div className="lg:col-span-4">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search users..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No users found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Users will appear here after they sign up
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2 pr-2">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg transition-all",
                            selectedUserId === user.id
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {user.full_name || "Unnamed User"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.roles.length > 0 
                                  ? user.roles.map(r => r.replace(/_/g, " ")).join(", ")
                                  : "No roles assigned"
                                }
                              </p>
                            </div>
                            {user.roles.includes("admin") && (
                              <Shield className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="lg:col-span-8">
              {!selectedUser ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a User</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose a user from the list to manage their roles and sector access
                  </p>
                </div>
              ) : (
                <div className="glass rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedUser.full_name || "Unnamed User"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.department || "No department"} • {selectedUser.role || "No title"}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Roles Section */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Roles
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ROLES.map((role) => (
                          <label
                            key={role.value}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                              selectedUser.roles.includes(role.value)
                                ? "bg-primary/10 border-primary/30"
                                : "border-border hover:bg-secondary/50"
                            )}
                          >
                            <Checkbox
                              checked={selectedUser.roles.includes(role.value)}
                              onCheckedChange={(checked) => 
                                handleRoleToggle(selectedUser.id, role.value, checked as boolean)
                              }
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{role.label}</p>
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Sectors Section */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Sector Access
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Select sectors this user can access. Admin and IC Chairman roles have access to all sectors automatically.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {activeSectors.map((sector) => {
                          const hasFullAccess = selectedUser.roles.includes("admin") || selectedUser.roles.includes("ic_chairman");
                          const sectorName = sector.name as SectorType;
                          return (
                            <label
                              key={sector.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                                hasFullAccess || selectedUser.sectors.includes(sectorName)
                                  ? "bg-primary/10 border-primary/30"
                                  : "border-border hover:bg-secondary/50",
                                hasFullAccess && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              <Checkbox
                                checked={hasFullAccess || selectedUser.sectors.includes(sectorName)}
                                disabled={hasFullAccess}
                                onCheckedChange={(checked) => 
                                  handleSectorToggle(selectedUser.id, sectorName, checked as boolean)
                                }
                              />
                              <span className="text-sm">{sector.display_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current Permissions Summary */}
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Permissions Summary</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.roles.length === 0 && selectedUser.sectors.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No permissions assigned</span>
                        ) : (
                          <>
                            {selectedUser.roles.map(role => (
                              <Badge key={role} variant="secondary" className="capitalize">
                                {role.replace(/_/g, " ")}
                              </Badge>
                            ))}
                            {(selectedUser.roles.includes("admin") || selectedUser.roles.includes("ic_chairman")) ? (
                              <Badge variant="outline" className="text-primary border-primary">
                                All Sectors
                              </Badge>
                            ) : (
                              selectedUser.sectors.map(sector => (
                                <Badge key={sector} variant="outline" className="capitalize">
                                  {sector.replace(/_/g, " ")}
                                </Badge>
                              ))
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="add-user">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles">
          <div className="glass rounded-xl p-6">
            <RoleManagement />
          </div>
        </TabsContent>

        <TabsContent value="sso">
          <div className="glass rounded-xl p-6">
            <SSOConfiguration />
          </div>
        </TabsContent>

        <TabsContent value="sectors">
          <div className="glass rounded-xl p-6">
            <SectorManagement />
          </div>
        </TabsContent>

        <TabsContent value="lookups">
          <div className="glass rounded-xl p-6">
            <LookupManagement />
          </div>
        </TabsContent>

        <TabsContent value="deal-attrs">
          <div className="glass rounded-xl p-6">
            <DealAttributeManagement />
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <SharePointIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
