import { useState } from "react";
import {
  Database, Globe, Search, CheckCircle2, AlertCircle, Settings,
  RefreshCw, ArrowRight, Loader2, Shield, BarChart3, FileText,
  TrendingUp, Zap, Clock, ExternalLink, Key, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Connector {
  id: string;
  name: string;
  provider: string;
  description: string;
  logo: string;
  status: "connected" | "disconnected" | "error" | "configuring";
  lastSync?: string;
  features: string[];
  dataPoints: string[];
  apiKeyRequired: boolean;
  category: "financial_data" | "research" | "market_intel";
}

const connectors: Connector[] = [
  {
    id: "capiq",
    name: "S&P Capital IQ",
    provider: "S&P Global",
    description: "Access comprehensive financial data, company profiles, transaction comps, credit analysis, and screening tools directly within your IC workflow.",
    logo: "CIQ",
    status: "disconnected",
    features: [
      "Company financial statements (10+ years)",
      "Transaction comps & precedent deals",
      "Trading comps & public market data",
      "Credit ratings & debt analysis",
      "Industry reports & sector data",
      "Ownership & capital structure data",
      "M&A deal screening & alerts",
      "Executive compensation data",
    ],
    dataPoints: [
      "Revenue, EBITDA, Net Income, FCF",
      "EV/EBITDA, P/E, EV/Revenue multiples",
      "Leverage ratios, interest coverage",
      "Historical transaction multiples by sector",
      "Comparable company financials",
      "Market cap, enterprise value",
    ],
    apiKeyRequired: true,
    category: "financial_data",
  },
  {
    id: "factset",
    name: "FactSet",
    provider: "FactSet Research Systems",
    description: "Integrate FactSet's analytics platform for portfolio analytics, quantitative analysis, risk modeling, and comprehensive market data feeds.",
    logo: "FS",
    status: "disconnected",
    features: [
      "Real-time & historical market data",
      "Portfolio analytics & attribution",
      "Quantitative screening & models",
      "Supply chain & revenue exposure data",
      "Estimate consensus & revisions",
      "Ownership data & flow analysis",
      "Fixed income analytics",
      "ESG scores & sustainability data",
    ],
    dataPoints: [
      "Consensus estimates & actuals",
      "Ownership changes & 13F filings",
      "Supply chain relationships",
      "Geographic revenue breakdown",
      "Peer group analytics",
      "Risk factor decomposition",
    ],
    apiKeyRequired: true,
    category: "financial_data",
  },
  {
    id: "alphasense",
    name: "AlphaSense",
    provider: "AlphaSense, Inc.",
    description: "AI-powered market intelligence platform for searching earnings transcripts, expert calls, broker research, news, and regulatory filings with semantic search.",
    logo: "AS",
    status: "disconnected",
    features: [
      "AI-powered document search (Smart Synonyms)",
      "Earnings call transcript analysis",
      "Expert call transcript library",
      "Broker research aggregation",
      "SEC filing search & monitoring",
      "News & press release monitoring",
      "Sentiment analysis on mentions",
      "Custom alert & monitoring dashboards",
    ],
    dataPoints: [
      "Earnings call keyword trends",
      "Management tone & sentiment shifts",
      "Competitor mention frequency",
      "Expert network insights by sector",
      "Regulatory filing changes",
      "Broker target price changes",
    ],
    apiKeyRequired: true,
    category: "research",
  },
];

const useCases = [
  {
    title: "Auto-Populate IC Memos",
    description: "Pull company financials, trading comps, and transaction precedents directly into your IC memo builder",
    connectors: ["Capital IQ", "FactSet"],
    icon: FileText,
  },
  {
    title: "Real-Time Comp Tables",
    description: "Generate live comparable company and precedent transaction tables with current market data",
    connectors: ["Capital IQ", "FactSet"],
    icon: BarChart3,
  },
  {
    title: "Thesis Validation",
    description: "Search earnings transcripts and expert calls to validate or challenge investment thesis assumptions",
    connectors: ["AlphaSense"],
    icon: Search,
  },
  {
    title: "Market Intelligence Alerts",
    description: "Monitor target companies, sectors, and competitors for material developments and sentiment changes",
    connectors: ["AlphaSense", "FactSet"],
    icon: TrendingUp,
  },
  {
    title: "IC Question Preparation",
    description: "Surface relevant data points, analyst commentary, and expert insights to anticipate IC questions",
    connectors: ["AlphaSense", "Capital IQ"],
    icon: Shield,
  },
  {
    title: "Deal Screening & Sourcing",
    description: "Screen for potential targets based on financial criteria, ownership, and strategic fit",
    connectors: ["Capital IQ", "FactSet"],
    icon: Zap,
  },
];

const statusColors: Record<string, string> = {
  connected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  disconnected: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  configuring: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const statusIcons: Record<string, React.ElementType> = {
  connected: CheckCircle2,
  disconnected: AlertCircle,
  error: AlertCircle,
  configuring: RefreshCw,
};

const logoColors: Record<string, string> = {
  CIQ: "bg-blue-600 text-white",
  FS: "bg-emerald-600 text-white",
  AS: "bg-violet-600 text-white",
};

export function DataConnectors() {
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [connectorStates, setConnectorStates] = useState<Record<string, string>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isTesting, setIsTesting] = useState<string | null>(null);

  const getStatus = (id: string) => connectorStates[id] || "disconnected";

  const handleTestConnection = async (id: string) => {
    setIsTesting(id);
    // Simulate API test
    setTimeout(() => {
      if (apiKeys[id]) {
        setConnectorStates(prev => ({ ...prev, [id]: "connected" }));
        toast.success(`${connectors.find(c => c.id === id)?.name} connected successfully`);
      } else {
        toast.error("Please enter an API key first");
      }
      setIsTesting(null);
    }, 2000);
  };

  const handleDisconnect = (id: string) => {
    setConnectorStates(prev => ({ ...prev, [id]: "disconnected" }));
    setApiKeys(prev => ({ ...prev, [id]: "" }));
    toast.info(`${connectors.find(c => c.id === id)?.name} disconnected`);
  };

  const selected = connectors.find(c => c.id === selectedConnector);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Data Connectors</h2>
            <p className="text-muted-foreground">
              Connect to institutional data providers to enrich IC workflows with real-time financial data and market intelligence
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="connectors" className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <TabsList>
          <TabsTrigger value="connectors" className="gap-1.5">
            <Server className="w-3.5 h-3.5" /> Connectors
          </TabsTrigger>
          <TabsTrigger value="use_cases" className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Use Cases
          </TabsTrigger>
        </TabsList>

        {/* Connectors Tab */}
        <TabsContent value="connectors" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Connector List */}
            <div className="lg:col-span-4 space-y-4">
              {connectors.map((connector) => {
                const status = getStatus(connector.id);
                const StatusIcon = statusIcons[status];
                return (
                  <button
                    key={connector.id}
                    onClick={() => setSelectedConnector(connector.id)}
                    className={cn(
                      "w-full glass rounded-xl p-4 text-left transition-all hover:border-primary/20",
                      selectedConnector === connector.id && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0", logoColors[connector.logo])}>
                        {connector.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm">{connector.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px] border", statusColors[status])}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{connector.provider}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{connector.description}</p>
                        {status === "connected" && connector.lastSync && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Last sync: {connector.lastSync}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Connector Detail */}
            <div className="lg:col-span-8">
              {!selected ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Data Connector</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Connect to Capital IQ, FactSet, or AlphaSense to enrich your IC memos
                    with real-time financial data, comps, and market intelligence
                  </p>
                </div>
              ) : (
                <div className="glass rounded-xl overflow-hidden">
                  {/* Connector Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg", logoColors[selected.logo])}>
                          {selected.logo}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selected.name}</h3>
                          <p className="text-sm text-muted-foreground">{selected.provider}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("border", statusColors[getStatus(selected.id)])}>
                        {getStatus(selected.id)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">{selected.description}</p>
                  </div>

                  <ScrollArea className="h-[480px]">
                    <div className="p-6 space-y-6">
                      {/* Connection Setup */}
                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Key className="w-4 h-4 text-primary" />
                          Connection Configuration
                        </h4>
                        <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
                          <div>
                            <label className="text-xs font-medium mb-1 block">API Key / Access Token</label>
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                value={apiKeys[selected.id] || ""}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, [selected.id]: e.target.value }))}
                                placeholder={`Enter your ${selected.name} API key`}
                                className="flex-1"
                              />
                              {getStatus(selected.id) === "connected" ? (
                                <Button variant="outline" onClick={() => handleDisconnect(selected.id)}>
                                  Disconnect
                                </Button>
                              ) : (
                                <Button variant="glow" onClick={() => handleTestConnection(selected.id)} disabled={isTesting === selected.id}>
                                  {isTesting === selected.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Zap className="w-4 h-4 mr-2" />
                                  )}
                                  Connect
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your API key is encrypted and stored securely. Contact your {selected.provider} account manager for API access.
                            </p>
                          </div>
                          {selected.id === "capiq" && (
                            <div>
                              <label className="text-xs font-medium mb-1 block">Environment</label>
                              <div className="flex gap-3">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input type="radio" name="env" value="production" defaultChecked className="text-primary" /> Production
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input type="radio" name="env" value="sandbox" className="text-primary" /> Sandbox
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sync Settings */}
                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-primary" />
                          Sync Settings
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-medium">Auto-sync deal data</p>
                              <p className="text-xs text-muted-foreground">Automatically refresh financial data for active pipeline deals</p>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-medium">Comp table auto-update</p>
                              <p className="text-xs text-muted-foreground">Keep comparable company data current in IC memos</p>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-medium">Material event alerts</p>
                              <p className="text-xs text-muted-foreground">Notify when tracked companies have material developments</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>

                      {/* Available Data Points */}
                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          Available Data & Features
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selected.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-secondary/30 rounded-lg p-2.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Data Points */}
                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Database className="w-4 h-4 text-primary" />
                          Key Data Points for IC Workflows
                        </h4>
                        <div className="space-y-1.5">
                          {selected.dataPoints.map((dp, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                              <span>{dp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Use Cases Tab */}
        <TabsContent value="use_cases" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((uc, i) => (
              <div key={i} className="glass rounded-xl p-5 hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <uc.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{uc.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{uc.description}</p>
                <div className="flex flex-wrap gap-1">
                  {uc.connectors.map(c => (
                    <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-6 mt-6">
            <h3 className="font-semibold mb-2">Integration Architecture</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Data connectors integrate directly with your IC workflow. When connected, data automatically flows into IC memo drafts,
              deal pipeline cards, and the AI chat assistant for real-time analysis.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                <Database className="w-4 h-4 text-primary" /> Data Providers
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground self-center" />
              <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                <Server className="w-4 h-4 text-primary" /> Deal IC Advisor
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground self-center" />
              <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
                <Zap className="w-4 h-4 text-primary" /> IC Memos, AI Chat, Pipeline
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
