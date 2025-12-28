import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  Building2,
  Calendar,
  TrendingUp,
  Loader2,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSectors } from "@/hooks/useSectors";
import { Deal } from "@/hooks/useDeals";

const STAGE_COLORS: Record<string, string> = {
  sourcing: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  initial_review: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  deep_dive: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ic_preparation: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ic_review: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  due_diligence: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  closing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed: "bg-green-500/20 text-green-400 border-green-500/30",
  passed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const IC_STAGE_COLORS: Record<string, string> = {
  ic1: "bg-blue-500/20 text-blue-400",
  ic2: "bg-purple-500/20 text-purple-400",
  ic3: "bg-amber-500/20 text-amber-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

interface DealListProps {
  deals: Deal[];
  isLoading: boolean;
  onCreateDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  onViewDeal: (deal: Deal) => void;
  onDeleteDeal: (deal: Deal) => void;
}

export function DealList({ 
  deals, 
  isLoading, 
  onCreateDeal, 
  onEditDeal, 
  onViewDeal, 
  onDeleteDeal 
}: DealListProps) {
  const { activeSectors } = useSectors();
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = 
        deal.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deal.lead_partner?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      const matchesSector = sectorFilter === "all" || deal.sector === sectorFilter;
      const matchesStage = stageFilter === "all" || deal.stage === stageFilter;

      return matchesSearch && matchesSector && matchesStage;
    });
  }, [deals, searchQuery, sectorFilter, stageFilter]);

  const getSectorDisplayName = (sectorName: string) => {
    const sector = activeSectors.find(s => s.name === sectorName);
    return sector?.display_name || sectorName.replace(/_/g, " ");
  };

  const formatStage = (stage: string) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Deal Pipeline
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredDeals.length} {filteredDeals.length === 1 ? "deal" : "deals"} 
            {sectorFilter !== "all" && ` in ${getSectorDisplayName(sectorFilter)}`}
          </p>
        </div>
        <Button onClick={onCreateDeal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {activeSectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.name}>
                  {sector.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="sourcing">Sourcing</SelectItem>
              <SelectItem value="initial_review">Initial Review</SelectItem>
              <SelectItem value="deep_dive">Deep Dive</SelectItem>
              <SelectItem value="ic_preparation">IC Preparation</SelectItem>
              <SelectItem value="ic_review">IC Review</SelectItem>
              <SelectItem value="due_diligence">Due Diligence</SelectItem>
              <SelectItem value="closing">Closing</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery || sectorFilter !== "all" || stageFilter !== "all" 
                ? "No deals match your filters" 
                : "No deals yet"}
            </p>
            {deals.length === 0 && (
              <Button variant="outline" className="mt-4" onClick={onCreateDeal}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first deal
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>IC Stage</TableHead>
                  <TableHead>Deal Size</TableHead>
                  <TableHead>Lead Partner</TableHead>
                  <TableHead>IC Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow 
                    key={deal.id} 
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => onViewDeal(deal)}
                  >
                    <TableCell className="font-medium">{deal.deal_name}</TableCell>
                    <TableCell>{deal.company_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getSectorDisplayName(deal.sector)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs border", STAGE_COLORS[deal.stage] || "")}>
                        {formatStage(deal.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", IC_STAGE_COLORS[deal.ic_stage] || "")}>
                        {deal.ic_stage?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{deal.deal_size || "-"}</TableCell>
                    <TableCell>{deal.lead_partner || "-"}</TableCell>
                    <TableCell>
                      {deal.ic_date ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(deal.ic_date), "MMM d, yyyy")}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDeal(deal); }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditDeal(deal); }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); onDeleteDeal(deal); }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
