import { useState } from "react";
import { Cloud, FolderSync, Check, AlertCircle, Loader2, Link2, Unlink, Settings, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

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
    toast.success(`Synced ${Math.floor(Math.random() * 20) + 5} documents from ${selectedSite.name}`);
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
    </div>
  );
}
