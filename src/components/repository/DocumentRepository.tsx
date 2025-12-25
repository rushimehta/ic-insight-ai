import { useState, useMemo } from "react";
import { FolderOpen, FileText, Calendar, Building2, Search, Filter, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import { useSectors } from "@/hooks/useSectors";
import { format } from "date-fns";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentRepository() {
  const { documents, isLoading: docsLoading } = useDocuments();
  const { activeSectors, isLoading: sectorsLoading } = useSectors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  // Get unique years from documents
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    documents.forEach(doc => {
      const year = doc.created_at ? new Date(doc.created_at).getFullYear() : null;
      if (year) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchQuery || 
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.deal_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const docYear = doc.created_at ? new Date(doc.created_at).getFullYear().toString() : null;
      const matchesYear = selectedYear === "all" || docYear === selectedYear;
      
      const matchesSector = selectedSector === "all" || 
        (doc as any).sector === selectedSector;
      
      return matchesSearch && matchesYear && matchesSector;
    });
  }, [documents, searchQuery, selectedYear, selectedSector]);

  // Group by sector then year
  const groupedDocuments = useMemo(() => {
    const groups: Record<string, Record<string, typeof documents>> = {};
    
    filteredDocuments.forEach(doc => {
      const sector = (doc as any).sector || "uncategorized";
      const year = doc.created_at ? new Date(doc.created_at).getFullYear().toString() : "unknown";
      
      if (!groups[sector]) groups[sector] = {};
      if (!groups[sector][year]) groups[sector][year] = [];
      groups[sector][year].push(doc);
    });
    
    return groups;
  }, [filteredDocuments]);

  const toggleSector = (sector: string) => {
    setExpandedSectors(prev => ({ ...prev, [sector]: !prev[sector] }));
  };

  const getSectorDisplayName = (sectorName: string) => {
    const sector = activeSectors.find(s => s.name === sectorName);
    return sector?.display_name || sectorName.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  };

  const isLoading = docsLoading || sectorsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Document Repository</h2>
            <p className="text-muted-foreground">
              Browse IC documents organized by sector and year
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {activeSectors.map(sector => (
                  <SelectItem key={sector.id} value={sector.name}>
                    {sector.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Repository Tree */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : Object.keys(groupedDocuments).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No documents found</p>
            <p className="text-sm mt-1">Upload documents to populate the repository</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-2">
              {Object.entries(groupedDocuments).sort(([a], [b]) => a.localeCompare(b)).map(([sector, years]) => (
                <Collapsible
                  key={sector}
                  open={expandedSectors[sector] !== false}
                  onOpenChange={() => toggleSector(sector)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors",
                      "bg-secondary/50 hover:bg-secondary"
                    )}>
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <span className="font-medium">{getSectorDisplayName(sector)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {Object.values(years).flat().length} docs
                        </Badge>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        expandedSectors[sector] !== false && "rotate-90"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 mt-2 space-y-2">
                      {Object.entries(years).sort(([a], [b]) => b.localeCompare(a)).map(([year, docs]) => (
                        <div key={year} className="border-l-2 border-border pl-4">
                          <div className="flex items-center gap-2 mb-2 py-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">{year}</span>
                            <Badge variant="outline" className="text-xs">{docs.length}</Badge>
                          </div>
                          <div className="space-y-1">
                            {docs.map(doc => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium truncate max-w-[300px]">
                                      {doc.filename}
                                    </p>
                                    {doc.deal_name && (
                                      <p className="text-xs text-muted-foreground">{doc.deal_name}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatFileSize(doc.file_size)}</span>
                                  <span>•</span>
                                  <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
