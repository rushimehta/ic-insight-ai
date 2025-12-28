import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions, SectorType } from "@/hooks/useUserPermissions";
import { useSectors } from "@/hooks/useSectors";
import { useLookups } from "@/hooks/useLookups";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { 
  User, 
  Briefcase, 
  Phone, 
  MapPin, 
  Linkedin, 
  Loader2,
  Building2,
  Globe
} from "lucide-react";

interface ProfileData {
  full_name: string | null;
  job_title: string | null;
  department: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  linkedin_url: string | null;
}

export function ProfileSettings() {
  const { user } = useAuth();
  const { sectors: userSectors } = useUserPermissions();
  const { activeSectors } = useSectors();
  const { departments, locations } = useLookups();
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    job_title: "",
    department: "",
    phone: "",
    location: "",
    bio: "",
    linkedin_url: "",
  });
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Convert lookups to combobox options
  const departmentOptions = departments
    .filter(d => d.is_active)
    .map(d => ({ value: d.name, label: d.display_name }));

  const locationOptions = locations
    .filter(l => l.is_active)
    .map(l => ({ value: l.name, label: l.display_name }));

  const sectorOptions = activeSectors.map(s => ({
    value: s.name,
    label: s.display_name,
  }));

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchUserSectors();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, job_title, department, phone, location, bio, linkedin_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          job_title: data.job_title || "",
          department: data.department || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          linkedin_url: data.linkedin_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSectors = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("user_sectors")
        .select("sector")
        .eq("user_id", user.id);

      if (error) throw error;
      
      setSelectedSectors(data?.map(s => s.sector) || []);
    } catch (error) {
      console.error("Error fetching user sectors:", error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name || null,
          job_title: profile.job_title || null,
          department: profile.department || null,
          phone: profile.phone || null,
          location: profile.location || null,
          bio: profile.bio || null,
          linkedin_url: profile.linkedin_url || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update sectors - delete existing and add new
      await supabase
        .from("user_sectors")
        .delete()
        .eq("user_id", user.id);

      if (selectedSectors.length > 0) {
        const { error: sectorsError } = await supabase
          .from("user_sectors")
          .insert(selectedSectors.map(sector => ({
            user_id: user.id,
            sector: sector as SectorType
          })));

        if (sectorsError) throw sectorsError;
      }

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={profile.full_name || ""}
                  onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="John Doe"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="job_title"
                  value={profile.job_title || ""}
                  onChange={(e) => setProfile(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="Senior Analyst"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Combobox
                options={departmentOptions}
                value={profile.department || ""}
                onValueChange={(value) => setProfile(p => ({ ...p, department: value }))}
                placeholder="Select department"
                searchPlaceholder="Search departments..."
                emptyText="No departments found."
                icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 555-123-4567"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Combobox
                options={locationOptions}
                value={profile.location || ""}
                onValueChange={(value) => setProfile(p => ({ ...p, location: value }))}
                placeholder="Select location"
                searchPlaceholder="Search locations..."
                emptyText="No locations found."
                icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="linkedin_url"
                  value={profile.linkedin_url || ""}
                  onChange={(e) => setProfile(p => ({ ...p, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="Brief professional bio..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sector Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Sector Access
          </CardTitle>
          <CardDescription>
            Select the sectors you're interested in or have expertise in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MultiCombobox
            options={sectorOptions}
            values={selectedSectors}
            onValuesChange={setSelectedSectors}
            placeholder="Search and select sectors..."
            searchPlaceholder="Search sectors..."
            emptyText="No sectors found."
          />
          {selectedSectors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSectors.map(sector => {
                const sectorInfo = activeSectors.find(s => s.name === sector);
                return (
                  <Badge key={sector} variant="secondary">
                    {sectorInfo?.display_name || sector}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
