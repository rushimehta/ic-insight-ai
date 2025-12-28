import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { List, BarChart3 } from "lucide-react";
import { useDeals, Deal } from "@/hooks/useDeals";
import { DealList } from "./DealList";
import { DealForm } from "./DealForm";
import { DealsBySectorView } from "./DealsBySectorView";

export function CRMDashboard() {
  const { deals, isLoading, deleteDeal, refetch } = useDeals();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");

  const handleCreateDeal = () => {
    setSelectedDeal(null);
    setIsFormOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsFormOpen(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsFormOpen(true);
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    try {
      await deleteDeal(dealToDelete.id);
      toast.success("Deal deleted");
      setDealToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete deal");
    }
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setSelectedDeal(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between opacity-0 animate-fade-in">
        <div>
          <h2 className="text-2xl font-semibold">CRM</h2>
          <p className="text-muted-foreground mt-1">
            Manage deals and track your pipeline with custom attributes
          </p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "chart")}>
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Charts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "list" ? (
        <DealList
          deals={deals}
          isLoading={isLoading}
          onCreateDeal={handleCreateDeal}
          onEditDeal={handleEditDeal}
          onViewDeal={handleViewDeal}
          onDeleteDeal={setDealToDelete}
        />
      ) : (
        <DealsBySectorView deals={deals} />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDeal ? "Edit Deal" : "Create Deal"}</DialogTitle>
          </DialogHeader>
          <DealForm
            deal={selectedDeal}
            onSave={handleFormSave}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!dealToDelete} onOpenChange={() => setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{dealToDelete?.deal_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
