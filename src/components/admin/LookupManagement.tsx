import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Building2, MapPin, Loader2, Trash2 } from "lucide-react";
import { useLookups, LookupItem } from "@/hooks/useLookups";

interface LookupFormData {
  name: string;
  display_name: string;
}

export function LookupManagement() {
  const { departments, locations, isLoading, refetch } = useLookups();
  const [activeTab, setActiveTab] = useState("departments");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [formData, setFormData] = useState<LookupFormData>({ name: "", display_name: "" });
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFormData({ name: "", display_name: "" });
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.display_name.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    const table = activeTab === "departments" ? "lookup_departments" : "lookup_locations";
    
    try {
      if (editingItem) {
        const { error } = await supabase
          .from(table)
          .update({ 
            name: formData.name.toLowerCase().replace(/\s+/g, "_"),
            display_name: formData.display_name 
          })
          .eq("id", editingItem.id);
        
        if (error) throw error;
        toast.success("Updated successfully");
      } else {
        const { error } = await supabase
          .from(table)
          .insert({ 
            name: formData.name.toLowerCase().replace(/\s+/g, "_"),
            display_name: formData.display_name 
          });
        
        if (error) throw error;
        toast.success("Added successfully");
      }
      
      refetch();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: LookupItem) => {
    const table = activeTab === "departments" ? "lookup_departments" : "lookup_locations";
    
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !item.is_active })
        .eq("id", item.id);
      
      if (error) throw error;
      toast.success(`${item.display_name} ${item.is_active ? "deactivated" : "activated"}`);
      refetch();
    } catch (error: any) {
      console.error("Error toggling:", error);
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (item: LookupItem) => {
    const table = activeTab === "departments" ? "lookup_departments" : "lookup_locations";
    
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", item.id);
      
      if (error) throw error;
      toast.success(`${item.display_name} deleted`);
      refetch();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const openEditDialog = (item: LookupItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, display_name: item.display_name });
    setIsAddDialogOpen(true);
  };

  const items = activeTab === "departments" ? departments : locations;
  const Icon = activeTab === "departments" ? Building2 : MapPin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lookup Values</h3>
          <p className="text-sm text-muted-foreground">
            Manage dropdown options for departments and locations
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === "departments" ? "Department" : "Location"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit" : "Add"} {activeTab === "departments" ? "Department" : "Location"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    display_name: e.target.value,
                    name: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
                  }))}
                  placeholder="e.g. New York Office"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">System Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. new_york_office"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Used internally, lowercase with underscores</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingItem ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Locations
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No {activeTab} added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.display_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggleActive(item)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
