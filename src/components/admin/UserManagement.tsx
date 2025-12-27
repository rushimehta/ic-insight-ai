import { useState } from "react";
import { UserPlus, Mail, User, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export function UserManagement() {
  const { activeSectors } = useSectors();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Create user via Supabase Auth admin API (requires service role in edge function)
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
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error(error.message || "Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
            <Label>Sector Access</Label>
            <p className="text-xs text-muted-foreground">
              Select which sectors this user can access. Admin and IC Chairman have access to all sectors.
            </p>
            <div className="flex flex-wrap gap-2">
              {activeSectors.map((sector) => (
                <div
                  key={sector.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors text-sm ${
                    selectedSectors.includes(sector.name)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleSectorToggle(sector.name)}
                >
                  {selectedSectors.includes(sector.name) && <Check className="w-3 h-3" />}
                  {sector.display_name}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              User will receive an email to set their password
            </div>
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
    </div>
  );
}
