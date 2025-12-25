import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSectors, Sector } from "@/hooks/useSectors";

export function SectorManagement() {
  const { sectors, isLoading, createSector, updateSector, toggleSectorActive, deleteSector } = useSectors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState({ name: "", display_name: "", description: "" });

  const resetForm = () => {
    setFormData({ name: "", display_name: "", description: "" });
    setEditingSector(null);
  };

  const handleOpenDialog = (sector?: Sector) => {
    if (sector) {
      setEditingSector(sector);
      setFormData({
        name: sector.name,
        display_name: sector.display_name,
        description: sector.description || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.display_name.trim()) return;

    if (editingSector) {
      await updateSector(editingSector.id, {
        display_name: formData.display_name,
        description: formData.description || null,
      });
    } else {
      await createSector({
        name: formData.name || formData.display_name.toLowerCase().replace(/\s+/g, '_'),
        display_name: formData.display_name,
        description: formData.description || undefined,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Sector Management
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Define and manage the industry sectors for deal categorization
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="glow" size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sector
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSector ? "Edit Sector" : "Add New Sector"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Display Name</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="e.g., Technology"
                />
              </div>
              {!editingSector && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Internal Name (optional)</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., technology (auto-generated if empty)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for database references. Will be auto-generated from display name if empty.
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this sector..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button variant="glow" onClick={handleSubmit}>{editingSector ? "Save Changes" : "Create Sector"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {sectors.map((sector) => (
            <div
              key={sector.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                sector.is_active
                  ? "bg-secondary/50 border-border"
                  : "bg-muted/50 border-muted opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  sector.is_active ? "bg-primary/20" : "bg-muted"
                )}>
                  <Building2 className={cn(
                    "w-5 h-5",
                    sector.is_active ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sector.display_name}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {sector.name}
                    </Badge>
                    {!sector.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  {sector.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{sector.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSectorActive(sector.id, !sector.is_active)}
                  title={sector.is_active ? "Deactivate" : "Activate"}
                >
                  {sector.is_active ? (
                    <ToggleRight className="w-5 h-5 text-primary" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(sector)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteSector(sector.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
