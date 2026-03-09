import { useState, useEffect } from "react";
import { Users, Briefcase, ChevronRight, ChevronDown, Star, Clock, TrendingUp, Loader2, Target, Shield, MessageSquare, ArrowLeft, Lightbulb, BookOpen, CheckCircle2, AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useQuestions } from "@/hooks/useQuestions";
import { useNavigate } from "react-router-dom";

type ViewMode = "deal-team" | "ic-members";

const difficultyFromScore = (score: number | null): "low" | "medium" | "high" => {
  if (!score || score < 0.33) return "low";
  if (score < 0.66) return "medium";
  return "high";
};

const difficultyColors = {
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface QuestionDetail {
  id: string;
  question_text: string;
  category: string;
  frequency: number;
  importance_score: number;
  asker_type: string;
  guidance: string;
  sampleAnswer: string;
  commonMistakes: string[];
  relatedQuestions: string[];
  dataPointsNeeded: string[];
  icContext: string;
}

const fallbackDealTeamQuestions: QuestionDetail[] = [
  {
    id: "1",
    question_text: "Walk through your LBO model assumptions — what entry multiple, leverage, and exit multiple are you underwriting, and what's the sensitivity around each?",
    category: "Returns", frequency: 94, importance_score: 0.95, asker_type: "deal_team",
    guidance: "This is the #1 most asked question at IC. Be prepared with your base, upside, and downside cases. Know your sensitivity tables cold — the IC will probe the edges of your model.",
    sampleAnswer: "Our base case assumes 12.5x entry EV/EBITDA with 5.2x leverage. We underwrite a 14.0x exit over a 5-year hold, yielding a 22.4% gross IRR and 2.8x MOIC. In our downside case (10x exit, 5% revenue decline), IRR floors at 12.8% with 1.6x MOIC — still serviceable. Upside case at 16x exit with full add-on execution delivers 28.1% IRR / 3.5x MOIC.",
    commonMistakes: [
      "Not having downside scenario memorized",
      "Using overly aggressive exit multiples without comp support",
      "Failing to adjust for management rollover and promote structure",
      "Not including transaction fees in the sources & uses",
    ],
    relatedQuestions: [
      "What happens to your returns if you miss the EBITDA budget by 15% in Year 1?",
      "How does the PIK toggle on the mezzanine affect your equity returns?",
      "What's the implied TEV at each year if we need an early exit?",
    ],
    dataPointsNeeded: [
      "Entry EV/EBITDA multiple and comparables",
      "Leverage breakdown (senior, mezzanine, revolver)",
      "Exit multiple assumption with market data support",
      "Sensitivity table (entry × exit × leverage)",
      "Sources and uses of funds",
    ],
    icContext: "IC members will stress-test your model assumptions. The most common pushback is on exit multiple — always have 3+ supporting data points for your exit assumption.",
  },
  {
    id: "2",
    question_text: "What is the quality of earnings adjustment and how confident are you in the normalized EBITDA? What addbacks are you including?",
    category: "Financial DD", frequency: 91, importance_score: 0.9, asker_type: "deal_team",
    guidance: "The QoE is the foundation of your valuation. Be transparent about addbacks — IC members will scrutinize anything that looks aggressive. Know which adjustments the QoE provider agreed vs. flagged.",
    sampleAnswer: "Deloitte's QoE confirmed adjusted EBITDA at $34M. Key addbacks include $2.1M in one-time legal costs (patent defense settled), $1.4M in management transition expenses, and $0.8M in facility consolidation. We excluded $1.2M in proposed procurement savings that Deloitte flagged as speculative. The QoE provider characterized the adjustments as 'moderate and well-supported.'",
    commonMistakes: [
      "Including unproven synergies as QoE addbacks",
      "Not disclosing which addbacks the QoE provider flagged",
      "Using pro forma run-rate without adequate historical support",
      "Confusing GAAP EBITDA with management-adjusted EBITDA",
    ],
    relatedQuestions: [
      "What did the QoE provider flag that you disagree with?",
      "How does working capital seasonality affect normalized EBITDA?",
      "What's the gap between management EBITDA and your adjusted EBITDA?",
    ],
    dataPointsNeeded: [
      "QoE report summary with all adjustment categories",
      "Bridge from reported to adjusted EBITDA",
      "Historical EBITDA with and without adjustments (3 years)",
      "QoE provider's opinion letter",
    ],
    icContext: "Senior IC members pay close attention to EBITDA adjustments because aggressive addbacks have historically led to value destruction in the portfolio.",
  },
  {
    id: "3",
    question_text: "What's the customer concentration, and how would the loss of the top 3 customers impact EBITDA? What's the retention/churn data?",
    category: "Revenue Quality", frequency: 87, importance_score: 0.85, asker_type: "deal_team",
    guidance: "Have specific revenue percentages for top 1, 5, 10, and 20 customers. Know the contract terms, renewal rates, and switching costs for each major customer.",
    sampleAnswer: "Top customer (HCA Healthcare) represents 6.0% of revenue. Top 5 = 22.1%, Top 10 = 31.8%. Losing our top 3 customers would reduce EBITDA by approximately $8.2M (24% impact), but this is mitigated by: (1) multi-year GPO contracts with 2-3 year terms, (2) 97.2% trailing 5-year retention rate, (3) high switching costs due to regulatory revalidation requirements, and (4) we've never lost a top-20 customer in the last 8 years.",
    commonMistakes: [
      "Only knowing top 1 customer — need top 10",
      "Not understanding contract renewal mechanisms",
      "Underestimating customer switching costs",
      "Not having customer reference call data ready",
    ],
    relatedQuestions: [
      "What percentage of revenue is under long-term contracts vs. spot?",
      "Which customers are up for renewal in the next 12 months?",
      "Have you completed the customer reference calls?",
    ],
    dataPointsNeeded: [
      "Top 1, 5, 10, 20 customer revenue concentration",
      "Contract duration and renewal terms",
      "Historical retention rate (5 years)",
      "Customer reference call results",
      "Revenue by customer cohort analysis",
    ],
    icContext: "Customer concentration above 20% for the top customer raises red flags. The IC views diversified, sticky customer bases as key to downside protection.",
  },
  { id: "4", question_text: "What's your value creation bridge? Break down how much comes from revenue growth, margin expansion, add-ons, and multiple expansion.", category: "Value Creation", frequency: 85, importance_score: 0.8, asker_type: "deal_team", guidance: "The IC wants to see a clear, quantified bridge from entry equity to exit equity. Each lever should have supporting evidence.", sampleAnswer: "Starting from $185M equity: (1) Organic Revenue Growth +$65M (8-10% CAGR), (2) Margin Expansion +$82M (28%→33% via procurement, automation), (3) Add-On Acquisitions +$120M (3-5 at 7-9x), (4) Multiple Expansion +$58M (12.5x→14.0x), (5) Debt Paydown +$8M. Total exit equity: ~$518M = 2.8x MOIC.", commonMistakes: ["Over-relying on multiple expansion", "Double-counting synergies", "Not stress-testing add-on pipeline"], relatedQuestions: ["Which value creation lever has the most risk?", "What happens if add-ons don't materialize?"], dataPointsNeeded: ["Revenue bridge by year", "Margin improvement detail", "Add-on pipeline with multiples", "Comparable exit multiples"], icContext: "The IC values deals where >50% of returns come from operational improvement vs. financial engineering." },
  { id: "5", question_text: "How experienced is this management team at operating under PE ownership? What's the CEO's track record on M&A integration?", category: "Management", frequency: 82, importance_score: 0.75, asker_type: "deal_team", guidance: "Management is often the #1 risk in a PE deal. Know the CEO's history in detail.", sampleAnswer: "CEO Sarah Mitchell has 15 years with the company and previously served as SVP at Teleflex (public med-tech). She's completed 2 acquisitions — first integrated smoothly in 6 months, second took 12 months but is now fully on platform. She has not operated under PE ownership before, which we mitigate with an experienced operating partner (M. Brown) on the board and a VP-level integration PMO hire.", commonMistakes: ["Not disclosing lack of PE experience", "Insufficient reference checks"], relatedQuestions: ["What's the succession plan if the CEO leaves?", "Have you completed all reference checks?"], dataPointsNeeded: ["CEO biographical profile", "Prior acquisition track record", "Reference check summary (10+)"], icContext: "The IC places enormous weight on management quality. Key person risk is a top-3 reason for deal rejection." },
  { id: "6", question_text: "What's the competitive moat? If a well-funded competitor enters this space, what prevents margin erosion or customer defection?", category: "Competitive", frequency: 79, importance_score: 0.7, asker_type: "deal_team", guidance: "Articulate 3-4 specific barriers to entry. Avoid generic statements like 'strong brand.'", sampleAnswer: "Four key barriers: (1) FDA 510(k) clearances for 180+ products — 18-24 month regulatory timeline for competitors, (2) GPO contracts requiring 2-3 year commitments with penalty clauses, (3) Institutional knowledge embedded in 2,500+ hospital procurement systems, (4) 14 patents on proprietary product designs. A new entrant would need 3-5 years and $50M+ to replicate our position.", commonMistakes: ["Claiming 'no real competition'", "Not addressing potential disruptors"], relatedQuestions: ["Who's the emerging competitor you're most worried about?"], dataPointsNeeded: ["Patent portfolio summary", "Regulatory barrier detail", "Market share data", "Competitive positioning map"], icContext: "The IC assesses moat durability over the hold period, not just current positioning." },
  { id: "7", question_text: "Describe the add-on acquisition pipeline. What are target sizes, multiples, and integration timelines?", category: "M&A Strategy", frequency: 76, importance_score: 0.7, asker_type: "deal_team", guidance: "Have 3-5 specific, named targets with preliminary financials.", sampleAnswer: "We've identified 4 actionable targets and 12 additional prospects. Top 4: (1) SurgTech ($42M rev, 7.2x), (2) CleanRite ($28M rev, 6.8x), (3) Pacific Surgical ($35M rev, 8.1x), (4) MedPro ($18M rev, 7.5x). Average integration timeline: 6-9 months. Total pipeline capital: $85-120M over 3 years.", commonMistakes: ["Only having 1-2 vague targets", "Not having seller engagement data"], relatedQuestions: ["How many sellers have you actually spoken with?", "What's the competitive dynamics for these add-ons?"], dataPointsNeeded: ["Named target list with financials", "Expected multiples", "Integration playbook", "Timeline and resource requirements"], icContext: "The IC wants to see a credible, executable pipeline — not aspirational targets." },
  { id: "8", question_text: "What's the leverage at close and the debt paydown trajectory? What happens to covenant compliance in a 15% revenue decline?", category: "Capital Structure", frequency: 74, importance_score: 0.65, asker_type: "deal_team", guidance: "Know your covenant package and stress test results.", sampleAnswer: "5.2x total leverage at close (Senior 4.0x / Mezz 1.2x). We deleverage to 3.1x by Year 3. In a 15% revenue decline scenario, leverage peaks at 5.8x with interest coverage at 2.1x — no covenant breach. Our revolver ($25M) provides additional liquidity buffer.", commonMistakes: ["Not knowing covenant levels", "Ignoring cash sweep mechanisms"], relatedQuestions: ["What's the covenant cushion in Year 1?", "How does the cash sweep work?"], dataPointsNeeded: ["Debt structure detail", "Covenant package", "Stress test results", "Amortization schedule"], icContext: "Post-2020, the IC is very focused on downside leverage scenarios." },
  { id: "9", question_text: "Who are the likely exit buyers and what multiples are they paying?", category: "Exit Strategy", frequency: 71, importance_score: 0.6, asker_type: "deal_team", guidance: "Have 5+ named potential acquirers with supporting transaction data.", sampleAnswer: "Three exit paths: (1) Strategic sale to Teleflex, ICU Medical, or Medline — precedent transactions at 14-18x, (2) Secondary PE sale — 3 active buyers in med-device roll-ups, (3) IPO if we reach $100M+ EBITDA. Base case assumes strategic sale at 14x.", commonMistakes: ["Relying solely on IPO as exit path", "Not having recent comparable transactions"], relatedQuestions: ["Have you had informal conversations with potential buyers?"], dataPointsNeeded: ["Named buyer list", "Precedent transaction multiples", "Strategic rationale for each buyer"], icContext: "IC approval is strongly correlated with clarity of exit path." },
  { id: "10", question_text: "What regulatory or compliance risks exist? Any pending litigation, environmental liabilities, or licensing issues?", category: "Risk / Legal", frequency: 68, importance_score: 0.5, asker_type: "deal_team", guidance: "Be comprehensive and proactive about risk disclosure. Surprises post-IC destroy credibility.", sampleAnswer: "No material litigation pending. Perfect FDA inspection record for 15 years. Environmental Phase I clean for both facilities. All state licenses current. One minor compliance finding in 2024 (labeling update) — resolved within 30 days with no fine. R&W insurance policy bound at $30M coverage.", commonMistakes: ["Minimizing known risks", "Not having insurance coverage confirmed"], relatedQuestions: ["Have you reviewed all pending regulatory changes?"], dataPointsNeeded: ["Litigation summary", "Regulatory compliance history", "Environmental reports", "Insurance coverage detail"], icContext: "The IC treats undisclosed risks as a serious governance issue." },
];

const fallbackICMemberQuestions: QuestionDetail[] = [
  { id: "11", question_text: "What's the downside protection? In a recession scenario, what's the floor on EBITDA and can we still service the debt?", category: "Downside", frequency: 96, importance_score: 0.95, asker_type: "ic_member", guidance: "Focus on the floor, not the ceiling. What happens when things go wrong?", sampleAnswer: "In our stressed case (revenue -15%, margins compress 200bps), EBITDA floors at $26M with interest coverage at 1.8x. We maintain covenant compliance and have $25M revolver capacity. In the 2020 COVID stress (actual data), the business saw only 8% revenue decline with rapid recovery.", commonMistakes: ["Only presenting the base case", "Not having actual recession data if available"], relatedQuestions: ["What's the maximum loss scenario?", "How do variable costs flex in a downturn?"], dataPointsNeeded: ["Stress test results at various revenue decline levels", "Fixed vs. variable cost breakdown", "2020 actual performance data", "Covenant compliance at stress levels"], icContext: "The Chairman will always ask about downside before discussing upside." },
  { id: "12", question_text: "Why is this business available at this price? What does the seller know that we don't?", category: "Deal Dynamics", frequency: 92, importance_score: 0.9, asker_type: "ic_member", guidance: "Address the elephant in the room. Why is this deal available to us?", sampleAnswer: "The seller (founder, age 68) is motivated by estate planning and retirement. He approached us directly — no auction. This is a bilateral negotiation which allowed us to negotiate the 12.5x entry vs. a more aggressive auction clearing price of 14-16x. We've verified the seller's motivation through personal conversations and advisor references.", commonMistakes: ["Dismissing this question", "Not investigating seller motivation thoroughly"], relatedQuestions: ["Is there an information asymmetry issue here?"], dataPointsNeeded: ["Seller background and motivation", "Process history", "Broker/advisor references"], icContext: "This question tests whether the deal team has thought critically about adverse selection." },
  { id: "13", question_text: "How does this deal fit our fund strategy and sector allocation? Are we overweight in this sector?", category: "Portfolio Fit", frequency: 88, importance_score: 0.85, asker_type: "ic_member", guidance: "Know Fund VII's current portfolio composition and sector targets.", sampleAnswer: "Post-transaction, healthcare would be 28% of deployed capital (target: 25-35%). We currently have 2 healthcare investments (both performing above plan). This deal is complementary — different sub-sector (medical devices vs. healthcare services) with no customer overlap. Fund VII deployment post-close: 62%.", commonMistakes: ["Not knowing current portfolio allocation", "Ignoring correlation risk"], relatedQuestions: ["What's the correlation with our existing healthcare exposure?"], dataPointsNeeded: ["Current fund portfolio summary", "Sector allocation targets", "Correlation analysis"], icContext: "Portfolio construction is a key IC responsibility." },
  { id: "14", question_text: "What's the key person risk? If the CEO leaves in Year 1, what happens to the business?", category: "Management Risk", frequency: 85, importance_score: 0.8, asker_type: "ic_member", guidance: "Be honest about key person dependency and show mitigation plan.", sampleAnswer: "If CEO departs, COO James Rodriguez (12 years) steps in as interim. VP Sales Karen Liu owns most customer relationships. We mitigate with: 2-year non-compete, 4-year equity vesting, and an operating partner (M. Brown) providing board-level oversight. We're also hiring a VP of Integration to reduce CEO dependency on M&A execution.", commonMistakes: ["Claiming 'no key person risk'", "Not having succession plan documented"], relatedQuestions: ["How deep is the management bench below the CEO?"], dataPointsNeeded: ["Org chart with tenure", "Succession plan", "Employment agreement terms", "Non-compete details"], icContext: "Key person risk has been a top-3 IC concern in 8 of the last 10 rejected deals." },
  { id: "15", question_text: "Have we done a thorough reference check on management? What did former employers, customers, and competitors say?", category: "Due Diligence", frequency: 82, importance_score: 0.75, asker_type: "ic_member", guidance: "Complete 10+ references minimum. Include back-channel references.", sampleAnswer: "25 reference calls completed: 10 customers (all positive), 5 former colleagues (strong endorsements), 5 industry contacts (confirmed market position), 3 competitors (respect for management team), 2 bankers. One concern flagged: CEO can be slow on decisions during uncertainty — mitigated by structured board governance.", commonMistakes: ["Insufficient reference volume", "Only front-channel references"], relatedQuestions: ["What was the most negative reference you received?"], dataPointsNeeded: ["Reference call log with names and themes", "Summary of positive and negative themes"], icContext: "Back-channel references often reveal information that formal references don't." },
  { id: "16", question_text: "What secular headwinds or tailwinds affect this industry over the next 5 years?", category: "Market", frequency: 79, importance_score: 0.7, asker_type: "ic_member", guidance: "Take a 5-10 year view. Identify both tailwinds and headwinds.", sampleAnswer: "Tailwinds: (1) shift to single-use surgical instruments (infection control), (2) aging population driving procedure volumes, (3) ASC migration increasing demand for procedure kits. Headwinds: (1) hospital budget pressure could slow procurement cycles, (2) potential competition from offshore manufacturers (mitigated by FDA requirements), (3) commodity input costs (partially hedgeable).", commonMistakes: ["Only mentioning tailwinds", "Not quantifying the impact"], relatedQuestions: ["How cyclical is this business?"], dataPointsNeeded: ["Industry growth rates", "Market research reports", "Regulatory trend analysis"], icContext: "The IC values deal teams that acknowledge both sides of the market equation." },
  { id: "17", question_text: "How proven is the add-on acquisition strategy in practice?", category: "M&A Execution", frequency: 76, importance_score: 0.65, asker_type: "ic_member", guidance: "Reference specific examples from your portfolio or the company's track record.", sampleAnswer: "The company has completed 2 acquisitions (2019 and 2022). First integrated in 6 months with $3.2M in synergies achieved. Second took 12 months but delivered $2.8M in synergies. Our Fund VI portfolio company, MedPlatform, executed 8 add-ons at 6-8x with 95% synergy achievement rate. We plan to install the same integration playbook.", commonMistakes: ["No comparable examples", "Ignoring integration failure rates"], relatedQuestions: ["What's the playbook for the first 100 days post-acquisition?"], dataPointsNeeded: ["Company M&A history", "Portfolio company M&A track record", "Integration playbook"], icContext: "The IC has seen add-on strategies fail — show them why this one will succeed." },
  { id: "18", question_text: "What's the technology risk? Is there a platform migration needed?", category: "Operations", frequency: 73, importance_score: 0.6, asker_type: "ic_member", guidance: "Address technology debt, cybersecurity, and system scalability.", sampleAnswer: "Current systems are adequate but not modern. ERP (SAP) was upgraded 3 years ago. Manufacturing MES system is proprietary and well-maintained. No immediate platform migration needed. Cybersecurity: SOC 2 Type II certified, annual pen testing. IT DD (Deloitte) rated overall maturity as 'adequate' with $2M recommended investment over 3 years for cloud migration.", commonMistakes: ["Dismissing technology risk in non-tech companies", "Not having IT DD completed"], relatedQuestions: ["How much tech debt are we inheriting?"], dataPointsNeeded: ["IT DD report", "Systems architecture summary", "Cybersecurity assessment"], icContext: "Even in non-tech deals, the IC increasingly cares about technology infrastructure." },
  { id: "19", question_text: "What ESG and sustainability risks should we consider?", category: "ESG", frequency: 70, importance_score: 0.5, asker_type: "ic_member", guidance: "Address environmental, social, and governance factors proactively.", sampleAnswer: "Environmental: Phase I clean for both sites. Single-use surgical instruments = waste concern, mitigated by recycling program and biodegradable material R&D. Social: Living wage for all employees, safety record above industry average (OSHA TRIR: 1.2 vs. industry 2.8). Governance: We'll install standard Fund VII governance with quarterly reporting and independent board members.", commonMistakes: ["Treating ESG as a check-the-box exercise", "No quantitative ESG metrics"], relatedQuestions: ["How do LP ESG requirements apply to this deal?"], dataPointsNeeded: ["Environmental assessment", "Safety records", "ESG policy framework", "LP ESG guidelines"], icContext: "ESG is increasingly important for LP reporting and exit value." },
  { id: "20", question_text: "What's our edge in this deal? Why will we win vs. other bidders?", category: "Competitive Advantage", frequency: 67, importance_score: 0.45, asker_type: "ic_member", guidance: "Articulate a clear, differentiated reason why we're the right buyer.", sampleAnswer: "Three edges: (1) Bilateral process — no auction, relationship-driven access through our senior advisor network, (2) Healthcare sector expertise — 12 healthcare investments across Funds V-VII, (3) Operating partner M. Brown has direct experience in medical device roll-ups (built $400M platform at prior firm). The CEO specifically chose us after interviewing 4 sponsors.", commonMistakes: ["Generic answers like 'we're a great partner'", "No quantifiable differentiator"], relatedQuestions: ["Why did the seller choose us?"], dataPointsNeeded: ["Process history", "Prior healthcare deals", "Operating partner background"], icContext: "The IC wants to ensure we have an information or execution advantage." },
];

export function QuestionPrep() {
  const [viewMode, setViewMode] = useState<ViewMode>("deal-team");
  const { questions: dbQuestions, isLoading, fetchQuestions } = useQuestions();
  const navigate = useNavigate();
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions(viewMode === "deal-team" ? "deal_team" : "ic_member");
  }, [viewMode]);

  const questions: QuestionDetail[] = dbQuestions.length > 0
    ? dbQuestions.map(q => ({
        ...q,
        guidance: "",
        sampleAnswer: "",
        commonMistakes: [],
        relatedQuestions: [],
        dataPointsNeeded: [],
        icContext: "",
      }))
    : (viewMode === "deal-team" ? fallbackDealTeamQuestions : fallbackICMemberQuestions);

  const toggleQuestion = (id: string) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">IC Question Preparation</h2>
            <p className="text-muted-foreground">
              {viewMode === "deal-team"
                ? "Anticipate the questions your IC will ask — click each question for detailed prep guidance"
                : "Key questions to challenge deal teams — click for frameworks and expected answers"}
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Button
          variant={viewMode === "deal-team" ? "glow" : "glass"}
          onClick={() => { setViewMode("deal-team"); setExpandedQuestionId(null); }}
          className="flex items-center gap-2"
        >
          <Briefcase className="w-4 h-4" />
          Deal Team Prep
        </Button>
        <Button
          variant={viewMode === "ic-members" ? "glow" : "glass"}
          onClick={() => { setViewMode("ic-members"); setExpandedQuestionId(null); }}
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          IC Member Questions
        </Button>
        <Button
          variant="glass"
          onClick={() => navigate("/chat")}
          className="flex items-center gap-2 ml-auto"
        >
          <MessageSquare className="w-4 h-4" />
          Ask AI for More
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Categories</p>
            <p className="font-semibold">{viewMode === "deal-team" ? "Returns & Revenue Quality" : "Downside & Deal Dynamics"}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Prep Time</p>
            <p className="font-semibold">{viewMode === "deal-team" ? "3-4 hours per IC" : "1-2 hours per deal"}</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Better Prepared Deals</p>
            <p className="font-semibold">{viewMode === "deal-team" ? "2.3x higher approval rate" : "40% fewer deferrals"}</p>
          </div>
        </div>
      </div>

      {/* Questions List with Drill-Down */}
      <div className="space-y-3">
        <div className="flex items-center justify-between opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="font-semibold">
            {viewMode === "deal-team" ? "Questions Your IC Will Likely Ask" : "Questions to Challenge the Deal Team"}
          </h3>
          <span className="text-xs text-muted-foreground">
            Click any question to expand preparation guidance
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          questions.map((question, index) => {
            const difficulty = difficultyFromScore(question.importance_score);
            const isExpanded = expandedQuestionId === question.id;
            return (
              <div
                key={question.id}
                className={cn(
                  "glass rounded-xl overflow-hidden transition-all duration-200 opacity-0 animate-fade-in",
                  isExpanded ? "ring-1 ring-primary/30" : "glass-hover cursor-pointer"
                )}
                style={{ animationDelay: `${250 + index * 40}ms` }}
              >
                {/* Question Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {question.question_text}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {question.category}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs capitalize", difficultyColors[difficulty])}>
                          {difficulty} difficulty
                        </Badge>
                        {question.frequency && (
                          <span className="text-xs text-muted-foreground">
                            Asked in {question.frequency}% of ICs
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-primary shrink-0 mt-1" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </div>
                </div>

                {/* Expanded Drill-Down Content */}
                {isExpanded && question.guidance && (
                  <div className="border-t border-border px-4 pb-4 space-y-4">
                    {/* Preparation Guidance */}
                    <div className="pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Preparation Guidance
                      </h4>
                      <p className="text-sm text-muted-foreground bg-primary/5 rounded-lg p-3">
                        {question.guidance}
                      </p>
                    </div>

                    {/* Sample Answer */}
                    {question.sampleAnswer && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Strong Sample Answer
                        </h4>
                        <p className="text-sm bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                          {question.sampleAnswer}
                        </p>
                      </div>
                    )}

                    {/* IC Context */}
                    {question.icContext && (
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-500 mb-1 flex items-center gap-1.5">
                          <BarChart3 className="w-3 h-3" />
                          IC Context & Pattern
                        </p>
                        <p className="text-sm text-muted-foreground">{question.icContext}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Data Points Needed */}
                      {question.dataPointsNeeded.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Data Points to Prepare
                          </h4>
                          <ul className="space-y-1">
                            {question.dataPointsNeeded.map((point, i) => (
                              <li key={i} className="text-xs flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {question.commonMistakes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Common Mistakes to Avoid
                          </h4>
                          <ul className="space-y-1">
                            {question.commonMistakes.map((mistake, i) => (
                              <li key={i} className="text-xs flex items-start gap-2 text-red-500/80">
                                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                <span>{mistake}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Follow-Up Questions */}
                    {question.relatedQuestions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Likely Follow-Up Questions
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {question.relatedQuestions.map((q, i) => (
                            <span key={i} className="text-xs bg-amber-500/5 border border-amber-500/10 rounded-full px-2.5 py-1">
                              {q}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate("/chat")}>
                        <MessageSquare className="w-3 h-3 mr-1.5" />
                        Ask AI to Elaborate
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleQuestion(question.id)}>
                        Collapse
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
