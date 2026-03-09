import { useState, useMemo } from "react";
import { FolderOpen, FileText, Calendar, Building2, Search, ChevronRight, Loader2, Eye, Briefcase, Tag, Download, Clock, Users, DollarSign, Target, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// ─── Extremely Detailed Sample IC Documents ────────────────────────────
// These mirror real PE IC materials with comprehensive financial detail

interface SampleDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  deal_name: string;
  ic_date: string;
  created_at: string;
  sector: string;
  content: string;
}

const sampleDocuments: SampleDocument[] = [
  {
    id: "sample-1", filename: "Project Atlas - IC2 Investment Memorandum.pdf",
    file_type: "application/pdf", file_size: 4850000, status: "completed",
    deal_name: "Project Atlas", ic_date: "2026-03-15", created_at: "2026-03-10T10:00:00Z",
    sector: "healthcare",
    content: `CONFIDENTIAL – FOR INTERNAL USE ONLY
═══════════════════════════════════════════════════════════════════════
           PROJECT ATLAS — IC-2 INVESTMENT MEMORANDUM
                    MedDevice Holdings Inc.
                  Prepared for: Investment Committee
                    Date: March 15, 2026
═══════════════════════════════════════════════════════════════════════

I. EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transaction Overview:
• Target: MedDevice Holdings Inc. ("MedDevice" or the "Company")
• Transaction Type: 100% equity acquisition via leveraged buyout
• Enterprise Value: $425M (12.5x LTM Adj. EBITDA of $34M)
• Equity Check: $185M from Fund VII
• Total Leverage at Close: 5.2x (Senior 4.0x / Mezzanine 1.2x)
• Lead Partner: J. Morrison | Deal Team: VP A. Morrison, Assoc. C. Park, Analyst L. Zhang
• Sponsor: Fund VII ($2.4B committed)
• DD Expense Authorization Requested: $2.8M

Investment Thesis:
MedDevice Holdings is the #1 independent manufacturer of single-use surgical instruments
in North America, serving 2,500+ hospitals with 95% recurring revenue. The Company benefits
from significant switching costs (GPO contracts, regulatory revalidation, procurement system
integration), FDA-regulated barriers to entry, and a fragmented competitive landscape
enabling a compelling buy-and-build strategy.

Target Returns (Base Case):
• Gross IRR: 22.4%
• Gross MOIC: 2.8x
• Hold Period: 4-5 years
• Exit Multiple: 14.0x (conservative re-rate from 12.5x entry)

II. COMPANY OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Company Description:
MedDevice Holdings is a Minneapolis-based manufacturer and distributor of single-use
surgical instruments, procedure kits, and related medical supplies. Founded in 1992,
the Company has grown to become the largest independent player in its niche, with
manufacturing facilities in Minneapolis, MN and Austin, TX.

Key Financial Metrics (LTM as of December 2025):
┌─────────────────────────────────┬──────────────┐
│ Revenue                         │ $312M        │
│ Revenue Growth (YoY)            │ 14.2%        │
│ Gross Profit                    │ $156M        │
│ Gross Margin                    │ 50.1%        │
│ Adjusted EBITDA                 │ $34M         │
│ EBITDA Margin                   │ 10.9%        │
│ Adjusted EBITDA (Normalized)    │ $34M         │
│ Net Debt / EBITDA               │ 2.1x (pre-txn)│
│ CapEx (Maintenance)             │ $8.5M        │
│ CapEx (Growth)                  │ $4.2M        │
│ Free Cash Flow                  │ $21.3M       │
│ FCF Conversion                  │ 62.6%        │
│ Working Capital as % Revenue    │ 18.4%        │
│ Customer Count                  │ 2,500+       │
│ Employee Count                  │ 1,850        │
│ Facilities                      │ 2 (Minneapolis, Austin)│
└─────────────────────────────────┴──────────────┘

Revenue Breakdown by Channel:
• Hospital Direct: 42% ($131M) — Multi-year GPO contracts
• Distributor (Medline, Cardinal): 38% ($119M) — National distribution
• ASC / Outpatient: 15% ($47M) — Fastest growing segment (+22% YoY)
• Government / VA: 5% ($15M) — Stable, recurring contracts

Customer Concentration:
• Top 1 customer: 6.0% of revenue (HCA Healthcare)
• Top 5 customers: 22.1% of revenue
• Top 10 customers: 31.8% of revenue
• Top 20 customers: 44.2% of revenue
• Customer retention rate: 97.2% (trailing 5-year average)
• Average customer tenure: 8.3 years
• Contract renewal rate: 99.1%

Management Team:
• CEO: Sarah Mitchell (15 years with Company, previously SVP at Teleflex)
• CFO: David Park (8 years, previously at Hologic / J&J)
• COO: James Rodriguez (12 years, built Austin facility from ground up)
• VP Sales: Karen Liu (6 years, grew ASC channel from $8M to $47M)
• VP R&D: Dr. Michael Chen (10 years, holds 14 patents)

III. MARKET ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Addressable Market: $14.2B (North American single-use surgical market)
Served Addressable Market: $4.8B (core product categories)
Current Market Share: ~6.5% of SAM

Market Growth Drivers:
1. Shift from reusable to single-use (infection control post-COVID)
2. Procedure volume growth (aging population, outpatient migration)
3. Hospital preference for "one-stop" procedure kits
4. Regulatory tightening favoring established, compliant manufacturers

Competitive Landscape:
┌──────────────────────┬────────┬──────────┬──────────────┐
│ Competitor           │ Rev    │ Share    │ EV/EBITDA    │
├──────────────────────┼────────┼──────────┼──────────────┤
│ Teleflex (Public)    │ $2.9B  │ 20%      │ 18.2x        │
│ ICU Medical (Public) │ $1.6B  │ 11%      │ 15.1x        │
│ Medline (Private)    │ $20B+  │ 8%*      │ N/A          │
│ MedDevice (Target)   │ $312M  │ 6.5%     │ 12.5x (entry)│
│ Halyard Health       │ $1.1B  │ 8%       │ 13.8x        │
│ Other                │ -      │ 46.5%    │ -            │
└──────────────────────┴────────┴──────────┴──────────────┘
*Medline share in overlapping categories only

IV. INVESTMENT THESIS & VALUE CREATION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Value Creation Bridge (Base Case - $185M equity to $518M):
1. Organic Revenue Growth:        +$65M equity value (Revenue 8-10% CAGR)
2. EBITDA Margin Expansion:       +$82M equity value (28% → 33% over hold)
3. Add-On Acquisitions (3-5):     +$120M equity value (Buy at 7-9x, integrate)
4. Multiple Expansion:            +$58M equity value (12.5x → 14.0x exit)
5. Debt Paydown:                  +$8M equity value (FCF to deleverage)

Total Equity Value at Exit: ~$518M → 2.8x MOIC / 22.4% Gross IRR

Margin Expansion Levers:
• Procurement optimization: $4.2M (consolidate raw material suppliers)
• Manufacturing efficiency: $3.8M (Austin facility automation)
• SG&A rationalization: $2.1M (eliminate redundant corporate costs)
• Pricing optimization: $2.5M (value-based pricing on procedure kits)
Total: ~$12.6M EBITDA improvement → ~370bps margin expansion

Add-On Acquisition Pipeline:
1. SurgTech Instruments ($42M Rev, 7.2x EBITDA) — Specialty orthopedic kits
2. CleanRite Medical ($28M Rev, 6.8x EBITDA) — Infection prevention products
3. Pacific Surgical Supply ($35M Rev, 8.1x EBITDA) — West Coast distribution
4. MedPro Accessories ($18M Rev, 7.5x EBITDA) — Complementary accessories
5. Identified but not engaged: 12 additional targets at 6-9x multiples

V. FINANCIAL PROJECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5-Year P&L Projection ($ in millions):
┌────────────────┬────────┬────────┬────────┬────────┬────────┐
│                │ Y1     │ Y2     │ Y3     │ Y4     │ Y5     │
├────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Revenue        │ $340   │ $388   │ $442   │ $498   │ $555   │
│ Growth %       │ 9.0%   │ 14.1%  │ 13.9%  │ 12.7%  │ 11.4%  │
│ Gross Profit   │ $176   │ $206   │ $239   │ $274   │ $311   │
│ Gross Margin   │ 51.8%  │ 53.1%  │ 54.1%  │ 55.0%  │ 56.0%  │
│ Adj. EBITDA    │ $41    │ $54    │ $68    │ $82    │ $96    │
│ EBITDA Margin  │ 12.1%  │ 13.9%  │ 15.4%  │ 16.5%  │ 17.3%  │
│ CapEx          │ $14    │ $16    │ $18    │ $20    │ $22    │
│ FCF            │ $27    │ $38    │ $50    │ $62    │ $74    │
│ Debt / EBITDA  │ 4.8x   │ 3.9x   │ 3.1x   │ 2.4x   │ 1.8x   │
└────────────────┴────────┴────────┴────────┴────────┴────────┘

Note: Y2-Y3 revenue step-up includes assumed add-on acquisitions.

VI. RETURNS SENSITIVITY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IRR Sensitivity (Entry Multiple × Exit Multiple):
┌──────────┬────────┬────────┬────────┬────────┬────────┐
│ Entry ↓  │ 11.0x  │ 12.0x  │ 13.0x  │ 14.0x  │ 15.0x  │
│ Exit →   │        │        │        │        │        │
├──────────┼────────┼────────┼────────┼────────┼────────┤
│ 11.0x    │ 29.2%  │ 25.4%  │ 22.1%  │ 19.2%  │ 16.8%  │
│ 12.0x    │ 31.8%  │ 27.6%  │ 24.0%  │ 20.9%  │ 18.2%  │
│ 12.5x    │ 33.0%  │ 28.7%  │ 24.9%  │ 22.4%★│ 19.1%  │
│ 13.0x    │ 34.1%  │ 29.6%  │ 25.8%  │ 22.5%  │ 19.6%  │
│ 14.0x    │ 36.2%  │ 31.4%  │ 27.4%  │ 23.9%  │ 20.8%  │
└──────────┴────────┴────────┴────────┴────────┴────────┘
★ = Base Case (12.5x entry → 14.0x exit → 22.4% IRR)

MOIC Sensitivity (Entry × Exit):
┌──────────┬────────┬────────┬────────┬────────┬────────┐
│ Entry ↓  │ 11.0x  │ 12.0x  │ 13.0x  │ 14.0x  │ 15.0x  │
│ Exit →   │        │        │        │        │        │
├──────────┼────────┼────────┼────────┼────────┼────────┤
│ 11.0x    │ 3.4x   │ 2.9x   │ 2.5x   │ 2.2x   │ 1.9x   │
│ 12.5x    │ 3.9x   │ 3.3x   │ 2.8x★  │ 2.5x   │ 2.2x   │
│ 14.0x    │ 4.4x   │ 3.7x   │ 3.2x   │ 2.8x   │ 2.4x   │
└──────────┴────────┴────────┴────────┴────────┴────────┘

Downside Scenario (Revenue -10%, No Add-Ons):
• IRR: 14.2% | MOIC: 1.8x | Debt fully serviceable
• Interest coverage ratio never drops below 2.1x
• No covenant breach in any downside scenario tested

VII. KEY RISKS & MITIGANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ENTRY MULTIPLE (12.5x) — MODERATE RISK
   Risk: Above historical median for mid-cap medical device (10-12x)
   Mitigant: Public comps at 15-18x; 95% recurring revenue supports premium
   Mitigant: Fragmented market = consolidation platform potential

2. LEVERAGE (5.2x) — MODERATE RISK
   Risk: Higher leverage limits flexibility
   Mitigant: Strong FCF conversion (62%) provides rapid deleveraging
   Mitigant: No capex cliff; maintenance capex well-established

3. ADD-ON EXECUTION — MODERATE RISK
   Risk: Integration delays or overpayment
   Mitigant: CEO has completed 2 successful acquisitions
   Required Action: Develop detailed integration playbook before IC3

4. KEY PERSON (CEO Sarah Mitchell) — LOW-MODERATE RISK
   Risk: CEO departure would impact customer relationships
   Mitigant: Deep management bench (COO, VP Sales both 6+ years)
   Required Action: Employment agreement with 2-year non-compete

5. FDA / REGULATORY — LOW RISK
   Risk: Product recall or manufacturing compliance issue
   Mitigant: Perfect 15-year FDA inspection record; $2M annual quality spend
   Mitigant: ISO 13485 certified across all facilities

VIII. DD STATUS & EXPENSE AUTHORIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DD Expense Budget Breakdown:
┌────────────────────────────────┬───────────┐
│ Financial DD (Deloitte)        │ $800K     │
│ Commercial DD (L.E.K.)         │ $650K     │
│ Legal DD (Kirkland & Ellis)    │ $750K     │
│ Environmental Phase I & II     │ $200K     │
│ Insurance Review               │ $100K     │
│ Management Assessment          │ $150K     │
│ IT / Systems Assessment        │ $100K     │
│ Contingency                    │ $50K      │
├────────────────────────────────┼───────────┤
│ TOTAL DD EXPENSE REQUEST       │ $2,800K   │
└────────────────────────────────┴───────────┘

IX. IC-2 RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The deal team recommends PROCEEDING TO FULL DUE DILIGENCE (IC-3) with
authorization of $2.8M in DD expenses. Key conditions to satisfy before IC-3:

1. Complete Quality of Earnings report (Deloitte)
2. Full commercial DD including customer interviews (L.E.K.)
3. Management compensation benchmarking and employment agreement drafts
4. Detailed M&A integration playbook with timeline and resource plan
5. Environmental Phase I for both manufacturing facilities
6. Updated LBO model with QoE-adjusted EBITDA

Target IC-3 Date: April 15, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIDENTIAL — FUND VII — NOT FOR EXTERNAL DISTRIBUTION`
  },
  {
    id: "sample-2", filename: "Project Delta - IC Final Memo & Decision Package.pdf",
    file_type: "application/pdf", file_size: 6200000, status: "completed",
    deal_name: "Project Delta", ic_date: "2026-03-12", created_at: "2026-03-08T14:00:00Z",
    sector: "financial_services",
    content: `CONFIDENTIAL – FOR INTERNAL USE ONLY
═══════════════════════════════════════════════════════════════════════
          PROJECT DELTA — IC FINAL INVESTMENT MEMORANDUM
                   NexGen Insurance Group
                 Prepared for: Investment Committee
                    Date: March 12, 2026
═══════════════════════════════════════════════════════════════════════

I. EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transaction Overview:
• Target: NexGen Insurance Group ("NexGen" or the "Company")
• Transaction Type: 100% equity acquisition via LBO
• Enterprise Value: $890M (14.1x LTM Adj. EBITDA of $63M)
• Equity Check: $420M from Fund VII
• Total Leverage at Close: 4.5x (Senior 3.5x / Sub Debt 1.0x)
• Lead Partner: M. Williams | Deal Team: VP T. Anderson, Assoc. K. Nguyen
• IC History: IC-1 (Jan 8) → IC-2 (Feb 5) → IC-3 (Feb 28) → IC Final (Mar 12)

Investment Thesis:
NexGen Insurance Group is a leading specialty insurance platform focused on three
high-growth niches: cyber insurance, E&S (Excess & Surplus) lines, and MGA
(Managing General Agent) services. The Company has grown premium volume from
$480M to $1.2B over the past 4 years through a combination of organic growth
and strategic acquisitions.

Target Returns (Base Case):
• Gross IRR: 19.2%
• Gross MOIC: 2.1x
• Hold Period: 5-6 years
• Exit Multiple: 15.0x (strategic premium for scaled platform)

II. COMPANY OVERVIEW & FINANCIAL PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key Financial Metrics (LTM as of December 2025):
┌─────────────────────────────┬──────────────────┐
│ Gross Written Premium       │ $1.2B            │
│ Net Earned Premium          │ $892M            │
│ Total Revenue               │ $1.18B           │
│ Revenue Growth (YoY)        │ 6.3%             │
│ Adjusted EBITDA             │ $63M             │
│ EBITDA Margin               │ 5.3%             │
│ Combined Ratio              │ 94.2%            │
│ Loss Ratio                  │ 62.8%            │
│ Expense Ratio               │ 31.4%            │
│ Net Income                  │ $38M             │
│ ROE                         │ 12.8%            │
│ Employees                   │ 3,200            │
│ Offices                     │ 14 (US & London) │
│ Broker Relationships        │ 8,500+           │
│ Active Policies             │ 145,000          │
└─────────────────────────────┴──────────────────┘

Revenue Breakdown by Segment:
• Cyber Insurance: 35% ($414M GWP) — Fastest growing, 28% YoY
• E&S Lines: 40% ($480M GWP) — Core franchise, stable margins
• MGA Services: 15% ($180M GWP) — Asset-light, fee-based revenue
• Traditional P&C: 10% ($126M GWP) — Legacy book, run-off planned

III. DUE DILIGENCE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Financial DD (Deloitte — Completed):
• Quality of Earnings: Adj. EBITDA confirmed at $63M (no material adjustments)
• Revenue recognized per ASC 944 — compliant, no restatement risk
• Loss reserve adequacy: Reserves at 58th percentile (conservative)
• Investment portfolio: $2.1B AUM, 94% investment-grade fixed income
• Tax: No material exposures identified; $12M NOL carryforward available

Commercial DD (Oliver Wyman — Completed):
• Cyber insurance market growing 25%+ annually through 2030
• NexGen's cyber pricing algorithms ranked top-quartile by accuracy
• E&S market benefiting from standard market hardening cycle
• Management team highly regarded by broker community (NPS: 72)
• Technology platform (proprietary pricing engine) is competitive advantage

Legal DD (Kirkland & Ellis — Completed):
• No material litigation pending
• Regulatory licenses current in all 50 states + D.C. + London
• No enforcement actions or market conduct examinations
• IP portfolio: 8 patents on pricing algorithms, 3 pending
• Employment agreements negotiated for top 15 executives

Actuarial DD (Milliman — Completed):
• Reserve adequacy: Adequate to slightly favorable
• Cyber loss development: Better than industry average
• Catastrophe exposure: Manageable, well-reinsured
• Reinsurance program: Appropriate and competitively priced

IV. UPDATED RETURNS ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5-Year Financial Projections ($ in millions):
┌────────────────┬────────┬────────┬────────┬────────┬────────┐
│                │ Y1     │ Y2     │ Y3     │ Y4     │ Y5     │
├────────────────┼────────┼────────┼────────┼────────┼────────┤
│ GWP            │ $1,332 │ $1,492 │ $1,671 │ $1,855 │ $2,041 │
│ Growth %       │ 11.0%  │ 12.0%  │ 12.0%  │ 11.0%  │ 10.0%  │
│ Revenue        │ $1,305 │ $1,462 │ $1,637 │ $1,818 │ $2,000 │
│ Combined Ratio │ 93.5%  │ 92.8%  │ 92.2%  │ 91.8%  │ 91.5%  │
│ Adj. EBITDA    │ $72    │ $85    │ $102   │ $120   │ $138   │
│ EBITDA Margin  │ 5.5%   │ 5.8%   │ 6.2%   │ 6.6%   │ 6.9%   │
│ Debt / EBITDA  │ 4.2x   │ 3.5x   │ 2.9x   │ 2.3x   │ 1.8x   │
│ FCF            │ $42    │ $55    │ $68    │ $82    │ $95    │
└────────────────┴────────┴────────┴────────┴────────┴────────┘

V. FINAL DEAL TERMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Purchase Price: $890M EV (14.1x LTM EBITDA)
Sources:
• Fund VII Equity: $420M (47.2%)
• Senior Secured Term Loan B: $311M (35.0%) — S+425, 7-year
• Senior Unsecured Notes: $89M (10.0%) — 8.5% fixed, 8-year
• Rollover Equity (Management): $70M (7.9%)

Management Incentive Plan:
• CEO: 3.0% fully diluted equity pool
• Senior Team (7 execs): 4.5% fully diluted equity pool
• Performance Vesting: 60% time-based (4 years), 40% return-based (>2.5x MOIC)
• Good Leaver / Bad Leaver provisions per standard Fund VII template

VI. IC FINAL RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The deal team recommends APPROVAL of the investment in NexGen Insurance Group.

All conditions from prior IC stages have been satisfied:
✅ Quality of Earnings confirmed ($63M adj. EBITDA)
✅ Actuarial review — reserves adequate
✅ Management employment agreements executed
✅ Regulatory approvals obtained (NYDFS, state insurance commissioners)
✅ Reinsurance program renewed on favorable terms
✅ Technology platform DD — proprietary advantage confirmed
✅ Customer reference calls completed (25/25 positive)

Closing Timeline:
• Signing: March 15, 2026
• Regulatory Approvals: 45-60 days
• Expected Close: May 15, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIDENTIAL — FUND VII — NOT FOR EXTERNAL DISTRIBUTION`
  },
  {
    id: "sample-3", filename: "Project Beacon - IC1 Teaser & Initial Screening.pdf",
    file_type: "application/pdf", file_size: 3200000, status: "completed",
    deal_name: "Project Beacon", ic_date: "2026-03-22", created_at: "2026-03-18T09:00:00Z",
    sector: "technology",
    content: `CONFIDENTIAL – FOR INTERNAL USE ONLY
═══════════════════════════════════════════════════════════════════════
           PROJECT BEACON — IC-1 INITIAL SCREENING MEMO
                    CloudScale Systems Inc.
                  Prepared for: Investment Committee
                    Date: March 22, 2026
═══════════════════════════════════════════════════════════════════════

I. OPPORTUNITY OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transaction Summary:
• Target: CloudScale Systems Inc. ("CloudScale" or the "Company")
• Transaction Type: Growth equity investment (minority-to-majority)
• Indicative Enterprise Value: $680M (18.2x LTM Revenue of $37M ARR basis)
• Proposed Equity Check: $310M from Fund VII
• Lead Partner: S. Chen | Deal Team: VP R. Gupta, Assoc. E. Martinez
• Process: Bilateral negotiation (no formal auction)
• Seller: Founder-led (CEO owns 45%, institutional investors own 40%)

Company Description:
CloudScale Systems is a cloud infrastructure optimization platform that helps
enterprises reduce cloud computing costs by 30-50% through AI-driven workload
management, resource rightsizing, and committed use discount optimization. The
Company serves 450+ enterprise customers including 38 Fortune 500 companies.

Key Financial Highlights:
┌────────────────────────────────┬──────────────┐
│ ARR (Annual Recurring Revenue) │ $189M        │
│ ARR Growth (YoY)              │ 42.5%        │
│ Gross Revenue Retention       │ 96%          │
│ Net Revenue Retention         │ 128%         │
│ Gross Margin                  │ 78%          │
│ Operating Loss                │ ($22M)       │
│ Adj. EBITDA                   │ $37M         │
│ EBITDA Margin                 │ 19.6%        │
│ Rule of 40 Score              │ 62 (42+20)   │
│ Total Cloud Spend Managed     │ $8.4B        │
│ LTV/CAC Ratio                 │ 6.2x         │
│ Payback Period                │ 14 months    │
│ Customers                     │ 450+         │
│ Fortune 500 Customers         │ 38           │
│ Employees                     │ 620          │
│ ACVs                          │ $420K avg    │
└────────────────────────────────┴──────────────┘

II. INVESTMENT THESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thesis 1: MASSIVE TAM WITH SECULAR TAILWINDS
• Enterprise cloud spend: $600B+ by 2027 (Gartner)
• Cloud waste estimated at 30-40% of total spend ($180-240B addressable)
• Regulatory and ESG pressure driving sustainability/efficiency mandates

Thesis 2: BEST-IN-CLASS UNIT ECONOMICS
• 128% NRR = net positive revenue growth from existing customers
• 6.2x LTV/CAC = highly capital-efficient customer acquisition
• 78% gross margin with upward trajectory (target 82%+ at scale)

Thesis 3: AI-NATIVE PLATFORM
• Proprietary ML models trained on $8.4B of cloud spend data
• 1.2 trillion data points processed monthly for optimization
• Patents pending on predictive scaling algorithms

Thesis 4: CLEAR PATH TO PROFITABILITY & IPO
• Already EBITDA positive at $37M (19.6% margin)
• Rule of 40 score of 62 puts CloudScale in top decile of SaaS
• IPO-ready infrastructure: SOC 2 Type II, FedRAMP authorized

Preliminary Return Analysis (5-year hold):
• Revenue CAGR: 30% (decelerating from 42% to 20% by Year 5)
• Exit at 15x forward revenue: $4.2B EV
• Gross IRR: 28.1% | MOIC: 3.2x

III. KEY RISKS FOR IC DISCUSSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. VALUATION: 18.2x revenue is premium; need conviction on growth durability
2. COMPETITION: AWS, Azure, and GCP building native optimization tools
3. KEY PERSON: Founder/CEO is central to product vision and sales
4. GROWTH DECELERATION: Revenue growth trending from 55% → 42% — trajectory?
5. TAM PENETRATION: At $189M ARR, approaching saturation of early adopters

IV. IC-1 REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requesting IC authorization to:
1. Proceed with management meetings and data room access
2. Engage advisors for commercial DD ($400K estimated)
3. Submit non-binding indication of interest at $650-700M EV range

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIDENTIAL — FUND VII — NOT FOR EXTERNAL DISTRIBUTION`
  },
  {
    id: "sample-4", filename: "Project Citadel - IC3 DD Summary & Final Terms.pdf",
    file_type: "application/pdf", file_size: 5100000, status: "completed",
    deal_name: "Project Citadel", ic_date: "2026-02-28", created_at: "2026-02-24T11:00:00Z",
    sector: "industrials",
    content: `CONFIDENTIAL – FOR INTERNAL USE ONLY
═══════════════════════════════════════════════════════════════════════
            PROJECT CITADEL — IC-3 DUE DILIGENCE REVIEW
                  Premier Waste Solutions LLC
                 Prepared for: Investment Committee
                    Date: February 28, 2026
═══════════════════════════════════════════════════════════════════════

I. EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transaction Overview:
• Target: Premier Waste Solutions LLC ("Premier" or the "Company")
• Transaction Type: Platform LBO with tuck-in acquisition strategy
• Enterprise Value: $310M (9.8x LTM Adj. EBITDA of $32M)
• Equity Check: $125M from Fund VII
• Total Leverage: 5.8x (Senior 4.5x / Mezzanine 1.3x)
• Lead Partner: R. Patel | Deal Team: VP B. Harris, Assoc. L. Chen

Key Financials:
┌─────────────────────────────┬──────────────┐
│ Revenue                     │ $478M        │
│ Revenue Growth              │ 8.1%         │
│ Adj. EBITDA                 │ $32M         │
│ EBITDA Margin               │ 6.7%         │
│ EBITDA (pro forma w/ synergies) │ $38M     │
│ FCF                         │ $18M         │
│ Trucks/Vehicles             │ 1,200+       │
│ Employees                   │ 3,400        │
│ Service Contracts           │ 85,000+      │
│ Contract Renewal Rate       │ 94.2%        │
│ Routes                      │ 480          │
│ Transfer Stations           │ 12           │
│ Landfill Capacity (years)   │ 25+          │
└─────────────────────────────┴──────────────┘

Due Diligence Summary — All Workstreams Complete:
✅ Financial DD (KPMG): EBITDA confirmed at $32M; $6M of identified synergies
✅ Commercial DD (BCG): Market position validated; route density advantage
✅ Environmental DD (ERM): No material liabilities; Phase I/II clean
✅ Legal DD (Latham & Watkins): No material litigation; permits current
✅ Fleet Assessment (independent): Fleet in good condition; $22M replacement CapEx planned
✅ Insurance Review: Adequate coverage; workers comp experience mod at 0.89
✅ IT/Systems: Routing software proprietary and effective; cybersecurity adequate

Target Returns (Updated Post-DD):
• Gross IRR: 25.3%
• Gross MOIC: 2.5x
• Hold Period: 4-5 years

Value Creation Plan:
1. Route Density Optimization: $4.2M EBITDA impact (reduce stops per route cost)
2. Pricing Rationalization: $3.8M (annual 3-5% price increases on contracts)
3. CNG Fleet Conversion: $2.1M annual fuel savings by Year 3
4. Tuck-in Acquisitions: 8-12 targets identified at 4-6x EBITDA
5. Recycling Revenue Enhancement: $1.5M (commodity hedging + sorting tech)

II. IC-3 RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The deal team recommends PROCEEDING TO IC FINAL with the following
outstanding items to be resolved:

1. Finalize management incentive plan (draft attached)
2. Complete environmental insurance binder
3. Negotiate final purchase agreement terms with seller's counsel
4. Board seat composition agreement

Target IC Final: April 15, 2026
Target Signing: April 25, 2026
Expected Close: June 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIDENTIAL — FUND VII — NOT FOR EXTERNAL DISTRIBUTION`
  },
  {
    id: "sample-5", filename: "Project Echo - Post-IC Approval Summary & Close Tracker.pdf",
    file_type: "application/pdf", file_size: 2800000, status: "completed",
    deal_name: "Project Echo", ic_date: "2026-02-15", created_at: "2026-02-16T08:00:00Z",
    sector: "technology",
    content: `CONFIDENTIAL – FOR INTERNAL USE ONLY
═══════════════════════════════════════════════════════════════════════
          PROJECT ECHO — POST-IC APPROVAL CLOSING SUMMARY
                    TalentBridge HR Tech Inc.
                    Date: February 15, 2026
═══════════════════════════════════════════════════════════════════════

IC FINAL RESULT: APPROVED (Unanimous 5-0)

Transaction Summary:
• Target: TalentBridge HR Tech Inc.
• Enterprise Value: $215M (22.0x LTM EBITDA)
• Equity Check: $145M from Fund VII
• IRR Target: 32.4% | MOIC Target: 3.8x
• Growth Equity investment — 65% stake acquisition

Approval Conditions (all met):
✅ Final employment agreements for CEO and CTO executed
✅ Technology escrow arrangement for source code established
✅ FedRAMP authorization maintained through closing
✅ Customer consent from top 5 enterprise clients obtained
✅ R&W insurance policy bound ($30M coverage)

Key Metrics at Approval:
• ARR: $68M (58.3% YoY growth)
• NRR: 142% (best in class for HR tech)
• Gross Margin: 82%
• EBITDA Margin: 14.2% (improving rapidly)
• Rule of 40: 72.5

Closing Timeline:
• Signing: February 20, 2026
• HSR Filing: February 25, 2026
• Expected Close: March 20, 2026

Post-Close Value Creation Plan (100-Day):
1. Hire CFO (current controller interim) — Target: April 2026
2. Expand enterprise sales team (+8 AEs, +3 SEs)
3. Launch UK/EMEA go-to-market (partnership model)
4. Integrate data analytics module (acquired IP from prior deal)
5. Establish board governance and quarterly reporting cadence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIDENTIAL — FUND VII — NOT FOR EXTERNAL DISTRIBUTION`
  },
  {
    id: "sample-6", filename: "Project Granite - IC2 Pass Recommendation.pdf",
    file_type: "application/pdf", file_size: 1900000, status: "completed",
    deal_name: "Project Granite", ic_date: "2026-01-20", created_at: "2026-01-18T10:00:00Z",
    sector: "healthcare",
    content: `CONFIDENTIAL – FOR INTERNAL USE ONLY
═══════════════════════════════════════════════════════════════════════
          PROJECT GRANITE — IC-2 PASS RECOMMENDATION
                   Apex Dental Partners LLC
                    Date: January 20, 2026
═══════════════════════════════════════════════════════════════════════

RECOMMENDATION: PASS — Do Not Proceed to IC-3

Transaction Overview:
• Target: Apex Dental Partners LLC (DSO — Dental Service Organization)
• Enterprise Value: $520M (15.3x LTM EBITDA of $34M)
• Proposed Equity Check: $210M from Fund VII
• Lead Partner: J. Morrison

Reasons for Pass Recommendation:

1. VALUATION CONCERN (Critical)
   Entry multiple of 15.3x is 28% above comparable DSO transactions
   (median: 11.9x for platforms of this size). Seller expectations are
   firm at $520M+ and we see limited path to negotiate down.

2. EXECUTION RISK (High)
   Business model depends on aggressive de novo expansion (target:
   15 new locations/year). Historical success rate on de novos is
   only 65% achieving profitability within 18 months.

3. DENTIST RETENTION (High)
   Key dentist turnover of 22% annually is well above DSO industry
   average of 15%. Loss of affiliated dentists directly impacts revenue.

4. REGULATORY HEADWIND
   State-level corporate practice of medicine (CPOM) regulations
   tightening in 3 key states (TX, FL, CA) where 40% of revenue
   is generated.

5. IRR BELOW THRESHOLD
   Base case IRR of 16.1% and MOIC of 1.8x are below Fund VII
   minimums (20% IRR, 2.0x MOIC) even with optimistic assumptions.

IC-2 Vote Result: 4-1 to PASS
• J. Morrison (Lead): Pass — "Math doesn't work at this price"
• S. Williams: Pass — "Retention risk too high"
• D. Kim: Pass — "Regulatory uncertainty"
• J. Lee: Defer — "Would reconsider at 12x or below"
• M. Brown: Pass — "Execution risk on de novo strategy"

Lessons Learned:
• DSO platforms above 13x have historically underperformed in Fund portfolio
• De novo execution risk should be discounted more heavily in models
• Dentist retention KPIs are leading indicator of business health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIDENTIAL — FUND VII — NOT FOR EXTERNAL DISTRIBUTION`
  },
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
  const [selectedDocument, setSelectedDocument] = useState<(Document | SampleDocument) | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const documents = useMemo(() => {
    const real = realDocuments as Document[];
    // Merge real docs with sample docs (sample docs only shown if no real docs exist)
    if (real.length === 0) {
      return sampleDocuments as any[];
    }
    return [...real, ...sampleDocuments] as any[];
  }, [realDocuments]);

  const handleViewDocument = async (doc: any) => {
    setSelectedDocument(doc);
    setIsLoadingContent(true);
    setDocumentContent(null);
    setActiveTab("content");

    // Check if it's a sample document (has content directly)
    if (doc.content && doc.id?.startsWith("sample-")) {
      setDocumentContent(doc.content);
      setIsLoadingContent(false);
      return;
    }

    try {
      const { data: docData } = await supabase
        .from("documents")
        .select("content")
        .eq("id", doc.id)
        .single();

      if (docData?.content) {
        setDocumentContent(docData.content);
      } else {
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

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    documents.forEach(doc => {
      const year = doc.created_at ? new Date(doc.created_at).getFullYear() : null;
      if (year) yearSet.add(year);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchQuery ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.deal_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const docYear = doc.created_at ? new Date(doc.created_at).getFullYear().toString() : null;
      const matchesYear = selectedYear === "all" || docYear === selectedYear;

      const matchesSector = selectedSector === "all" ||
        doc.sector === selectedSector;

      return matchesSearch && matchesYear && matchesSector;
    });
  }, [documents, searchQuery, selectedYear, selectedSector]);

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, Record<string, Record<string, typeof documents>>> = {};

    filteredDocuments.forEach(doc => {
      const year = doc.created_at ? new Date(doc.created_at).getFullYear().toString() : "unknown";
      const sector = doc.sector || "uncategorized";
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

  // Sector options combining database sectors and sample data sectors
  const allSectors = useMemo(() => {
    const sectorSet = new Set<string>();
    documents.forEach(doc => {
      if (doc.sector) sectorSet.add(doc.sector);
    });
    return Array.from(sectorSet).sort();
  }, [documents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">IC Document Archive</h2>
            <p className="text-muted-foreground">
              Browse IC memos, investment memoranda, DD reports, and post-committee notes by year, sector, and deal
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
        {[
          { label: "Total Documents", value: documents.length.toString(), icon: FileText },
          { label: "Sectors Covered", value: allSectors.length.toString(), icon: Building2 },
          { label: "Active Deals", value: new Set(documents.map(d => d.deal_name).filter(Boolean)).size.toString(), icon: Briefcase },
          { label: "Archive Years", value: years.length.toString(), icon: Calendar },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents, deals, memos..."
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
                {allSectors.map(sector => (
                  <SelectItem key={sector} value={sector}>
                    {getSectorDisplayName(sector)}
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
                                          {docs.map((doc: any) => (
                                            <div
                                              key={doc.id}
                                              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer"
                                              onClick={() => handleViewDocument(doc)}
                                            >
                                              <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <p className="text-sm truncate max-w-[350px]">
                                                  {doc.filename}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                {doc.sector && (
                                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                                    <Tag className="w-2.5 h-2.5 mr-1" />
                                                    {getSectorDisplayName(doc.sector)}
                                                  </Badge>
                                                )}
                                                <span>{formatFileSize(doc.file_size)}</span>
                                                <span className="opacity-40">&middot;</span>
                                                <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
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
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {(selectedDocument as any)?.filename}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Document metadata */}
            <div className="flex flex-wrap gap-2 text-sm">
              {(selectedDocument as any)?.deal_name && (
                <Badge variant="secondary">{(selectedDocument as any).deal_name}</Badge>
              )}
              {(selectedDocument as any)?.sector && (
                <Badge variant="outline">
                  <Tag className="w-3 h-3 mr-1" />
                  {getSectorDisplayName((selectedDocument as any).sector)}
                </Badge>
              )}
              {(selectedDocument as any)?.ic_date && (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  IC Date: {format(new Date((selectedDocument as any).ic_date), 'PPP')}
                </Badge>
              )}
              {(selectedDocument as any)?.file_size && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {formatFileSize((selectedDocument as any).file_size)}
                </span>
              )}
              {(selectedDocument as any)?.created_at && (
                <span className="text-xs text-muted-foreground">
                  Uploaded: {format(new Date((selectedDocument as any).created_at), 'PPP')}
                </span>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="h-[60vh] border rounded-lg p-6 bg-secondary/10">
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-mono text-[12px] leading-relaxed">
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
