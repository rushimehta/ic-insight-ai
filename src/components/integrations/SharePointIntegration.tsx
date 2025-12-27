import { useState, useEffect } from "react";
import { Cloud, FolderSync, Check, AlertCircle, Loader2, Link2, Unlink, Settings, FileText, RefreshCw, History, ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SharePointSite {
  id: string;
  name: string;
  url: string;
  lastSynced?: string;
}

interface SharePointFolder {
  id: string;
  name: string;
  path: string;
  itemCount: number;
}

interface SyncLog {
  id: string;
  sync_type: string;
  source: string;
  status: string;
  files_synced: number;
  files_failed: number;
  total_size_bytes: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

interface SyncFileDetail {
  id: string;
  sync_log_id: string;
  filename: string;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  status: string;
  error_message: string | null;
}

export function SharePointIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tenantUrl, setTenantUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [selectedSite, setSelectedSite] = useState<SharePointSite | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState("daily");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("connection");
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<Record<string, SyncFileDetail[]>>({});

  // Mock data for demo
  const mockSites: SharePointSite[] = [
    { id: "1", name: "Investment Committee", url: "https://company.sharepoint.com/sites/ic", lastSynced: "2024-03-15T10:30:00Z" },
    { id: "2", name: "Deal Documents", url: "https://company.sharepoint.com/sites/deals", lastSynced: "2024-03-14T15:45:00Z" },
    { id: "3", name: "Legal Repository", url: "https://company.sharepoint.com/sites/legal" },
  ];

  const mockFolders: SharePointFolder[] = [
    { id: "1", name: "2024 Deals", path: "/Shared Documents/2024 Deals", itemCount: 45 },
    { id: "2", name: "IC Memos", path: "/Shared Documents/IC Memos", itemCount: 128 },
    { id: "3", name: "Due Diligence", path: "/Shared Documents/Due Diligence", itemCount: 67 },
    { id: "4", name: "Term Sheets", path: "/Shared Documents/Term Sheets", itemCount: 23 },
  ];

  // Mock sync logs for demo (used when no real data exists)
  const mockSyncLogs: SyncLog[] = [
    {
      id: "mock-1",
      sync_type: "manual",
      source: "sharepoint",
      status: "completed",
      files_synced: 15,
      files_failed: 0,
      total_size_bytes: 45000000,
      error_message: null,
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
      metadata: { site: "Investment Committee" }
    },
    {
      id: "mock-2",
      sync_type: "scheduled",
      source: "sharepoint",
      status: "completed",
      files_synced: 8,
      files_failed: 1,
      total_size_bytes: 23000000,
      error_message: null,
      started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 32000).toISOString(),
      metadata: { site: "Deal Documents" }
    },
    {
      id: "mock-3",
      sync_type: "manual",
      source: "sharepoint",
      status: "failed",
      files_synced: 0,
      files_failed: 12,
      total_size_bytes: 0,
      error_message: "Authentication token expired. Please reconnect.",
      started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5000).toISOString(),
      metadata: { site: "Legal Repository" }
    },
    {
      id: "mock-4",
      sync_type: "scheduled",
      source: "sharepoint",
      status: "completed",
      files_synced: 23,
      files_failed: 2,
      total_size_bytes: 67000000,
      error_message: null,
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
      metadata: { site: "Investment Committee" }
    },
  ];

  const mockFileDetails: Record<string, SyncFileDetail[]> = {
    "mock-1": [
      { id: "f1", sync_log_id: "mock-1", filename: "Q4_2024_TechCorp_IC_Memo.pdf", file_path: "/2024/Technology/TechCorp", file_size: 2500000, file_type: "pdf", status: "synced", error_message: null },
      { id: "f2", sync_log_id: "mock-1", filename: "Financial_Model_v3.xlsx", file_path: "/2024/Technology/TechCorp", file_size: 1800000, file_type: "xlsx", status: "synced", error_message: null },
      { id: "f3", sync_log_id: "mock-1", filename: "Management_Presentation.pptx", file_path: "/2024/Technology/TechCorp", file_size: 5200000, file_type: "pptx", status: "synced", error_message: null },
    ],
    "mock-2": [
      { id: "f4", sync_log_id: "mock-2", filename: "HealthCo_DD_Summary.pdf", file_path: "/2024/Healthcare/HealthCo", file_size: 3100000, file_type: "pdf", status: "synced", error_message: null },
      { id: "f5", sync_log_id: "mock-2", filename: "Corrupted_File.docx", file_path: "/2024/Healthcare/HealthCo", file_size: 0, file_type: "docx", status: "failed", error_message: "File corrupted during transfer" },
    ],
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchSyncLogs();
    }
  }, [activeTab]);

  const fetchSyncLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("document_sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // If no real data, use mock data for demo
      if (!data || data.length === 0) {
        setSyncLogs(mockSyncLogs);
      } else {
        setSyncLogs(data as SyncLog[]);
      }
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      // Use mock data on error
      setSyncLogs(mockSyncLogs);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchFileDetails = async (logId: string) => {
    if (fileDetails[logId]) return;

    // Check if it's a mock log
    if (logId.startsWith("mock-")) {
      setFileDetails(prev => ({ ...prev, [logId]: mockFileDetails[logId] || [] }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from("sync_file_details")
        .select("*")
        .eq("sync_log_id", logId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFileDetails(prev => ({ ...prev, [logId]: (data as SyncFileDetail[]) || [] }));
    } catch (error) {
      console.error("Error fetching file details:", error);
    }
  };

  const toggleLogExpansion = (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(logId);
      fetchFileDetails(logId);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const handleConnect = async () => {
    if (!tenantUrl.trim()) {
      toast.error("Please enter your SharePoint tenant URL");
      return;
    }

    setIsConnecting(true);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsConnected(true);
    setIsConnecting(false);
    setShowConfigDialog(false);
    toast.success("Successfully connected to SharePoint");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedSite(null);
    setSyncEnabled(false);
    setTenantUrl("");
    setClientId("");
    setClientSecret("");
    toast.success("Disconnected from SharePoint");
  };

  const handleSync = async () => {
    if (!selectedSite) {
      toast.error("Please select a SharePoint site to sync");
      return;
    }

    setIsSyncing(true);
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsSyncing(false);
    const syncedCount = Math.floor(Math.random() * 20) + 5;
    toast.success(`Synced ${syncedCount} documents from ${selectedSite.name}`);
    
    // Refresh logs after sync
    if (activeTab === "history") {
      fetchSyncLogs();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
          <Cloud className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">SharePoint Integration</h2>
          <p className="text-muted-foreground">
            Sync documents from your Microsoft SharePoint
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Sync History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6 mt-6">
          {/* Connection Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Connection Status
                  </CardTitle>
                  <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500/20 text-green-600" : ""}>
                    {isConnected ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </>
                    )}
                  </Badge>
                </div>
                {isConnected && (
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                )}
              </div>
              <CardDescription>
                {isConnected 
                  ? `Connected to ${tenantUrl || "your SharePoint tenant"}`
                  : "Connect to your Microsoft SharePoint to sync documents"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Cloud className="w-4 h-4 mr-2" />
                      Connect to SharePoint
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-blue-500" />
                        Connect to SharePoint
                      </DialogTitle>
                      <DialogDescription>
                        Enter your SharePoint configuration to enable document sync
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="tenant-url">Tenant URL *</Label>
                        <Input
                          id="tenant-url"
                          placeholder="https://yourcompany.sharepoint.com"
                          value={tenantUrl}
                          onChange={(e) => setTenantUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your SharePoint tenant URL
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="client-id">Client ID (Optional)</Label>
                        <Input
                          id="client-id"
                          placeholder="Azure AD App Client ID"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="client-secret">Client Secret (Optional)</Label>
                        <Input
                          id="client-secret"
                          type="password"
                          placeholder="Azure AD App Client Secret"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                        />
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          <strong>Note:</strong> You'll be redirected to Microsoft to authorize access to your SharePoint sites.
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleConnect} disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="space-y-4">
                  {/* Site Selection */}
                  <div className="space-y-2">
                    <Label>Select SharePoint Site</Label>
                    <Select 
                      value={selectedSite?.id || ""} 
                      onValueChange={(id) => setSelectedSite(mockSites.find(s => s.id === id) || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a site to sync from" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSites.map(site => (
                          <SelectItem key={site.id} value={site.id}>
                            <div className="flex items-center gap-2">
                              <Cloud className="w-4 h-4" />
                              {site.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSite && (
                    <>
                      {/* Available Folders */}
                      <div className="space-y-2">
                        <Label>Available Folders</Label>
                        <ScrollArea className="h-[200px] border rounded-lg">
                          <div className="p-2 space-y-1">
                            {mockFolders.map(folder => (
                              <div 
                                key={folder.id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">{folder.name}</p>
                                    <p className="text-xs text-muted-foreground">{folder.path}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {folder.itemCount} items
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Sync Settings */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FolderSync className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Auto-Sync</p>
                            <p className="text-sm text-muted-foreground">
                              Automatically sync new documents
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Select 
                            value={syncFrequency} 
                            onValueChange={setSyncFrequency}
                            disabled={!syncEnabled}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                          <Switch
                            checked={syncEnabled}
                            onCheckedChange={setSyncEnabled}
                          />
                        </div>
                      </div>

                      {/* Sync Button */}
                      <div className="flex items-center gap-3">
                        <Button onClick={handleSync} disabled={isSyncing} className="flex-1">
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Syncing Documents...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Sync Now
                            </>
                          )}
                        </Button>
                        <Button variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </div>

                      {selectedSite.lastSynced && (
                        <p className="text-xs text-muted-foreground text-center">
                          Last synced: {new Date(selectedSite.lastSynced).toLocaleString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Connect</p>
                    <p className="text-sm text-muted-foreground">
                      Authorize access to your SharePoint tenant
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Select</p>
                    <p className="text-sm text-muted-foreground">
                      Choose sites and folders to sync
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Documents are imported and indexed automatically
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          {/* Sync History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Sync History
                  </CardTitle>
                  <CardDescription>
                    View the history of document synchronizations
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchSyncLogs} disabled={isLoadingLogs}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : syncLogs.length === 0 ? (
                <div className="text-center py-12">
                  <DownloadCloud className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No sync history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start syncing documents to see history here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <Collapsible
                      key={log.id}
                      open={expandedLogId === log.id}
                      onOpenChange={() => toggleLogExpansion(log.id)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {expandedLogId === log.id ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                {getStatusBadge(log.status)}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">
                                  {log.sync_type === "scheduled" ? "Scheduled Sync" : "Manual Sync"}
                                  {log.metadata && typeof log.metadata === 'object' && 'site' in log.metadata && (
                                    <span className="text-muted-foreground font-normal ml-2">
                                      from {String(log.metadata.site)}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(log.started_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-right">
                                <p className="font-medium text-green-600">{log.files_synced} synced</p>
                                {log.files_failed > 0 && (
                                  <p className="text-xs text-destructive">{log.files_failed} failed</p>
                                )}
                              </div>
                              <div className="text-right text-muted-foreground">
                                <p>{formatFileSize(log.total_size_bytes || 0)}</p>
                                {log.completed_at && (
                                  <p className="text-xs">
                                    {Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t bg-secondary/20 p-4">
                            {log.error_message && (
                              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm text-destructive font-medium">Error</p>
                                <p className="text-sm text-destructive/80">{log.error_message}</p>
                              </div>
                            )}

                            {fileDetails[log.id] && fileDetails[log.id].length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-sm font-medium mb-3">Files Synced</p>
                                <ScrollArea className="h-[200px]">
                                  <div className="space-y-2 pr-4">
                                    {fileDetails[log.id].map((file) => (
                                      <div
                                        key={file.id}
                                        className="flex items-center justify-between p-2 bg-background rounded-lg border"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{file.filename}</p>
                                            {file.file_path && (
                                              <p className="text-xs text-muted-foreground truncate">{file.file_path}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          {file.file_size && (
                                            <span className="text-xs text-muted-foreground">
                                              {formatFileSize(file.file_size)}
                                            </span>
                                          )}
                                          {file.status === "synced" ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                          ) : file.status === "failed" ? (
                                            <XCircle className="w-4 h-4 text-destructive" />
                                          ) : (
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No file details available
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
