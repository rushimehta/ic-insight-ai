import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useDeals, Deal } from "@/hooks/useDeals";
import { DealList } from "./DealList";
import { DealForm } from "./DealForm";

export function CRMDashboard() {
  const { deals, isLoading, deleteDeal, refetch } = useDeals();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

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
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">CRM</h2>
        <p className="text-muted-foreground mt-1">
          Manage deals and track your pipeline with custom attributes
        </p>
      </div>

      <DealList
        deals={deals}
        isLoading={isLoading}
        onCreateDeal={handleCreateDeal}
        onEditDeal={handleEditDeal}
        onViewDeal={handleViewDeal}
        onDeleteDeal={setDealToDelete}
      />

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
