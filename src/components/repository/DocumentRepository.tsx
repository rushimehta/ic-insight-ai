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

// Sample documents with detailed content
const SAMPLE_DOCUMENTS: Document[] = [
  {
    id: "sample-1",
    filename: "TechCorp Acquisition - IC Memo.pdf",
    file_type: "application/pdf",
    file_size: 2456789,
    status: "processed",
    deal_name: "TechCorp Acquisition",
    ic_date: "2024-03-15",
    created_at: "2024-03-10T10:30:00Z",
    sector: "technology",
    content: `INVESTMENT COMMITTEE MEMORANDUM

CONFIDENTIAL

Deal: TechCorp Inc. Acquisition
Date: March 15, 2024
Lead Partner: Sarah Johnson
Deal Team: Michael Chen, Emily Davis, Robert Kim

EXECUTIVE SUMMARY
TechCorp Inc. is a leading provider of enterprise cloud security solutions with $85M ARR and 45% YoY growth. The company serves 500+ enterprise customers across financial services, healthcare, and government sectors.

INVESTMENT THESIS
1. Market Leadership: TechCorp holds #2 position in the $15B cloud security market
2. Strong Unit Economics: 85% gross margins, 120% NRR, CAC payback of 12 months
3. Product Differentiation: Proprietary AI-driven threat detection with 99.7% accuracy
4. Experienced Management: CEO with 20+ years in cybersecurity, previously scaled company to $200M exit

KEY RISKS
- Customer concentration (top 10 customers = 35% of revenue)
- Competition from well-funded incumbents
- Regulatory changes in data privacy

DEAL TERMS
- Enterprise Value: $425M (5x ARR)
- Structure: 80% equity, 20% rollover
- Management incentive pool: 10%

RECOMMENDATION: Proceed to final due diligence`
  },
  {
    id: "sample-2",
    filename: "HealthPlus Series B - Investment Analysis.pdf",
    file_type: "application/pdf",
    file_size: 1876543,
    status: "processed",
    deal_name: "HealthPlus Series B",
    ic_date: "2024-02-20",
    created_at: "2024-02-15T14:20:00Z",
    sector: "healthcare",
    content: `INVESTMENT ANALYSIS: HEALTHPLUS INC.

COMPANY OVERVIEW
HealthPlus is a digital health platform connecting patients with licensed healthcare providers for telemedicine consultations, prescription management, and chronic disease monitoring.

MARKET OPPORTUNITY
- Total Addressable Market: $250B globally
- Serviceable Addressable Market: $45B in North America
- Telemedicine adoption increased 38x post-pandemic and remains elevated

FINANCIAL HIGHLIGHTS
- 2023 Revenue: $42M (110% YoY growth)
- Gross Margin: 72%
- Burn Rate: $2.5M/month
- Runway: 18 months at current burn

COMPETITIVE LANDSCAPE
Direct competitors include Teladoc, MDLive, and Amwell. HealthPlus differentiates through:
- Superior patient experience (4.9/5 app store rating)
- Integration with 200+ insurance plans
- Specialized chronic care programs

DUE DILIGENCE FINDINGS
- Clean legal review
- Technology audit passed with minor recommendations
- Customer references overwhelmingly positive
- Management team has relevant experience

VALUATION
- Proposed: $180M post-money (4.3x revenue)
- Comparable transactions: 3.5x - 6x revenue
- Recommended investment: $25M for 14% ownership`
  },
  {
    id: "sample-3",
    filename: "RetailMax Buyout - Due Diligence Report.pdf",
    file_type: "application/pdf",
    file_size: 3234567,
    status: "processed",
    deal_name: "RetailMax Buyout",
    ic_date: "2024-01-25",
    created_at: "2024-01-18T09:15:00Z",
    sector: "consumer_retail",
    content: `DUE DILIGENCE REPORT
RETAILMAX HOLDINGS LLC

EXECUTIVE SUMMARY
RetailMax operates 245 specialty retail locations across the Midwest and Southeast, focusing on home goods and lifestyle products. The company has demonstrated resilient performance with EBITDA margins of 18%.

FINANCIAL ANALYSIS
Revenue (TTM): $312M
EBITDA (TTM): $56.2M
Net Debt: $85M
Leverage: 1.5x

KEY FINDINGS
1. Real Estate: 60% owned, 40% leased; owned properties valued at $120M
2. Inventory: Well-managed with 4.2x turns annually
3. E-commerce: 22% of sales, growing 30% YoY
4. Brand: Strong regional recognition, NPS of 62

OPERATIONAL IMPROVEMENTS IDENTIFIED
- Supply chain optimization: $8M annual savings potential
- Private label expansion: 400bps margin improvement opportunity
- Digital marketing: $5M incremental revenue opportunity

RISKS
- Macroeconomic sensitivity
- Competition from e-commerce players
- Key person dependency on CEO

RECOMMENDATION
Proceed with management meetings and site visits. Current asking price of $380M (6.8x EBITDA) is at the high end of comparable transactions but justified given real estate value and improvement opportunities.`
  },
  {
    id: "sample-4",
    filename: "GreenEnergy Solar - Term Sheet Analysis.pdf",
    file_type: "application/pdf",
    file_size: 1234567,
    status: "processed",
    deal_name: "GreenEnergy Solar",
    ic_date: "2024-03-01",
    created_at: "2024-02-25T16:45:00Z",
    sector: "energy",
    content: `TERM SHEET ANALYSIS
GREENENERGY SOLAR INVESTMENTS

TRANSACTION OVERVIEW
GreenEnergy is seeking $150M in growth equity to fund expansion of its utility-scale solar development pipeline. The company currently has 2.5GW of projects in development.

MARKET CONTEXT
- Solar installations growing 25% annually in the US
- IRA provisions provide strong tailwinds
- Utility PPAs increasingly competitive with fossil fuels

COMPANY METRICS
- Projects Commissioned: 850MW
- Pipeline: 2.5GW
- Team: 85 employees
- Revenue: $78M (FY23)

TERM SHEET SUMMARY
- Investment: $150M Series C
- Pre-money Valuation: $600M
- Ownership: 20%
- Board Seat: Yes
- Protective Provisions: Standard

COMPARABLE TRANSACTIONS
- Solar developer A: $500M at 8x revenue
- Solar developer B: $750M at 6x revenue
- Solar developer C: $400M at 7.5x revenue

INVESTMENT MERITS
1. Experienced team with 10+ years in solar development
2. Strong project pipeline with high conversion rates
3. Diversified geographic footprint
4. Existing utility relationships

CONCERNS
- Capital intensive business model
- Permitting delays are common
- Interest rate sensitivity

RECOMMENDATION: Approve subject to confirmatory due diligence on pipeline quality`
  },
  {
    id: "sample-5",
    filename: "MediaStream Platform - IC Presentation.pdf",
    file_type: "application/pdf",
    file_size: 4567890,
    status: "processed",
    deal_name: "MediaStream Platform",
    ic_date: "2023-12-15",
    created_at: "2023-12-10T11:00:00Z",
    sector: "media_entertainment",
    content: `INVESTMENT COMMITTEE PRESENTATION
MEDIASTREAM PLATFORM INC.

COMPANY OVERVIEW
MediaStream is a B2B SaaS platform enabling media companies to manage, distribute, and monetize video content across multiple channels. The platform processes over 50 million video views daily.

KEY METRICS
- ARR: $32M (growing 65% YoY)
- Customers: 180+ media companies
- Gross Retention: 95%
- Net Retention: 135%

PRODUCT CAPABILITIES
1. Content Management System
2. Multi-platform Distribution
3. Ad Insertion & Monetization
4. Analytics & Reporting
5. Rights Management

COMPETITIVE POSITIONING
MediaStream competes with Brightcove, Vimeo Enterprise, and in-house solutions. Key differentiators:
- Superior transcoding speed (3x faster)
- Lower cost per stream
- Better analytics granularity

FINANCIAL PROJECTIONS
2024E Revenue: $52M
2025E Revenue: $78M
2026E Revenue: $115M

INVESTMENT TERMS
- Seeking: $40M Series B
- Valuation: $200M pre-money
- Use of Funds: Sales expansion, product development

RECOMMENDATION
Strong buy. MediaStream addresses a clear pain point with a differentiated solution in a growing market.`
  },
  {
    id: "sample-6",
    filename: "FinServ Analytics - Quarterly Review.pdf",
    file_type: "application/pdf",
    file_size: 987654,
    status: "processed",
    deal_name: "FinServ Analytics",
    ic_date: "2024-01-10",
    created_at: "2024-01-05T08:30:00Z",
    sector: "financial_services",
    content: `PORTFOLIO COMPANY QUARTERLY REVIEW
FINSERV ANALYTICS INC.
Q4 2023

PERFORMANCE SUMMARY
FinServ Analytics exceeded expectations in Q4, with revenue of $18.2M (15% above plan) and EBITDA of $4.1M.

KEY ACHIEVEMENTS
- Closed 12 new enterprise customers (target: 8)
- Launched AI-powered fraud detection module
- Expanded to UK market with first 3 customers
- Reduced customer churn to 3% (from 5%)

FINANCIAL RESULTS
Q4 Revenue: $18.2M (+42% YoY)
Full Year Revenue: $62M (+48% YoY)
Q4 EBITDA: $4.1M (23% margin)
Full Year EBITDA: $12.5M (20% margin)

OPERATIONAL METRICS
- ACV: $285K (up from $220K)
- Sales Cycle: 45 days (down from 60)
- Implementation Time: 30 days (down from 45)

OUTLOOK FOR 2024
- Revenue Target: $95M (+53%)
- New Product: Risk scoring API launching Q2
- Geographic: Germany expansion planned for H2
- Headcount: Growing from 180 to 250

CONCERNS
- Increasing competition from larger players
- Key engineering talent retention
- Data privacy regulations in EU

BOARD DISCUSSION ITEMS
1. Approve 2024 operating budget
2. Discuss Series C timing and terms
3. Review management incentive plan`
  }
];

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

  // Combine real documents with samples
  const documents = useMemo(() => {
    return [...SAMPLE_DOCUMENTS, ...realDocuments];
  }, [realDocuments]);

  const handleViewDocument = async (doc: Document) => {
    setSelectedDocument(doc);
    setIsLoadingContent(true);
    setDocumentContent(null);

    // If it's a sample document, use the embedded content
    if (doc.id.startsWith("sample-")) {
      setDocumentContent(doc.content || "No content available.");
      setIsLoadingContent(false);
      return;
    }

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
