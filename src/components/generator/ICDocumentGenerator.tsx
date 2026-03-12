import { useState } from "react";
import {
  FileText, Plus, Sparkles, Loader2, Trash2, Eye, Calendar, Building2,
  DollarSign, TrendingUp, Users, Shield, BarChart3, Target, Briefcase,
  AlertTriangle, ArrowRight, Layers, CheckCircle2, Globe, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useICDrafts } from "@/hooks/useICDrafts";
import { useSectors } from "@/hooks/useSectors";
import { DocumentExport } from "@/components/export/DocumentExport";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-primary/20 text-primary",
  review: "bg-warning/20 text-warning",
  final: "bg-success/20 text-success",
  presented: "bg-info/20 text-info",
};

const DEAL_TYPES = [
  { value: "lbo", label: "Leveraged Buyout (LBO)" },
  { value: "growth_equity", label: "Growth Equity" },
  { value: "platform", label: "Platform Build-Up" },
  { value: "add_on", label: "Add-On Acquisition" },
  { value: "recap", label: "Recapitalization" },
  { value: "carve_out", label: "Corporate Carve-Out" },
  { value: "pipe", label: "PIPE / Structured" },
  { value: "co_invest", label: "Co-Investment" },
];

const IC_STAGES = [
  { value: "screening", label: "Screening" },
  { value: "ic1", label: "IC1 - Initial Review" },
  { value: "ic2", label: "IC2 - Deep Dive" },
  { value: "ic3", label: "IC3 - Due Diligence Review" },
  { value: "ic4", label: "IC4 - Final Terms" },
  { value: "ic_final", label: "IC Final - Decision" },
];

export function ICDocumentGenerator() {
  const { drafts, isLoading, isGenerating, createDraft, updateDraft, deleteDraft, generateDocument } = useICDrafts();
  const { activeSectors } = useSectors();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [docSectorFilter, setDocSectorFilter] = useState("all");

  const selectedDraft = drafts.find(d => d.id === selectedDraftId);

  const handleCreateDraft = async () => {
    const newDraft = await createDraft({ deal_name: "New Deal", sector: "technology" });
    if (newDraft) setSelectedDraftId(newDraft.id);
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!selectedDraftId) return;
    updateDraft(selectedDraftId, { [field]: value });
  };

  const handleGenerate = async () => {
    if (!selectedDraftId) return;
    await generateDocument(selectedDraftId);
    setShowPreview(true);
  };

  const getSectorDisplayName = (sectorName: string) => {
    const sector = activeSectors.find(s => s.name === sectorName);
    return sector?.display_name || sectorName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">IC Memo Builder</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Build comprehensive investment memoranda for PE deal presentations
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            {drafts.length} memo{drafts.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={docStatusFilter} onValueChange={setDocStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="presented">Presented</SelectItem>
          </SelectContent>
        </Select>
        <Select value={docSectorFilter} onValueChange={setDocSectorFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="financial_services">Fin. Services</SelectItem>
            <SelectItem value="industrials">Industrials</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {/* Drafts List */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">IC Memo Drafts</h3>
              <Button variant="ghost" size="icon" onClick={handleCreateDraft} className="h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No IC memos yet</p>
                <Button variant="link" size="sm" onClick={handleCreateDraft}>
                  Create your first IC memo
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-2">
                  {drafts.map((draft) => (
                    <button
                      key={draft.id}
                      onClick={() => { setSelectedDraftId(draft.id); setShowPreview(false); }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        selectedDraftId === draft.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{draft.deal_name}</p>
                          <p className="text-xs text-muted-foreground">{getSectorDisplayName(draft.sector)}</p>
                        </div>
                        <Badge className={cn("text-[10px] shrink-0", STATUS_COLORS[draft.status])}>
                          {draft.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Sample Memo Templates */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">TEMPLATES</p>
              <div className="space-y-1">
                {["LBO Memo", "Growth Equity Memo", "Add-On Acquisition", "Recapitalization"].map((t) => (
                  <button key={t} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="lg:col-span-9">
          {!selectedDraft ? (
            <div className="glass rounded-xl p-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-primary/60" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">Build Your IC Memo</h3>
              <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto leading-relaxed">
                Create a comprehensive PE investment memorandum covering deal economics, management assessment,
                value creation strategy, and risk analysis
              </p>
              <Button variant="glow" onClick={handleCreateDraft}>
                <Plus className="w-4 h-4 mr-2" />
                New IC Memo
              </Button>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{selectedDraft.deal_name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Last updated {new Date(selectedDraft.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} &middot; {getSectorDisplayName(selectedDraft.sector)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "Edit" : "Preview"}
                  </Button>
                  {showPreview && selectedDraft.generated_document && (
                    <DocumentExport documentContent={selectedDraft.generated_document} documentTitle={selectedDraft.deal_name} />
                  )}
                  <Button variant="glow" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate IC Memo
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { deleteDraft(selectedDraft.id); setSelectedDraftId(null); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {showPreview && selectedDraft.generated_document ? (
                <ScrollArea className="h-[600px]">
                  <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{selectedDraft.generated_document}</div>
                  </div>
                </ScrollArea>
              ) : (
                <Tabs defaultValue="deal_overview" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 overflow-x-auto flex-nowrap">
                    {[
                      { value: "deal_overview", label: "Deal Overview", icon: Target },
                      { value: "transaction", label: "Transaction", icon: DollarSign },
                      { value: "company", label: "Company & Market", icon: Building2 },
                      { value: "management", label: "Management", icon: Users },
                      { value: "thesis", label: "Investment Thesis", icon: TrendingUp },
                      { value: "financials", label: "Financials & Returns", icon: BarChart3 },
                      { value: "value_creation", label: "Value Creation", icon: Layers },
                      { value: "risks", label: "Risks & Mitigants", icon: AlertTriangle },
                      { value: "diligence", label: "Due Diligence", icon: Shield },
                      { value: "notes", label: "Raw Notes", icon: FileText },
                    ].map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary whitespace-nowrap gap-1.5 text-xs">
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <ScrollArea className="h-[520px]">
                    <div className="p-6 space-y-5">
                      {/* Deal Overview Tab */}
                      <TabsContent value="deal_overview" className="m-0 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Project Name / Deal Name</label>
                            <Input value={selectedDraft.deal_name} onChange={(e) => handleFieldChange("deal_name", e.target.value)} placeholder="Project Atlas" />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Target Company</label>
                            <Input value={selectedDraft.company_overview?.split('\n')[0] || ""} onChange={(e) => handleFieldChange("company_overview", e.target.value)} placeholder="MedDevice Holdings, Inc." />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Sector</label>
                            <Select value={selectedDraft.sector} onValueChange={(v) => handleFieldChange("sector", v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {activeSectors.map((s) => (<SelectItem key={s.id} value={s.name}>{s.display_name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Deal Type</label>
                            <Select onValueChange={(v) => handleFieldChange("deal_terms", v)}>
                              <SelectTrigger><SelectValue placeholder="Select deal type" /></SelectTrigger>
                              <SelectContent>
                                {DEAL_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">IC Stage</label>
                            <Select onValueChange={(v) => handleFieldChange("ic_date", v)}>
                              <SelectTrigger><SelectValue placeholder="Select IC stage" /></SelectTrigger>
                              <SelectContent>
                                {IC_STAGES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Executive Summary</label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Concise overview of the opportunity, why now, and key investment merits
                          </p>
                          <Textarea
                            value={selectedDraft.company_overview || ""}
                            onChange={(e) => handleFieldChange("company_overview", e.target.value)}
                            placeholder="MedDevice Holdings is a leading manufacturer of single-use surgical instruments serving 2,500+ hospitals across North America. The company generates $85M in revenue with 28% EBITDA margins and has grown organically at 12% CAGR over the last 5 years.

We recommend acquiring 100% of the equity for $425M (12.5x LTM EBITDA) funded through a combination of $170M equity and $255M senior secured debt (3.0x leverage).

Key investment merits: (1) Essential, non-discretionary products with 95% recurring revenue, (2) Market leader in niche with significant barriers to entry, (3) Clear path to 300bps margin expansion through operational improvements, (4) Platform for add-on acquisitions in a $12B fragmented market."
                            rows={10}
                          />
                        </div>
                      </TabsContent>

                      {/* Transaction Tab */}
                      <TabsContent value="transaction" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-primary" />
                            Transaction Structure & Sources/Uses
                          </label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Enterprise value, equity check, leverage, sources & uses, and deal structure
                          </p>
                          <Textarea
                            value={selectedDraft.deal_terms || ""}
                            onChange={(e) => handleFieldChange("deal_terms", e.target.value)}
                            placeholder="TRANSACTION SUMMARY:
Enterprise Value: $425M
LTM EBITDA: $34M
EV/EBITDA Multiple: 12.5x
Equity Check: $170M (40%)

SOURCES:
- Sponsor Equity: $170M
- Term Loan B: $200M (L+450, 7-year)
- Revolving Credit Facility: $30M (undrawn at close)
- Mezzanine/Sub Debt: $55M

USES:
- Purchase Price: $380M
- Refinance Existing Debt: $25M
- Transaction Fees & Expenses: $12M
- Working Capital Adjustment: $8M

LEVERAGE AT CLOSE:
- Senior Debt/EBITDA: 5.9x
- Total Debt/EBITDA: 7.5x
- Interest Coverage: 2.8x

MANAGEMENT ROLLOVER:
- CEO rolling 15% of proceeds (~$12M)
- CFO and COO rolling 10% each
- Management option pool: 8% fully diluted"
                            rows={18}
                          />
                        </div>
                      </TabsContent>

                      {/* Company & Market Tab */}
                      <TabsContent value="company" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Company Overview & History</label>
                          <Textarea
                            value={selectedDraft.firm_summary || ""}
                            onChange={(e) => handleFieldChange("firm_summary", e.target.value)}
                            placeholder="COMPANY OVERVIEW:
Founded: 1998 in Minneapolis, MN
Employees: 850 (420 manufacturing, 280 sales/distribution, 150 corporate)
Headquarters: Minneapolis, MN with manufacturing in MN and TX

BUSINESS DESCRIPTION:
MedDevice Holdings is a leading designer, manufacturer, and distributor of single-use surgical instruments and medical devices. The company serves over 2,500 acute care hospitals, ambulatory surgery centers, and specialty clinics across North America through a direct salesforce of 120 representatives and 15 distribution partnerships.

KEY MILESTONES:
- 1998: Founded by Dr. James Chen and Robert Mills
- 2005: Launched proprietary sterile packaging technology (3 patents)
- 2010: Acquired by Founder PE Partners (Fund III) at $95M EV
- 2014: Texas manufacturing facility opened, capacity doubled
- 2018: Reached $50M revenue milestone
- 2022: Entered ambulatory surgery center market
- 2025: Revenue reached $85M, 28% EBITDA margin"
                            rows={14}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Market Analysis & Competitive Landscape</label>
                          <Textarea
                            value={selectedDraft.market_analysis || ""}
                            onChange={(e) => handleFieldChange("market_analysis", e.target.value)}
                            placeholder="MARKET SIZE:
- Total Addressable Market (TAM): $12B US surgical instruments market
- Serviceable Addressable Market (SAM): $4.2B single-use segment
- SAM CAGR: 8.5% (2023-2028), driven by infection control and cost efficiency
- Company Market Share: ~2% TAM, ~6% single-use segment

COMPETITIVE LANDSCAPE:
| Competitor       | Revenue  | Market Share | Positioning           |
|-----------------|----------|--------------|----------------------|
| Medline          | $19.4B   | 25%          | Full-line distributor |
| Cardinal Health  | $18.5B   | 22%          | Integrated supply     |
| Teleflex         | $2.8B    | 8%           | Specialty devices     |
| MedDevice (Ours) | $85M     | 2%           | Niche single-use      |

KEY COMPETITIVE ADVANTAGES:
1. Proprietary sterile packaging tech (3 patents, 2 pending)
2. 98.7% on-time delivery rate (industry avg: 94%)
3. Direct salesforce relationships with 300+ hospital purchasing directors
4. FDA 510(k) clearances on 45+ products (3-5 year competitive moat)"
                            rows={14}
                          />
                        </div>
                      </TabsContent>

                      {/* Management Tab */}
                      <TabsContent value="management" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Management Team Assessment
                          </label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Key executives, track record, retention risk, and incentive alignment
                          </p>
                          <Textarea
                            value={selectedDraft.management_summary || ""}
                            onChange={(e) => handleFieldChange("management_summary", e.target.value)}
                            placeholder="EXECUTIVE TEAM:

CEO - Sarah Mitchell (Age 52, 6 years in role)
- Previously SVP Operations at Stryker (12 years)
- Led 3 successful integrations of acquired businesses
- MBA Harvard Business School, BS Engineering MIT
- ASSESSMENT: Strong operational leader. Built current team. Key person risk: HIGH
- Retention: Rolling 15% of proceeds, 4-year vest on new equity

CFO - David Park (Age 45, 3 years in role)
- Previously VP Finance at Teleflex
- Implemented ERP system, improved reporting significantly
- CPA, MBA Wharton
- ASSESSMENT: Capable but untested through a PE hold. Consider supplementing with VP FP&A
- Retention: Rolling 10%, standard employment agreement

VP Sales - Maria Rodriguez (Age 48, 8 years in role)
- Built direct salesforce from 40 to 120 reps
- Drove ASC market entry, added $15M revenue in 3 years
- Deepest customer relationships in the organization
- ASSESSMENT: Critical to revenue growth thesis. KEY PERSON.
- Retention: New 3-year employment agreement with non-compete

MANAGEMENT GAPS IDENTIFIED:
1. No dedicated VP of M&A/Corporate Development (critical for add-on strategy)
2. CTO role undefined - R&D reports to VP Engineering (part-time)
3. Supply chain leadership thin - consider external hire post-close

BOARD COMPOSITION (PROPOSED):
- 2 sponsor seats (Partner + Principal)
- CEO seat
- 2 independent directors (targeting healthcare + operations backgrounds)"
                            rows={18}
                          />
                        </div>
                      </TabsContent>

                      {/* Investment Thesis Tab */}
                      <TabsContent value="thesis" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Investment Thesis & Key Merits
                          </label>
                          <Textarea
                            value={selectedDraft.investment_thesis || ""}
                            onChange={(e) => handleFieldChange("investment_thesis", e.target.value)}
                            placeholder="CORE INVESTMENT THESIS:
MedDevice Holdings represents an opportunity to acquire a market-leading, high-margin medical device company at an attractive entry multiple and create significant value through operational improvements, strategic add-on acquisitions, and organic market expansion.

KEY INVESTMENT MERITS:

1. ESSENTIAL, RECURRING REVENUE BASE
   - 95% of revenue from contracted hospital purchasing agreements (2-3 year terms)
   - 97% customer retention rate over last 5 years
   - Non-discretionary surgical products - volumes driven by procedure volumes, not capital budgets
   - COVID demonstrated resilience: revenue declined only 8% in 2020 vs. 25%+ for elective-dependent peers

2. MARKET LEADER IN ATTRACTIVE NICHE
   - #1 independent player in single-use surgical instruments
   - $4.2B SAM growing 8.5% annually driven by infection control regulations
   - Fragmented market with 200+ small manufacturers - ideal for consolidation
   - Regulatory barriers (FDA 510(k), ISO 13485) create 3-5 year competitive moat

3. SIGNIFICANT MARGIN EXPANSION OPPORTUNITY
   - Current EBITDA margins: 28% vs. best-in-class peers at 35%+
   - Identified $15M+ of cost savings through procurement, manufacturing optimization, and SG&A rationalization
   - Path to 33-35% margins within 3 years without revenue growth
   - Every 100bps of margin = ~$1M EBITDA = ~$12M enterprise value at exit multiple

4. ACCRETIVE ADD-ON ACQUISITION STRATEGY
   - Identified pipeline of 15+ acquisition targets at 6-8x EBITDA
   - 2-3 acquisitions per year, $10-30M each
   - Target $50M+ in acquired revenue over hold period
   - Historical add-on multiple arbitrage: buy at 7x, value at 12x+ in platform

5. EXPERIENCED MANAGEMENT TEAM
   - CEO Sarah Mitchell: 18 years in medical devices, proven operator
   - Team has executed 2 prior acquisitions successfully
   - Management rolling significant equity, aligned with sponsor

EXIT THESIS:
- Primary: Sale to strategic acquirer (Medline, Cardinal, Teleflex) at 14-16x EBITDA
- Secondary: Sale to larger PE sponsor (mega-fund healthcare platform)
- Timeline: 4-5 year hold period
- Target returns: 22-28% gross IRR, 2.5-3.2x MOIC"
                            rows={22}
                          />
                        </div>
                      </TabsContent>

                      {/* Financials & Returns Tab */}
                      <TabsContent value="financials" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Historical & Projected Financials
                          </label>
                          <Textarea
                            value={selectedDraft.financial_snapshot || ""}
                            onChange={(e) => handleFieldChange("financial_snapshot", e.target.value)}
                            placeholder="HISTORICAL FINANCIALS ($M):
                    FY2022    FY2023    FY2024    FY2025E   FY2026P
Revenue             $62.0     $71.3     $78.5     $85.0     $95.0
  Growth %          14.2%     15.0%     10.1%      8.3%     11.8%
COGS               ($38.4)   ($43.5)   ($47.1)   ($50.2)   ($54.2)
  Gross Profit      $23.6     $27.8     $31.4     $34.8     $40.8
  Gross Margin      38.1%     39.0%     40.0%     40.9%     42.9%
SG&A               ($9.3)    ($10.7)   ($11.0)   ($10.9)   ($11.4)
EBITDA              $14.3     $17.1     $20.4     $23.8     $29.4
  EBITDA Margin     23.1%     24.0%     26.0%     28.0%     30.9%
Capex               ($2.5)    ($3.2)    ($3.5)    ($3.8)    ($4.3)
  % Revenue         4.0%      4.5%      4.5%      4.5%      4.5%
FCF                 $11.8     $13.9     $16.9     $20.0     $25.1
  FCF Margin        19.0%     19.5%     21.5%     23.5%     26.4%

KEY UNIT ECONOMICS:
- Revenue per rep: $708K (target: $850K by Year 3)
- Customer acquisition cost: $45K
- Customer lifetime value: $520K
- LTV/CAC ratio: 11.6x
- Average contract value: $34K/year
- Net revenue retention: 107%

RETURNS ANALYSIS (BASE CASE):
                    Entry     Year 1    Year 2    Year 3    Year 4    Year 5
EBITDA              $34.0     $38.5     $45.2     $53.8     $62.1     $70.5
Net Debt            $255.0    $230.0    $198.0    $158.0    $112.0    $65.0
Exit Multiple                                                        14.0x
Enterprise Value                                                     $987.0
Equity Value                                                         $922.0
MOIC                                                                 2.8x
Gross IRR                                                            22.4%

SENSITIVITY TABLE (MOIC):
Entry Multiple:     11.0x    12.0x    12.5x    13.0x    14.0x
Exit at 12.0x       2.3x     2.0x     1.9x     1.8x     1.6x
Exit at 13.0x       2.7x     2.4x     2.3x     2.2x     2.0x
Exit at 14.0x       3.1x     2.8x     2.7x     2.6x     2.4x
Exit at 15.0x       3.5x     3.2x     3.1x     3.0x     2.8x
Exit at 16.0x       3.9x     3.6x     3.5x     3.4x     3.2x"
                            rows={22}
                          />
                        </div>
                      </TabsContent>

                      {/* Value Creation Tab */}
                      <TabsContent value="value_creation" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            Value Creation Plan
                          </label>
                          <p className="text-xs text-muted-foreground mb-2">
                            100-day plan, operational initiatives, organic growth, and M&A strategy
                          </p>
                          <Textarea
                            value={selectedDraft.product_offering || ""}
                            onChange={(e) => handleFieldChange("product_offering", e.target.value)}
                            placeholder="VALUE CREATION BRIDGE ($M EBITDA):
Entry EBITDA: $34M → Exit EBITDA: $70M+ (Target)

1. ORGANIC REVENUE GROWTH (+$15M EBITDA)
   - Expand salesforce from 120 to 180 reps (+$25M revenue)
   - Launch 8 new SKUs from R&D pipeline ($5M each in Year 2-3)
   - Penetrate ambulatory surgery centers (200 new accounts)
   - Price optimization: 2-3% annual increases (below inflation)

2. MARGIN EXPANSION (+$12M EBITDA)
   - Procurement savings: Consolidate 40+ raw material suppliers to 15 ($4M)
   - Manufacturing efficiency: Lean implementation at TX facility ($3M)
   - SG&A rationalization: Shared services, eliminate redundancy ($2M)
   - Automation: Invest $5M capex for $3M annual labor savings

3. ADD-ON ACQUISITIONS (+$15M EBITDA)
   - Year 1: Acquire regional player in Southeast ($15M EV, $2.5M EBITDA)
   - Year 2: Acquire complementary product line ($25M EV, $4M EBITDA)
   - Year 3: Acquire specialty manufacturer ($30M EV, $5M EBITDA)
   - Synergies: $3.5M from integration (cross-selling, procurement, SG&A)

4. MULTIPLE EXPANSION
   - Entry: 12.5x (private, single-product focus)
   - Exit target: 14-16x (larger, diversified, higher growth platform)
   - Drivers: Scale, recurring revenue profile, demonstrated growth

100-DAY PLAN:
Day 1-30:   Management alignment, incentive plan, board formation
Day 30-60:  Procurement RFP process, ERP assessment, sales territory review
Day 60-90:  Launch lean manufacturing pilot, begin add-on target outreach
Day 90-100: First board meeting, approve Year 1 operating plan and M&A pipeline"
                            rows={20}
                          />
                        </div>
                      </TabsContent>

                      {/* Risks & Mitigants Tab */}
                      <TabsContent value="risks" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Key Risks & Mitigants
                          </label>
                          <Textarea
                            value={selectedDraft.key_risks || ""}
                            onChange={(e) => handleFieldChange("key_risks", e.target.value)}
                            placeholder="RISK MATRIX:

1. CUSTOMER CONCENTRATION (SEVERITY: MEDIUM, LIKELIHOOD: MEDIUM)
   Risk: Top 10 customers = 32% of revenue. Loss of a top-3 customer = $8M+ revenue impact
   Mitigant: 97% retention rate, 2-3 year contracts, high switching costs
   Action: Accelerate mid-market acquisition to diversify base

2. KEY PERSON RISK (SEVERITY: HIGH, LIKELIHOOD: LOW)
   Risk: CEO and VP Sales are critical to customer relationships and operations
   Mitigant: Employment agreements with 2-year non-competes, significant equity rollover
   Action: Build management depth immediately post-close (VP Corp Dev, VP Supply Chain)

3. FDA REGULATORY RISK (SEVERITY: HIGH, LIKELIHOOD: LOW)
   Risk: Product recalls, 510(k) delays on new products, manufacturing compliance
   Mitigant: Perfect FDA inspection history (15 years), dedicated QA team of 12
   Action: Pre-close quality audit, maintain regulatory counsel relationship

4. INTEGRATION RISK (SEVERITY: MEDIUM, LIKELIHOOD: MEDIUM)
   Risk: Add-on acquisitions fail to integrate, culture clash, customer loss
   Mitigant: Experienced CEO, prior integration experience, detailed playbook
   Action: Hire VP Corp Dev, establish integration PMO before first acquisition

5. LEVERAGE RISK (SEVERITY: HIGH, LIKELIHOOD: LOW)
   Risk: 7.5x total leverage at close. Covenant breach if EBITDA declines >15%
   Mitigant: Essential products, recurring revenue, strong FCF conversion (65%+)
   Action: Negotiate covenant-lite structure, maintain $30M undrawn revolver

6. COMPETITIVE THREAT (SEVERITY: MEDIUM, LIKELIHOOD: MEDIUM)
   Risk: Large strategics (Medline, Cardinal) entering single-use niche aggressively
   Mitigant: Patent protection, 3-5 year product development cycle, established relationships
   Action: Accelerate R&D investment, protect IP, deepen customer switching costs"
                            rows={20}
                          />
                        </div>
                      </TabsContent>

                      {/* Due Diligence Tab */}
                      <TabsContent value="diligence" className="m-0 space-y-5">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Due Diligence Status & Findings
                          </label>
                          <Textarea
                            value={selectedDraft.comp_analysis || ""}
                            onChange={(e) => handleFieldChange("comp_analysis", e.target.value)}
                            placeholder="DUE DILIGENCE WORKSTREAMS:

1. FINANCIAL DD (Provider: Deloitte) - STATUS: COMPLETE ✓
   - Quality of earnings confirmed: LTM Adj. EBITDA = $34.2M (vs. mgmt $34.5M)
   - Adjustments: $1.8M one-time COVID costs added back, $0.5M non-recurring legal
   - Working capital: Normalized NWC = $12M, seasonal pattern confirmed
   - FLAG: AR days increased from 42 to 48 - investigate collections process

2. COMMERCIAL DD (Provider: L.E.K. Consulting) - STATUS: IN PROGRESS
   - Market sizing validated: $4.2B SAM confirmed
   - Customer interviews: 15 of 20 completed, overwhelmingly positive
   - Competitive positioning: Confirmed #1 independent player
   - REMAINING: 5 additional customer interviews, competitor pricing analysis

3. LEGAL DD (Provider: Kirkland & Ellis) - STATUS: IN PROGRESS
   - Corporate structure: Clean, no outstanding litigation
   - IP review: 3 patents valid through 2032, 2 pending applications
   - FLAG: Employment agreement for VP Sales missing non-compete
   - REMAINING: Environmental review, insurance adequacy

4. OPERATIONAL DD (Provider: Internal team) - STATUS: PLANNED
   - Manufacturing facility tour scheduled for March 20
   - ERP assessment (SAP vs. Oracle migration)
   - Supply chain audit
   - Headcount and compensation benchmarking

5. INSURANCE & ENVIRONMENTAL DD - STATUS: NOT STARTED
   - Environmental Phase I ordered for both facilities
   - Product liability insurance review pending

ESTIMATED DD COSTS: $2.8M
- Financial DD: $800K
- Commercial DD: $650K
- Legal DD: $750K
- Operational/Other: $600K

IC APPROVAL REQUESTED: $2.8M DD expense authorization"
                            rows={20}
                          />
                        </div>
                      </TabsContent>

                      {/* Raw Notes Tab */}
                      <TabsContent value="notes" className="m-0 space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Raw Notes & Working Materials</label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Paste management meeting notes, call transcripts, data room findings, or any unstructured content.
                            The AI will help organize this into the structured memo sections.
                          </p>
                          <Textarea
                            value={selectedDraft.raw_notes || ""}
                            onChange={(e) => handleFieldChange("raw_notes", e.target.value)}
                            placeholder="Paste management presentation notes, CIM highlights, data room observations, call notes..."
                            rows={15}
                            className="font-mono text-sm"
                          />
                        </div>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
