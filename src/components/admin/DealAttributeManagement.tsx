import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, Trash2, GripVertical, Settings2 } from "lucide-react";

interface AttributeDefinition {
  id: string;
  name: string;
  display_name: string;
  attribute_type: string;
  options: string[];
  is_required: boolean;
  is_active: boolean;
  display_order: number;
}

const ATTRIBUTE_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "select", label: "Single Select" },
  { value: "multi_select", label: "Multi Select" },
];

export function DealAttributeManagement() {
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<AttributeDefinition | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    attribute_type: "text",
    options: [] as string[],
    is_required: false,
    display_order: 0,
  });
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("deal_attribute_definitions")
        .select("*")
        .order("display_order");

      if (error) throw error;

      const parsed = (data || []).map(d => ({
        ...d,
        options: Array.isArray(d.options) 
          ? d.options.map((o: any) => String(o))
          : typeof d.options === 'string' 
            ? JSON.parse(d.options) 
            : []
      }));

      setAttributes(parsed);
    } catch (error) {
      console.error("Error fetching attributes:", error);
      toast.error("Failed to load attributes");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      display_name: "",
      attribute_type: "text",
      options: [],
      is_required: false,
      display_order: attributes.length,
    });
    setOptionInput("");
    setEditingAttr(null);
  };

  const openEditDialog = (attr: AttributeDefinition) => {
    setEditingAttr(attr);
    setFormData({
      name: attr.name,
      display_name: attr.display_name,
      attribute_type: attr.attribute_type,
      options: attr.options || [],
      is_required: attr.is_required,
      display_order: attr.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleAddOption = () => {
    if (optionInput.trim() && !formData.options.includes(optionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, optionInput.trim()]
      }));
      setOptionInput("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(o => o !== option)
    }));
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    setIsSaving(true);
    try {
      const attrData = {
        name: formData.name || formData.display_name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
        display_name: formData.display_name,
        attribute_type: formData.attribute_type,
        options: formData.options,
        is_required: formData.is_required,
        display_order: formData.display_order,
      };

      if (editingAttr) {
        const { error } = await supabase
          .from("deal_attribute_definitions")
          .update(attrData)
          .eq("id", editingAttr.id);
        if (error) throw error;
        toast.success("Attribute updated");
      } else {
        const { error } = await supabase
          .from("deal_attribute_definitions")
          .insert([attrData]);
        if (error) throw error;
        toast.success("Attribute created");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAttributes();
    } catch (error: any) {
      console.error("Error saving attribute:", error);
      toast.error(error.message || "Failed to save attribute");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (attr: AttributeDefinition) => {
    try {
      const { error } = await supabase
        .from("deal_attribute_definitions")
        .update({ is_active: !attr.is_active })
        .eq("id", attr.id);

      if (error) throw error;
      toast.success(`Attribute ${attr.is_active ? "deactivated" : "activated"}`);
      fetchAttributes();
    } catch (error) {
      toast.error("Failed to update attribute");
    }
  };

  const handleDelete = async (attr: AttributeDefinition) => {
    if (!confirm(`Delete "${attr.display_name}"? This will remove this attribute from all deals.`)) return;

    try {
      const { error } = await supabase
        .from("deal_attribute_definitions")
        .delete()
        .eq("id", attr.id);

      if (error) throw error;
      toast.success("Attribute deleted");
      fetchAttributes();
    } catch (error) {
      toast.error("Failed to delete attribute");
    }
  };

  const showOptions = formData.attribute_type === "select" || formData.attribute_type === "multi_select";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Deal Attributes
          </h3>
          <p className="text-sm text-muted-foreground">
            Define custom fields for deal tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Attribute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAttr ? "Edit Attribute" : "New Attribute"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    display_name: e.target.value,
                    name: prev.name || e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
                  }))}
                  placeholder="e.g. Investment Type"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.attribute_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, attribute_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showOptions && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Add option..."
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOption())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddOption}>
                      Add
                    </Button>
                  </div>
                  {formData.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.options.map((opt) => (
                        <Badge key={opt} variant="secondary" className="gap-1">
                          {opt}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_required}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_required: v }))}
                />
                <Label>Required field</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingAttr ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : attributes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No custom attributes defined</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add attributes to track additional deal information
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {attributes.map((attr) => (
            <div
              key={attr.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                attr.is_active ? "bg-secondary/50 border-border" : "bg-muted/30 border-muted opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{attr.display_name}</p>
                    {attr.is_required && (
                      <Badge variant="outline" className="text-[10px]">Required</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{attr.attribute_type.replace("_", " ")}</span>
                    {attr.options.length > 0 && (
                      <span>• {attr.options.length} options</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={attr.is_active}
                  onCheckedChange={() => handleToggleActive(attr)}
                />
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(attr)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(attr)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
