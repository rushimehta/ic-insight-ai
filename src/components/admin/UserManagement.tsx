import { useState, useEffect } from "react";
import { UserPlus, Mail, User, Loader2, Check, AlertCircle, Eye, Trash2, UserX, RefreshCw, Shield, Globe, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSectors } from "@/hooks/useSectors";

const ROLES = [
  { value: "deal_team", label: "Deal Team", description: "Can view and manage deals" },
  { value: "ic_member", label: "IC Member", description: "Can participate in IC meetings" },
  { value: "ic_chairman", label: "IC Chairman", description: "Can manage IC meetings and notes" },
  { value: "admin", label: "Admin", description: "Full system access" },
] as const;

type AppRole = "deal_team" | "ic_member" | "ic_chairman" | "admin";
type SectorType = "technology" | "healthcare" | "financial_services" | "consumer_retail" | "industrials" | "energy" | "real_estate" | "media_entertainment" | "infrastructure";

interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
  roles: string[];
}

interface UserSectorInfo {
  user_id: string;
  sectors: string[];
}

export function UserManagement() {
  const { activeSectors } = useSectors();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [allSectorsAccess, setAllSectorsAccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [userSectors, setUserSectors] = useState<Record<string, string[]>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState("add");
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editRoles, setEditRoles] = useState<AppRole[]>([]);
  const [editSectors, setEditSectors] = useState<string[]>([]);
  const [editAllSectors, setEditAllSectors] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserSectors();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });

      if (error) throw error;
      setUsers(data?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchUserSectors = async () => {
    try {
      const { data, error } = await supabase
        .from("user_sectors")
        .select("user_id, sector");

      if (error) throw error;
      
      const sectorsByUser: Record<string, string[]> = {};
      data?.forEach(row => {
        if (!sectorsByUser[row.user_id]) {
          sectorsByUser[row.user_id] = [];
        }
        sectorsByUser[row.user_id].push(row.sector);
      });
      setUserSectors(sectorsByUser);
    } catch (error) {
      console.error("Error fetching user sectors:", error);
    }
  };

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleAllSectorsToggle = (checked: boolean) => {
    setAllSectorsAccess(checked);
    if (checked) {
      setSelectedSectors(activeSectors.map(s => s.name));
    } else {
      setSelectedSectors([]);
    }
  };

  const handleAddUser = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: email.trim(),
          fullName: fullName.trim(),
          roles: selectedRoles,
          sectors: selectedSectors,
        },
      });

      if (error) throw error;

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setFullName("");
      setSelectedRoles([]);
      setSelectedSectors([]);
      setAllSectorsAccess(false);
      setShowEmailPreview(false);
      fetchUsers();
      fetchUserSectors();
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error(error.message || "Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateUser = async (userId: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: { 
          action: currentlyActive ? "deactivate" : "activate",
          userId 
        },
      });

      if (error) throw error;

      toast.success(`User ${currentlyActive ? "deactivated" : "activated"} successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", userId },
      });

      if (error) throw error;

      toast.success("User deleted successfully");
      fetchUsers();
      fetchUserSectors();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const openEditDialog = (user: UserInfo) => {
    setEditingUser(user);
    setEditRoles(user.roles as AppRole[]);
    const userSectorList = userSectors[user.id] || [];
    setEditSectors(userSectorList);
    setEditAllSectors(userSectorList.length === activeSectors.length && activeSectors.length > 0);
  };

  const handleEditRoleToggle = (role: AppRole) => {
    setEditRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleEditSectorToggle = (sector: string) => {
    setEditSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleEditAllSectorsToggle = (checked: boolean) => {
    setEditAllSectors(checked);
    if (checked) {
      setEditSectors(activeSectors.map(s => s.name));
    } else {
      setEditSectors([]);
    }
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;

    setIsSavingEdit(true);
    try {
      // Update roles - delete existing and add new
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUser.id);

      if (editRoles.length > 0) {
        await supabase
          .from("user_roles")
          .insert(editRoles.map(role => ({
            user_id: editingUser.id,
            role: role
          })));
      }

      // Update sectors - delete existing and add new
      await supabase
        .from("user_sectors")
        .delete()
        .eq("user_id", editingUser.id);

      if (editSectors.length > 0) {
        await supabase
          .from("user_sectors")
          .insert(editSectors.map(sector => ({
            user_id: editingUser.id,
            sector: sector as SectorType
          })));
      }

      toast.success("User updated successfully");
      setEditingUser(null);
      fetchUsers();
      fetchUserSectors();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const emailPreviewHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to IC Platform</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hi ${fullName || "there"},
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
          You've been invited to join the IC Platform. Your account has been created with the following access:
        </p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px 0; text-transform: uppercase;">Assigned Roles</p>
          <p style="font-size: 14px; color: #374151; margin: 0;">
            ${selectedRoles.length > 0 ? selectedRoles.map(r => ROLES.find(role => role.value === r)?.label).join(", ") : "None selected"}
          </p>
        </div>
        ${selectedSectors.length > 0 ? `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px 0; text-transform: uppercase;">Sector Access</p>
          <p style="font-size: 14px; color: #374151; margin: 0;">
            ${allSectorsAccess ? "All Sectors" : selectedSectors.map(s => activeSectors.find(sec => sec.name === s)?.display_name || s).join(", ")}
          </p>
        </div>
        ` : ""}
        <div style="text-align: center; margin-top: 24px;">
          <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Set Your Password
          </a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;">
          This link will expire in 24 hours. If you didn't expect this invitation, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Manage Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Roles Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New User
              </CardTitle>
              <CardDescription>
                Add a new user to the system. They will receive an email invitation to set up their account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-3">
                <Label>Roles *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ROLES.map((role) => (
                    <div
                      key={role.value}
                      className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedRoles.includes(role.value)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleRoleToggle(role.value)}
                    >
                      <Checkbox
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={() => handleRoleToggle(role.value)}
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sectors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sector Access</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select which sectors this user can access. Admin and IC Chairman have access to all sectors by default.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="all-sectors" className="text-sm font-normal">All Sectors</Label>
                    <Switch
                      id="all-sectors"
                      checked={allSectorsAccess}
                      onCheckedChange={handleAllSectorsToggle}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeSectors.map((sector) => (
                    <div
                      key={sector.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors text-sm ${
                        selectedSectors.includes(sector.name)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      } ${allSectorsAccess ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => !allSectorsAccess && handleSectorToggle(sector.name)}
                    >
                      {selectedSectors.includes(sector.name) && <Check className="w-3 h-3" />}
                      {sector.display_name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmailPreview(true)}
                  disabled={!email.trim()}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Email
                </Button>
                <Button onClick={handleAddUser} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    View, edit roles/sectors, deactivate, or delete existing users
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => { fetchUsers(); fetchUserSectors(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-secondary/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{user.full_name || user.email}</p>
                              {!user.is_active && (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.roles.length > 0 && user.roles.map(role => (
                                <Badge key={role} variant="outline" className="text-xs capitalize">
                                  {role.replace("_", " ")}
                                </Badge>
                              ))}
                              {userSectors[user.id]?.length === activeSectors.length && activeSectors.length > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Globe className="w-3 h-3 mr-1" />
                                  All Sectors
                                </Badge>
                              ) : userSectors[user.id]?.length > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  {userSectors[user.id].length} sector(s)
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id, user.is_active)}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            {user.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.full_name || user.email}? This action cannot be undone and will remove all their data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Roles Overview
              </CardTitle>
              <CardDescription>
                View all available roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {ROLES.map((role) => {
                  const usersWithRole = users.filter(u => u.roles.includes(role.value));
                  return (
                    <div key={role.value} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">{role.label}</h3>
                        </div>
                        <Badge variant="secondary">{usersWithRole.length} user(s)</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      
                      {/* Role-specific permissions */}
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Permissions</p>
                        <div className="flex flex-wrap gap-1">
                          {role.value === "admin" && (
                            <>
                              <Badge variant="outline" className="text-xs">Full Access</Badge>
                              <Badge variant="outline" className="text-xs">User Management</Badge>
                              <Badge variant="outline" className="text-xs">All Sectors</Badge>
                            </>
                          )}
                          {role.value === "ic_chairman" && (
                            <>
                              <Badge variant="outline" className="text-xs">IC Notes</Badge>
                              <Badge variant="outline" className="text-xs">Meeting Management</Badge>
                              <Badge variant="outline" className="text-xs">All Sectors</Badge>
                            </>
                          )}
                          {role.value === "ic_member" && (
                            <>
                              <Badge variant="outline" className="text-xs">View IC Meetings</Badge>
                              <Badge variant="outline" className="text-xs">Sector-Based Access</Badge>
                            </>
                          )}
                          {role.value === "deal_team" && (
                            <>
                              <Badge variant="outline" className="text-xs">Manage Deals</Badge>
                              <Badge variant="outline" className="text-xs">Upload Documents</Badge>
                              <Badge variant="outline" className="text-xs">Sector-Based Access</Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Users with this role */}
                      {usersWithRole.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground uppercase">Users</p>
                          <div className="flex flex-wrap gap-1">
                            {usersWithRole.slice(0, 5).map(user => (
                              <Badge key={user.id} variant="secondary" className="text-xs">
                                {user.full_name || user.email.split("@")[0]}
                              </Badge>
                            ))}
                            {usersWithRole.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{usersWithRole.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update roles and sector access for {editingUser?.full_name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Edit Roles */}
            <div className="space-y-3">
              <Label>Roles</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLES.map((role) => (
                  <div
                    key={role.value}
                    className={`flex items-center space-x-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                      editRoles.includes(role.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleEditRoleToggle(role.value)}
                  >
                    <Checkbox
                      checked={editRoles.includes(role.value)}
                      onCheckedChange={() => handleEditRoleToggle(role.value)}
                    />
                    <span className="text-sm">{role.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Sectors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Sector Access</Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="edit-all-sectors" className="text-sm font-normal">All Sectors</Label>
                  <Switch
                    id="edit-all-sectors"
                    checked={editAllSectors}
                    onCheckedChange={handleEditAllSectorsToggle}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSectors.map((sector) => (
                  <div
                    key={sector.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors text-sm ${
                      editSectors.includes(sector.name)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    } ${editAllSectors ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => !editAllSectors && handleEditSectorToggle(sector.name)}
                  >
                    {editSectors.includes(sector.name) && <Check className="w-3 h-3" />}
                    {sector.display_name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUserEdit} disabled={isSavingEdit}>
              {isSavingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Preview
            </DialogTitle>
            <DialogDescription>
              This is what the user will receive when you add them.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="p-2 border-b bg-secondary/30 text-xs text-muted-foreground">
              <div><strong>To:</strong> {email || "user@example.com"}</div>
              <div><strong>Subject:</strong> Welcome to IC Platform - Set Up Your Account</div>
            </div>
            <div 
              className="p-4"
              dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailPreview(false)}>
              Close
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
