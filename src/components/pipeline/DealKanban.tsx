import { useState, useEffect } from "react";
import { Plus, GripVertical, Building2, Calendar, Users, DollarSign, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSectors } from "@/hooks/useSectors";
import { cn } from "@/lib/utils";

type DealStage = "sourcing" | "initial_review" | "due_diligence" | "ic_scheduled" | "ic_complete" | "approved" | "closed" | "passed";
type SectorType = "technology" | "healthcare" | "financial_services" | "consumer_retail" | "industrials" | "energy" | "real_estate" | "media_entertainment" | "infrastructure";
type ICStage = "ic1" | "ic2" | "ic3" | "ic4" | "ic_final" | "approved" | "rejected";

interface Deal {
  id: string;
  deal_name: string;
  company_name: string;
  sector: SectorType;
  stage: DealStage;
  ic_stage?: ICStage | null;
  deal_size: string | null;
  description: string | null;
  lead_partner: string | null;
  ic_date: string | null;
  created_at: string;
}

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "sourcing", label: "Sourcing", color: "bg-slate-500" },
  { id: "initial_review", label: "Initial Review", color: "bg-blue-500" },
  { id: "due_diligence", label: "Due Diligence", color: "bg-purple-500" },
  { id: "ic_scheduled", label: "IC Scheduled", color: "bg-amber-500" },
  { id: "ic_complete", label: "IC Complete", color: "bg-cyan-500" },
  { id: "approved", label: "Approved", color: "bg-emerald-500" },
  { id: "closed", label: "Closed", color: "bg-green-600" },
  { id: "passed", label: "Passed", color: "bg-red-500" },
];

const IC_STAGES: { value: ICStage; label: string; shortLabel: string }[] = [
  { value: "ic1", label: "IC1 - Initial Review", shortLabel: "IC1" },
  { value: "ic2", label: "IC2 - Deep Dive", shortLabel: "IC2" },
  { value: "ic3", label: "IC3 - Due Diligence", shortLabel: "IC3" },
  { value: "ic4", label: "IC4 - Final Terms", shortLabel: "IC4" },
  { value: "ic_final", label: "IC Final - Decision", shortLabel: "Final" },
];

const IC_STAGE_COLORS: Record<string, string> = {
  ic1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ic2: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ic3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ic4: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ic_final: "bg-green-500/20 text-green-400 border-green-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function DealKanban() {
  const { user } = useAuth();
  const { activeSectors } = useSectors();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    deal_name: "",
    company_name: "",
    sector: "technology" as SectorType,
    deal_size: "",
    description: "",
    lead_partner: "",
    ic_stage: "ic1" as ICStage,
  });

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: DealStage) => {
    if (!draggedDeal || draggedDeal.stage === stage) {
      setDraggedDeal(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("deals")
        .update({ stage })
        .eq("id", draggedDeal.id);

      if (error) throw error;

      setDeals(prev => prev.map(d => 
        d.id === draggedDeal.id ? { ...d, stage } : d
      ));
      toast.success(`Moved "${draggedDeal.deal_name}" to ${STAGES.find(s => s.id === stage)?.label}`);
    } catch (error) {
      console.error("Error updating deal:", error);
      toast.error("Failed to update deal");
    } finally {
      setDraggedDeal(null);
    }
  };

  const handleCreateDeal = async () => {
    if (!newDeal.deal_name || !newDeal.company_name) {
      toast.error("Deal name and company name are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("deals")
        .insert({
          ...newDeal,
          stage: "sourcing" as DealStage,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setDeals(prev => [data, ...prev]);
      setIsCreateOpen(false);
      setNewDeal({
        deal_name: "",
        company_name: "",
        sector: "technology",
        deal_size: "",
        description: "",
        lead_partner: "",
        ic_stage: "ic1",
      });
      toast.success("Deal created successfully");
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create deal");
    }
  };

  const getDealsByStage = (stage: DealStage) => 
    deals.filter(d => d.stage === stage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between opacity-0 animate-fade-in">
        <div>
          <h2 className="text-2xl font-semibold">Deal Pipeline</h2>
          <p className="text-muted-foreground mt-1">
            Track and manage deals through the investment process
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Deal Name</label>
                <Input
                  value={newDeal.deal_name}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, deal_name: e.target.value }))}
                  placeholder="Project Alpha"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={newDeal.company_name}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sector</label>
                  <Select
                    value={newDeal.sector}
                    onValueChange={(v) => setNewDeal(prev => ({ ...prev, sector: v as SectorType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSectors.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">IC Stage</label>
                  <Select
                    value={newDeal.ic_stage}
                    onValueChange={(v) => setNewDeal(prev => ({ ...prev, ic_stage: v as ICStage }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IC_STAGES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Deal Size</label>
                  <Input
                    value={newDeal.deal_size}
                    onChange={(e) => setNewDeal(prev => ({ ...prev, deal_size: e.target.value }))}
                    placeholder="$50M"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Lead Partner</label>
                <Input
                  value={newDeal.lead_partner}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, lead_partner: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the opportunity..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateDeal} className="w-full">Create Deal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex gap-4 min-w-max pb-4">
          {STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 shrink-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                      <h3 className="font-medium text-sm">{stage.label}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stageDeals.length}
                    </Badge>
                  </div>

                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="space-y-2 pr-2">
                      {stageDeals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                          Drop deals here
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            draggable
                            onDragStart={() => handleDragStart(deal)}
                            className={cn(
                              "bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
                              draggedDeal?.id === deal.id && "opacity-50 scale-95"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{deal.deal_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{deal.company_name}</p>
                                
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <Badge variant="outline" className="text-[10px] capitalize">
                                    {deal.sector.replace("_", " ")}
                                  </Badge>
                                  {deal.ic_stage && (
                                    <Badge className={cn("text-[10px] border", IC_STAGE_COLORS[deal.ic_stage] || "")}>
                                      {IC_STAGES.find(s => s.value === deal.ic_stage)?.shortLabel || deal.ic_stage.toUpperCase()}
                                    </Badge>
                                  )}
                                  {deal.deal_size && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                                      {deal.deal_size}
                                    </Badge>
                                  )}
                                </div>

                                {deal.lead_partner && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    {deal.lead_partner}
                                  </div>
                                )}

                                {deal.ic_date && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    IC: {new Date(deal.ic_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
