import { useState } from "react";
import { Shield, Plus, Pencil, Trash2, Check, X, Users, AlertTriangle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────

interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
  color: string;
}

// ─── Available Permissions ─────────────────────────────────────────

const ALL_PERMISSIONS: Permission[] = [
  // Deal Management
  { id: "deals.view", label: "View Deals", description: "View deal pipeline and details", category: "Deal Management" },
  { id: "deals.create", label: "Create Deals", description: "Add new deals to pipeline", category: "Deal Management" },
  { id: "deals.edit", label: "Edit Deals", description: "Modify deal information", category: "Deal Management" },
  { id: "deals.delete", label: "Delete Deals", description: "Remove deals from pipeline", category: "Deal Management" },
  // IC Meetings
  { id: "ic.view", label: "View IC Meetings", description: "View IC meeting schedule and history", category: "IC Meetings" },
  { id: "ic.submit", label: "Submit IC Materials", description: "Upload and submit IC documents", category: "IC Meetings" },
  { id: "ic.vote", label: "Vote on Deals", description: "Cast votes during IC meetings", category: "IC Meetings" },
  { id: "ic.chair", label: "Chair Meetings", description: "Manage IC meetings and record notes", category: "IC Meetings" },
  { id: "ic.schedule", label: "Schedule Meetings", description: "Create and schedule IC meetings", category: "IC Meetings" },
  // Documents
  { id: "docs.view", label: "View Documents", description: "View IC archive and repository", category: "Documents" },
  { id: "docs.upload", label: "Upload Documents", description: "Upload IC decks and documents", category: "Documents" },
  { id: "docs.generate", label: "Generate Memos", description: "Use IC Memo Builder", category: "Documents" },
  // AI & Analytics
  { id: "ai.chat", label: "Deal Advisor AI", description: "Access AI deal analysis", category: "AI & Analytics" },
  { id: "ai.questions", label: "IC Question Prep", description: "Access IC question preparation", category: "AI & Analytics" },
  { id: "analytics.view", label: "View Analytics", description: "View fund analytics dashboard", category: "AI & Analytics" },
  // Administration
  { id: "admin.users", label: "Manage Users", description: "Create, edit, and deactivate users", category: "Administration" },
  { id: "admin.roles", label: "Manage Roles", description: "Create and edit roles", category: "Administration" },
  { id: "admin.sectors", label: "Manage Sectors", description: "Configure sector definitions", category: "Administration" },
  { id: "admin.settings", label: "System Settings", description: "Configure system-wide settings", category: "Administration" },
  { id: "admin.sso", label: "SSO Configuration", description: "Configure SSO providers", category: "Administration" },
];

const PERMISSION_CATEGORIES = [...new Set(ALL_PERMISSIONS.map(p => p.category))];

// ─── Default Roles ──────────────────────────────────────────────────

const DEFAULT_ROLES: Role[] = [
  {
    id: "deal_team",
    name: "deal_team",
    displayName: "Deal Team",
    description: "Can prepare and submit IC documents for their assigned sectors. View deals, upload documents, and use AI tools.",
    permissions: ["deals.view", "deals.create", "deals.edit", "ic.view", "ic.submit", "docs.view", "docs.upload", "docs.generate", "ai.chat", "ai.questions"],
    isSystem: true,
    userCount: 8,
    color: "#3b82f6",
  },
  {
    id: "ic_member",
    name: "ic_member",
    displayName: "IC Member",
    description: "Can view ICs in assigned sectors, ask questions, vote on deals, and access analytics.",
    permissions: ["deals.view", "ic.view", "ic.vote", "docs.view", "ai.chat", "ai.questions", "analytics.view"],
    isSystem: true,
    userCount: 5,
    color: "#8b5cf6",
  },
  {
    id: "ic_chairman",
    name: "ic_chairman",
    displayName: "IC Chairman",
    description: "Full IC access across all sectors. Can chair meetings, record notes, schedule ICs, and manage the IC process.",
    permissions: ["deals.view", "deals.create", "deals.edit", "ic.view", "ic.submit", "ic.vote", "ic.chair", "ic.schedule", "docs.view", "docs.upload", "docs.generate", "ai.chat", "ai.questions", "analytics.view"],
    isSystem: true,
    userCount: 2,
    color: "#f59e0b",
  },
  {
    id: "admin",
    name: "admin",
    displayName: "Administrator",
    description: "Full system access including user management, role configuration, SSO setup, and all operational features.",
    permissions: ALL_PERMISSIONS.map(p => p.id),
    isSystem: true,
    userCount: 1,
    color: "#ef4444",
  },
];

// ─── Component ──────────────────────────────────────────────────────

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit form state
  const [formName, setFormName] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formColor, setFormColor] = useState("#3b82f6");

  const openCreateDialog = () => {
    setIsCreating(true);
    setEditingRole(null);
    setFormName("");
    setFormDisplayName("");
    setFormDescription("");
    setFormPermissions([]);
    setFormColor("#3b82f6");
    setEditDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setIsCreating(false);
    setEditingRole(role);
    setFormName(role.name);
    setFormDisplayName(role.displayName);
    setFormDescription(role.description);
    setFormPermissions([...role.permissions]);
    setFormColor(role.color);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setEditingRole(role);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formDisplayName.trim()) {
      toast.error("Role name is required");
      return;
    }

    const roleName = formName.trim() || formDisplayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    if (isCreating) {
      if (roles.some(r => r.name === roleName)) {
        toast.error("A role with this name already exists");
        return;
      }
      const newRole: Role = {
        id: roleName,
        name: roleName,
        displayName: formDisplayName.trim(),
        description: formDescription.trim(),
        permissions: formPermissions,
        isSystem: false,
        userCount: 0,
        color: formColor,
      };
      setRoles(prev => [...prev, newRole]);
      toast.success(`Role "${formDisplayName}" created`);
    } else if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? {
        ...r,
        displayName: formDisplayName.trim(),
        description: formDescription.trim(),
        permissions: formPermissions,
        color: formColor,
      } : r));
      toast.success(`Role "${formDisplayName}" updated`);
    }
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (!editingRole) return;
    if (editingRole.userCount > 0) {
      toast.error(`Cannot delete role with ${editingRole.userCount} active users. Reassign users first.`);
      setDeleteDialogOpen(false);
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== editingRole.id));
    toast.success(`Role "${editingRole.displayName}" deleted`);
    setDeleteDialogOpen(false);
    setEditingRole(null);
  };

  const togglePermission = (permId: string) => {
    setFormPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const toggleAllInCategory = (category: string) => {
    const catPerms = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.id);
    const allSelected = catPerms.every(p => formPermissions.includes(p));
    if (allSelected) {
      setFormPermissions(prev => prev.filter(p => !catPerms.includes(p)));
    } else {
      setFormPermissions(prev => [...new Set([...prev, ...catPerms])]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Role Management
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and manage roles and their permissions. System roles can be modified but not deleted.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => (
          <div
            key={role.id}
            className="glass rounded-xl overflow-hidden border border-border hover:border-primary/20 transition-all"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${role.color}20`, color: role.color }}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{role.displayName}</h4>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px]">System</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(role)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {!role.isSystem && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => openDeleteDialog(role)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{role.description}</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 6).map(permId => {
                  const perm = ALL_PERMISSIONS.find(p => p.id === permId);
                  return perm ? (
                    <Badge key={permId} variant="outline" className="text-[10px] font-normal">
                      {perm.label}
                    </Badge>
                  ) : null;
                })}
                {role.permissions.length > 6 && (
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                    +{role.permissions.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Create New Role" : `Edit Role: ${editingRole?.displayName}`}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Define a new role with specific permissions." : "Modify role settings and permissions."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Name *</Label>
                  <Input
                    value={formDisplayName}
                    onChange={e => setFormDisplayName(e.target.value)}
                    placeholder="e.g., Senior Analyst"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Internal Name</Label>
                  <Input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Auto-generated from display name"
                    disabled={!isCreating}
                    className={!isCreating ? "opacity-50" : ""}
                  />
                  <p className="text-[10px] text-muted-foreground">Lowercase, underscores only. Auto-generated if left blank.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describe what this role can do..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#78716c"].map(c => (
                    <button
                      key={c}
                      className={cn(
                        "w-8 h-8 rounded-lg border-2 transition-all",
                        formColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                      )}
                      style={{ background: c }}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <Label className="mb-3 block">Permissions ({formPermissions.length} selected)</Label>
                <div className="space-y-4">
                  {PERMISSION_CATEGORIES.map(category => {
                    const catPerms = ALL_PERMISSIONS.filter(p => p.category === category);
                    const selectedCount = catPerms.filter(p => formPermissions.includes(p.id)).length;
                    const allSelected = selectedCount === catPerms.length;
                    return (
                      <div key={category} className="rounded-lg border border-border overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          onClick={() => toggleAllInCategory(category)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={allSelected} className="pointer-events-none" />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{selectedCount}/{catPerms.length}</span>
                        </button>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catPerms.map(perm => (
                            <label
                              key={perm.id}
                              className={cn(
                                "flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors",
                                formPermissions.includes(perm.id) ? "bg-primary/5" : "hover:bg-secondary/50"
                              )}
                            >
                              <Checkbox
                                checked={formPermissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                className="mt-0.5"
                              />
                              <div>
                                <p className="text-xs font-medium">{perm.label}</p>
                                <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-1.5" />
              {isCreating ? "Create Role" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Role: {editingRole?.displayName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingRole?.userCount ? (
                <span className="text-red-500 font-medium">
                  This role has {editingRole.userCount} active user(s). You must reassign all users before deleting this role.
                </span>
              ) : (
                <>This will permanently delete the role <strong>{editingRole?.displayName}</strong>. This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={!!editingRole?.userCount}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
