import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSectors } from "@/hooks/useSectors";
import { useDeals, Deal, DealAttributeDefinition, DealAttribute } from "@/hooks/useDeals";
import type { SectorType } from "@/hooks/useUserPermissions";

const DEAL_STAGES = [
  { value: "sourcing", label: "Sourcing" },
  { value: "initial_review", label: "Initial Review" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "ic_scheduled", label: "IC Scheduled" },
  { value: "ic_complete", label: "IC Complete" },
  { value: "approved", label: "Approved" },
  { value: "closed", label: "Closed" },
  { value: "passed", label: "Passed" },
];

const IC_STAGES = [
  { value: "ic1", label: "IC 1 - Initial Review" },
  { value: "ic2", label: "IC 2 - Deep Dive" },
  { value: "ic3", label: "IC 3 - Due Diligence" },
  { value: "ic4", label: "IC 4 - Final Terms" },
  { value: "ic_final", label: "IC Final - Decision" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

interface DealFormProps {
  deal?: Deal | null;
  onSave: () => void;
  onCancel: () => void;
}

export function DealForm({ deal, onSave, onCancel }: DealFormProps) {
  const { activeSectors } = useSectors();
  const { attributeDefinitions, createDeal, updateDeal, fetchDealAttributes, saveDealAttribute } = useDeals();
  
  const [formData, setFormData] = useState({
    deal_name: "",
    company_name: "",
    sector: "" as SectorType | "",
    stage: "sourcing",
    ic_stage: "ic1",
    deal_size: "",
    description: "",
    lead_partner: "",
    ic_date: null as Date | null,
    target_close_date: null as Date | null,
  });

  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAttrs, setIsLoadingAttrs] = useState(false);

  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name || "",
        company_name: deal.company_name || "",
        sector: deal.sector || "",
        stage: deal.stage || "sourcing",
        ic_stage: deal.ic_stage || "ic1",
        deal_size: deal.deal_size || "",
        description: deal.description || "",
        lead_partner: deal.lead_partner || "",
        ic_date: deal.ic_date ? new Date(deal.ic_date) : null,
        target_close_date: deal.target_close_date ? new Date(deal.target_close_date) : null,
      });
      
      // Load custom attributes
      loadDealAttributes(deal.id);
    }
  }, [deal]);

  const loadDealAttributes = async (dealId: string) => {
    setIsLoadingAttrs(true);
    try {
      const attrs = await fetchDealAttributes(dealId);
      const attrMap: Record<string, any> = {};
      
      attrs.forEach(attr => {
        const def = attributeDefinitions.find(d => d.id === attr.attribute_id);
        if (def) {
          switch (def.attribute_type) {
            case "number":
              attrMap[attr.attribute_id] = attr.value_number;
              break;
            case "date":
              attrMap[attr.attribute_id] = attr.value_date;
              break;
            case "boolean":
              attrMap[attr.attribute_id] = attr.value_boolean;
              break;
            case "multi_select":
              attrMap[attr.attribute_id] = attr.value_json || [];
              break;
            default:
              attrMap[attr.attribute_id] = attr.value_text;
          }
        }
      });
      
      setCustomAttributes(attrMap);
    } catch (error) {
      console.error("Error loading attributes:", error);
    } finally {
      setIsLoadingAttrs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deal_name.trim() || !formData.company_name.trim() || !formData.sector) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    try {
      const dealData = {
        deal_name: formData.deal_name,
        company_name: formData.company_name,
        sector: formData.sector as SectorType,
        stage: formData.stage,
        ic_stage: formData.ic_stage,
        deal_size: formData.deal_size || null,
        description: formData.description || null,
        lead_partner: formData.lead_partner || null,
        ic_date: formData.ic_date ? format(formData.ic_date, "yyyy-MM-dd") : null,
        target_close_date: formData.target_close_date ? format(formData.target_close_date, "yyyy-MM-dd") : null,
      };

      let savedDeal: Deal;
      if (deal) {
        await updateDeal(deal.id, dealData);
        savedDeal = { ...deal, ...dealData };
      } else {
        savedDeal = await createDeal(dealData);
      }

      // Save custom attributes
      for (const [attrId, value] of Object.entries(customAttributes)) {
        const def = attributeDefinitions.find(d => d.id === attrId);
        if (def && value !== undefined && value !== null && value !== "") {
          await saveDealAttribute(savedDeal.id, attrId, value, def.attribute_type);
        }
      }

      toast.success(deal ? "Deal updated" : "Deal created");
      onSave();
    } catch (error: any) {
      console.error("Error saving deal:", error);
      toast.error(error.message || "Failed to save deal");
    } finally {
      setIsSaving(false);
    }
  };

  const renderAttributeField = (attr: DealAttributeDefinition) => {
    const value = customAttributes[attr.id];

    switch (attr.attribute_type) {
      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e) => setCustomAttributes(prev => ({ ...prev, [attr.id]: e.target.value }))}
            placeholder={`Enter ${attr.display_name.toLowerCase()}`}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value ?? ""}
            onChange={(e) => setCustomAttributes(prev => ({ 
              ...prev, 
              [attr.id]: e.target.value ? parseFloat(e.target.value) : null 
            }))}
            placeholder="0"
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => setCustomAttributes(prev => ({ 
                  ...prev, 
                  [attr.id]: date ? format(date, "yyyy-MM-dd") : null 
                }))}
              />
            </PopoverContent>
          </Popover>
        );

      case "boolean":
        return (
          <Switch
            checked={value || false}
            onCheckedChange={(checked) => setCustomAttributes(prev => ({ ...prev, [attr.id]: checked }))}
          />
        );

      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={(v) => setCustomAttributes(prev => ({ ...prev, [attr.id]: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${attr.display_name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attr.options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multi_select":
        const selectedValues = value || [];
        return (
          <div className="space-y-2">
            {attr.options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedValues.includes(opt)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, opt]
                      : selectedValues.filter((v: string) => v !== opt);
                    setCustomAttributes(prev => ({ ...prev, [attr.id]: newValues }));
                  }}
                />
                <span className="text-sm">{opt}</span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_name">Deal Name *</Label>
              <Input
                id="deal_name"
                value={formData.deal_name}
                onChange={(e) => setFormData(prev => ({ ...prev, deal_name: e.target.value }))}
                placeholder="Project Alpha"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector *</Label>
              <Select
                value={formData.sector}
                onValueChange={(v) => setFormData(prev => ({ ...prev, sector: v as SectorType }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {activeSectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.name}>
                      {sector.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal_size">Deal Size</Label>
              <Input
                id="deal_size"
                value={formData.deal_size}
                onChange={(e) => setFormData(prev => ({ ...prev, deal_size: e.target.value }))}
                placeholder="$100M - $150M"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Deal Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ic_stage">IC Stage</Label>
              <Select
                value={formData.ic_stage}
                onValueChange={(v) => setFormData(prev => ({ ...prev, ic_stage: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IC_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead_partner">Lead Partner</Label>
              <Input
                id="lead_partner"
                value={formData.lead_partner}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_partner: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>IC Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.ic_date ? format(formData.ic_date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.ic_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, ic_date: date || null }))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Target Close Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.target_close_date ? format(formData.target_close_date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.target_close_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, target_close_date: date || null }))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief deal description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {attributeDefinitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAttrs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attributeDefinitions.map((attr) => (
                  <div key={attr.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {attr.display_name}
                      {attr.is_required && <span className="text-destructive">*</span>}
                    </Label>
                    {renderAttributeField(attr)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {deal ? "Update Deal" : "Create Deal"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
