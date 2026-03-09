import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Shield, Building2, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SSOProvider {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  provider: "azure" | "google" | "okta" | "saml";
  color: string;
  enterprise: boolean;
}

const ssoProviders: SSOProvider[] = [
  {
    id: "azure",
    name: "Microsoft Entra ID",
    icon: Building2,
    description: "Sign in with your corporate Microsoft account",
    provider: "azure",
    color: "bg-[#0078D4]/10 text-[#0078D4] border-[#0078D4]/20 hover:bg-[#0078D4]/20",
    enterprise: true,
  },
  {
    id: "google",
    name: "Google Workspace",
    icon: Globe,
    description: "Sign in with your Google Workspace account",
    provider: "google",
    color: "bg-[#4285F4]/10 text-[#4285F4] border-[#4285F4]/20 hover:bg-[#4285F4]/20",
    enterprise: true,
  },
  {
    id: "okta",
    name: "Okta",
    icon: Shield,
    description: "Sign in through your Okta identity provider",
    provider: "okta",
    color: "bg-[#007DC1]/10 text-[#007DC1] border-[#007DC1]/20 hover:bg-[#007DC1]/20",
    enterprise: true,
  },
  {
    id: "saml",
    name: "SAML 2.0 / Custom IdP",
    icon: Lock,
    description: "Sign in through your organization's SAML identity provider",
    provider: "saml",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
    enterprise: true,
  },
];

interface SSOLoginProps {
  onBack?: () => void;
}

export function SSOLogin({ onBack }: SSOLoginProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSSOLogin = async (provider: SSOProvider) => {
    setLoadingProvider(provider.id);

    try {
      if (provider.provider === "azure") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "azure",
          options: {
            scopes: "email profile openid",
            redirectTo: `${window.location.origin}/`,
            queryParams: {
              prompt: "select_account",
            },
          },
        });
        if (error) throw error;
      } else if (provider.provider === "google") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            scopes: "email profile",
            redirectTo: `${window.location.origin}/`,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });
        if (error) throw error;
      } else if (provider.provider === "okta" || provider.provider === "saml") {
        // For Okta and SAML, use SSO with domain-based routing
        // This would typically be configured at the Supabase project level
        toast.info(
          "Enterprise SSO requires configuration. Contact your administrator to set up " +
          `${provider.name} integration with your Supabase project.`
        );
        setLoadingProvider(null);
        return;
      }
    } catch (error: any) {
      console.error("SSO login error:", error);
      toast.error(error.message || `Failed to sign in with ${provider.name}`);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-sm font-semibold">Enterprise Single Sign-On</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Sign in with your organization's identity provider
        </p>
      </div>

      <div className="space-y-2">
        {ssoProviders.map(provider => (
          <button
            key={provider.id}
            onClick={() => handleSSOLogin(provider)}
            disabled={loadingProvider !== null}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
              provider.color,
              loadingProvider === provider.id && "opacity-70",
              loadingProvider !== null && loadingProvider !== provider.id && "opacity-50"
            )}
          >
            {loadingProvider === provider.id ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            ) : (
              <provider.icon className="w-5 h-5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{provider.name}</span>
                {provider.enterprise && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 border-current/20">
                    Enterprise
                  </Badge>
                )}
              </div>
              <p className="text-[11px] opacity-70">{provider.description}</p>
            </div>
          </button>
        ))}
      </div>

      {onBack && (
        <Button variant="ghost" className="w-full text-xs" onClick={onBack}>
          Back to email sign in
        </Button>
      )}

      <p className="text-[10px] text-center text-muted-foreground">
        SSO users are automatically provisioned with appropriate roles based on your organization's directory groups.
        MFA is managed by your identity provider.
      </p>
    </div>
  );
}
