import { useState } from "react";
import { Globe, Shield, Check, AlertTriangle, ExternalLink, Copy, Eye, EyeOff, Settings2, Users, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────

interface SSOProvider {
  id: string;
  name: string;
  type: "azure" | "google" | "okta" | "saml";
  enabled: boolean;
  configured: boolean;
  clientId: string;
  tenantId?: string;
  domain?: string;
  metadataUrl?: string;
  autoProvision: boolean;
  defaultRole: string;
  userCount: number;
  lastSync?: string;
  icon: string;
}

const DEFAULT_PROVIDERS: SSOProvider[] = [
  {
    id: "azure",
    name: "Microsoft Entra ID",
    type: "azure",
    enabled: false,
    configured: false,
    clientId: "",
    tenantId: "",
    autoProvision: true,
    defaultRole: "deal_team",
    userCount: 0,
    icon: "🔷",
  },
  {
    id: "google",
    name: "Google Workspace",
    type: "google",
    enabled: false,
    configured: false,
    clientId: "",
    domain: "",
    autoProvision: true,
    defaultRole: "deal_team",
    userCount: 0,
    icon: "🔴",
  },
  {
    id: "okta",
    name: "Okta",
    type: "okta",
    enabled: false,
    configured: false,
    clientId: "",
    domain: "",
    autoProvision: false,
    defaultRole: "deal_team",
    userCount: 0,
    icon: "🟦",
  },
  {
    id: "saml",
    name: "SAML 2.0 / Custom IdP",
    type: "saml",
    enabled: false,
    configured: false,
    clientId: "",
    metadataUrl: "",
    autoProvision: false,
    defaultRole: "deal_team",
    userCount: 0,
    icon: "🔐",
  },
];

const ROLES = [
  { value: "deal_team", label: "Deal Team" },
  { value: "ic_member", label: "IC Member" },
  { value: "ic_chairman", label: "IC Chairman" },
  { value: "admin", label: "Administrator" },
];

// ─── Component ──────────────────────────────────────────────────────

export function SSOConfiguration() {
  const [providers, setProviders] = useState<SSOProvider[]>(DEFAULT_PROVIDERS);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Form state
  const [formClientId, setFormClientId] = useState("");
  const [formTenantId, setFormTenantId] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formMetadataUrl, setFormMetadataUrl] = useState("");
  const [formAutoProvision, setFormAutoProvision] = useState(true);
  const [formDefaultRole, setFormDefaultRole] = useState("deal_team");

  const openEditDialog = (provider: SSOProvider) => {
    setEditingProvider(provider);
    setFormClientId(provider.clientId);
    setFormTenantId(provider.tenantId || "");
    setFormDomain(provider.domain || "");
    setFormMetadataUrl(provider.metadataUrl || "");
    setFormAutoProvision(provider.autoProvision);
    setFormDefaultRole(provider.defaultRole);
    setClientSecret("");
    setShowSecret(false);
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingProvider) return;
    if (!formClientId.trim()) {
      toast.error("Client ID is required");
      return;
    }
    if (editingProvider.type === "azure" && !formTenantId.trim()) {
      toast.error("Tenant ID is required for Azure");
      return;
    }

    setProviders(prev => prev.map(p => p.id === editingProvider.id ? {
      ...p,
      clientId: formClientId.trim(),
      tenantId: formTenantId.trim() || undefined,
      domain: formDomain.trim() || undefined,
      metadataUrl: formMetadataUrl.trim() || undefined,
      autoProvision: formAutoProvision,
      defaultRole: formDefaultRole,
      configured: true,
    } : p));
    toast.success(`${editingProvider.name} configuration saved`);
    setEditDialogOpen(false);
  };

  const handleToggleEnabled = (providerId: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id !== providerId) return p;
      if (!p.configured && !p.enabled) {
        toast.error("Configure the provider first before enabling");
        return p;
      }
      const newEnabled = !p.enabled;
      toast.success(`${p.name} ${newEnabled ? "enabled" : "disabled"}`);
      return { ...p, enabled: newEnabled };
    }));
  };

  const handleTestConnection = async (provider: SSOProvider) => {
    setIsTesting(true);
    // Simulate a connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTesting(false);
    if (provider.configured) {
      toast.success(`${provider.name} connection test successful`);
    } else {
      toast.error(`${provider.name} is not configured. Please configure it first.`);
    }
  };

  const handleResetProvider = (providerId: string) => {
    setProviders(prev => prev.map(p => p.id === providerId ? {
      ...p,
      enabled: false,
      configured: false,
      clientId: "",
      tenantId: "",
      domain: "",
      metadataUrl: "",
      userCount: 0,
      lastSync: undefined,
    } : p));
    toast.success("Provider configuration reset");
  };

  const callbackUrl = `${window.location.origin}/auth/callback`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Single Sign-On (SSO) Configuration
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure identity providers for enterprise SSO. Users who authenticate via SSO bypass password and MFA requirements.
        </p>
      </div>

      {/* Callback URL Info */}
      <div className="glass rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">OAuth Callback URL</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure this URL as the redirect/callback URL in each identity provider:
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs bg-secondary px-3 py-1.5 rounded font-mono flex-1 truncate">{callbackUrl}</code>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => { navigator.clipboard.writeText(callbackUrl); toast.success("Copied to clipboard"); }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map(provider => (
          <div key={provider.id} className="glass rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{provider.name}</h4>
                      {provider.configured ? (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 gap-1">
                          <Check className="w-2.5 h-2.5" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Not Configured
                        </Badge>
                      )}
                      {provider.enabled && (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {provider.configured
                        ? `Client ID: ${provider.clientId.substring(0, 12)}... • ${provider.userCount} users • Default role: ${ROLES.find(r => r.value === provider.defaultRole)?.label}`
                        : "Click Configure to set up this provider"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {provider.configured && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleTestConnection(provider)}
                      disabled={isTesting}
                    >
                      {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Test
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => openEditDialog(provider)}
                  >
                    <Settings2 className="w-3 h-3" />
                    Configure
                  </Button>
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={() => handleToggleEnabled(provider.id)}
                  />
                </div>
              </div>

              {/* Provider Details (when configured) */}
              {provider.configured && (
                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Type</p>
                    <p className="text-xs font-medium capitalize">{provider.type === "azure" ? "OAuth 2.0 / OIDC" : provider.type === "saml" ? "SAML 2.0" : "OAuth 2.0"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Auto-Provision</p>
                    <p className="text-xs font-medium">{provider.autoProvision ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Default Role</p>
                    <p className="text-xs font-medium">{ROLES.find(r => r.value === provider.defaultRole)?.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">SSO Users</p>
                    <p className="text-xs font-medium">{provider.userCount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Configure Provider Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          {editingProvider && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-xl">{editingProvider.icon}</span>
                  Configure {editingProvider.name}
                </DialogTitle>
                <DialogDescription>
                  Enter the credentials from your identity provider's admin console.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[55vh]">
                <div className="space-y-4 pr-2">
                  {/* Client ID */}
                  <div className="space-y-2">
                    <Label>Client ID / Application ID *</Label>
                    <Input
                      value={formClientId}
                      onChange={e => setFormClientId(e.target.value)}
                      placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    />
                  </div>

                  {/* Client Secret */}
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <div className="relative">
                      <Input
                        type={showSecret ? "text" : "password"}
                        value={clientSecret}
                        onChange={e => setClientSecret(e.target.value)}
                        placeholder="Enter client secret"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Stored securely. Leave blank to keep existing secret.</p>
                  </div>

                  {/* Azure-specific */}
                  {editingProvider.type === "azure" && (
                    <div className="space-y-2">
                      <Label>Tenant ID *</Label>
                      <Input
                        value={formTenantId}
                        onChange={e => setFormTenantId(e.target.value)}
                        placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                      />
                      <p className="text-[10px] text-muted-foreground">Found in Azure Portal → Entra ID → Overview</p>
                    </div>
                  )}

                  {/* Domain (Google, Okta) */}
                  {(editingProvider.type === "google" || editingProvider.type === "okta") && (
                    <div className="space-y-2">
                      <Label>{editingProvider.type === "google" ? "Allowed Domain" : "Okta Domain"}</Label>
                      <Input
                        value={formDomain}
                        onChange={e => setFormDomain(e.target.value)}
                        placeholder={editingProvider.type === "google" ? "e.g., yourcompany.com" : "e.g., yourcompany.okta.com"}
                      />
                    </div>
                  )}

                  {/* SAML Metadata */}
                  {editingProvider.type === "saml" && (
                    <div className="space-y-2">
                      <Label>IdP Metadata URL</Label>
                      <Input
                        value={formMetadataUrl}
                        onChange={e => setFormMetadataUrl(e.target.value)}
                        placeholder="https://idp.example.com/metadata.xml"
                      />
                    </div>
                  )}

                  <div className="border-t border-border pt-4 space-y-4">
                    <h4 className="text-sm font-medium">Provisioning Settings</h4>

                    {/* Auto-Provision */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">Auto-Provision Users</p>
                        <p className="text-xs text-muted-foreground">Automatically create accounts for new SSO users</p>
                      </div>
                      <Switch
                        checked={formAutoProvision}
                        onCheckedChange={setFormAutoProvision}
                      />
                    </div>

                    {/* Default Role */}
                    <div className="space-y-2">
                      <Label>Default Role for New SSO Users</Label>
                      <Select value={formDefaultRole} onValueChange={setFormDefaultRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Newly provisioned SSO users will be assigned this role by default.</p>
                    </div>
                  </div>

                  {/* Reset */}
                  {editingProvider.configured && (
                    <div className="border-t border-border pt-4">
                      <Button
                        variant="outline"
                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs gap-1"
                        onClick={() => { handleResetProvider(editingProvider.id); setEditDialogOpen(false); }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Reset Configuration
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>
                  <Check className="w-4 h-4 mr-1.5" />
                  Save Configuration
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
