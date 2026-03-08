import { useState, useMemo } from "react";
import { FolderOpen, FileText, Calendar, Building2, Search, ChevronRight, Loader2, Eye, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import { useSectors } from "@/hooks/useSectors";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  deal_name?: string | null;
  ic_date?: string | null;
  created_at: string;
  content?: string | null;
  sector?: string | null;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// No more hardcoded sample data - all documents come from the database

export function DocumentRepository() {
  const { documents: realDocuments, isLoading: docsLoading } = useDocuments();
  const { activeSectors, isLoading: sectorsLoading } = useSectors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [expandedDeals, setExpandedDeals] = useState<Record<string, boolean>>({});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const documents = useMemo(() => {
    return realDocuments as Document[];
  }, [realDocuments]);

  const handleViewDocument = async (doc: Document) => {
    setSelectedDocument(doc);
    setIsLoadingContent(true);
    setDocumentContent(null);

    try {
      // First try to get the document content directly
      const { data: docData } = await supabase
        .from("documents")
        .select("content")
        .eq("id", doc.id)
        .single();

      if (docData?.content) {
        setDocumentContent(docData.content);
      } else {
        // If no direct content, try to get from chunks
        const { data: chunks } = await supabase
          .from("document_chunks")
          .select("content, chunk_index")
          .eq("document_id", doc.id)
          .order("chunk_index", { ascending: true });

        if (chunks && chunks.length > 0) {
          setDocumentContent(chunks.map(c => c.content).join("\n\n---\n\n"));
        } else {
          setDocumentContent("No content available for this document.");
        }
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Failed to load document content");
      setDocumentContent("Error loading document content.");
    } finally {
      setIsLoadingContent(false);
    }
  };

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

  // Group by Year > Sector > Deal
  const groupedDocuments = useMemo(() => {
    const groups: Record<string, Record<string, Record<string, typeof documents>>> = {};
    
    filteredDocuments.forEach(doc => {
      const year = doc.created_at ? new Date(doc.created_at).getFullYear().toString() : "unknown";
      const sector = (doc as any).sector || "uncategorized";
      const deal = doc.deal_name || "Uncategorized";
      
      if (!groups[year]) groups[year] = {};
      if (!groups[year][sector]) groups[year][sector] = {};
      if (!groups[year][sector][deal]) groups[year][sector][deal] = [];
      groups[year][sector][deal].push(doc);
    });
    
    return groups;
  }, [filteredDocuments]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleSector = (key: string) => {
    setExpandedSectors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDeal = (key: string) => {
    setExpandedDeals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSectorDisplayName = (sectorName: string) => {
    const sector = activeSectors.find(s => s.name === sectorName);
    return sector?.display_name || sectorName.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  };

  const getTotalDocs = (sectors: Record<string, Record<string, typeof documents>>) => {
    return Object.values(sectors).reduce((total, deals) => 
      total + Object.values(deals).reduce((t, docs) => t + docs.length, 0), 0);
  };

  const getSectorDocs = (deals: Record<string, typeof documents>) => {
    return Object.values(deals).reduce((total, docs) => total + docs.length, 0);
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
              Browse IC documents organized by year, sector, and deal
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
          </div>
        </div>
      </div>

      {/* Repository Tree - Year > Sector > Deal */}
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
              {Object.entries(groupedDocuments).sort(([a], [b]) => b.localeCompare(a)).map(([year, sectors]) => (
                <Collapsible
                  key={year}
                  open={expandedYears[year] !== false}
                  onOpenChange={() => toggleYear(year)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors",
                      "bg-primary/10 hover:bg-primary/20"
                    )}>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-lg">{year}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getTotalDocs(sectors)} docs
                        </Badge>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        expandedYears[year] !== false && "rotate-90"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 mt-2 space-y-2">
                      {Object.entries(sectors).sort(([a], [b]) => a.localeCompare(b)).map(([sector, deals]) => {
                        const sectorKey = `${year}-${sector}`;
                        return (
                          <Collapsible
                            key={sectorKey}
                            open={expandedSectors[sectorKey] !== false}
                            onOpenChange={() => toggleSector(sectorKey)}
                          >
                            <CollapsibleTrigger className="w-full">
                              <div className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                                "bg-secondary/50 hover:bg-secondary"
                              )}>
                                <div className="flex items-center gap-3">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{getSectorDisplayName(sector)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getSectorDocs(deals)} docs
                                  </Badge>
                                </div>
                                <ChevronRight className={cn(
                                  "w-4 h-4 transition-transform",
                                  expandedSectors[sectorKey] !== false && "rotate-90"
                                )} />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-4 mt-2 space-y-2">
                                {Object.entries(deals).sort(([a], [b]) => a.localeCompare(b)).map(([deal, docs]) => {
                                  const dealKey = `${year}-${sector}-${deal}`;
                                  return (
                                    <Collapsible
                                      key={dealKey}
                                      open={expandedDeals[dealKey] !== false}
                                      onOpenChange={() => toggleDeal(dealKey)}
                                    >
                                      <CollapsibleTrigger className="w-full">
                                        <div className={cn(
                                          "flex items-center justify-between p-2 rounded-lg transition-colors",
                                          "border border-border/50 hover:border-border hover:bg-secondary/30"
                                        )}>
                                          <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-primary/70" />
                                            <span className="text-sm font-medium">{deal}</span>
                                            <Badge variant="secondary" className="text-xs">
                                              {docs.length}
                                            </Badge>
                                          </div>
                                          <ChevronRight className={cn(
                                            "w-4 h-4 transition-transform",
                                            expandedDeals[dealKey] !== false && "rotate-90"
                                          )} />
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                                          {docs.map(doc => (
                                            <div
                                              key={doc.id}
                                              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer"
                                              onClick={() => handleViewDocument(doc as Document)}
                                            >
                                              <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <p className="text-sm truncate max-w-[280px]">
                                                  {doc.filename}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>{formatFileSize(doc.file_size)}</span>
                                                <span>•</span>
                                                <span>{format(new Date(doc.created_at), 'MMM d')}</span>
                                                <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedDocument?.filename}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Document metadata */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {selectedDocument?.deal_name && (
                <Badge variant="secondary">{selectedDocument.deal_name}</Badge>
              )}
              {selectedDocument?.sector && (
                <Badge variant="outline">{getSectorDisplayName(selectedDocument.sector)}</Badge>
              )}
              {selectedDocument?.file_size && (
                <span>{formatFileSize(selectedDocument.file_size)}</span>
              )}
              {selectedDocument?.created_at && (
                <span>{format(new Date(selectedDocument.created_at), 'PPP')}</span>
              )}
            </div>
            
            {/* Content */}
            <ScrollArea className="h-[50vh] border rounded-lg p-4 bg-secondary/20">
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-mono text-sm">
                  {documentContent}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
