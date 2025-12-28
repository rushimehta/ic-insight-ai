import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Monitor, Smartphone, Loader2, LogOut, Globe, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SessionInfo {
  id: string;
  isCurrent: boolean;
  lastActiveAt: Date;
  deviceInfo: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

export function SessionManagement() {
  const { user, session, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  // Note: Supabase doesn't expose all active sessions via client API
  // This shows the current session and provides sign out all option
  const currentSession: SessionInfo | null = session ? {
    id: session.access_token.slice(-8),
    isCurrent: true,
    lastActiveAt: new Date(),
    deviceInfo: getBrowserInfo(),
  } : null;

  const handleSignOutAll = async () => {
    setIsSigningOutAll(true);
    try {
      // Sign out from all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;
      
      toast.success("Signed out from all devices");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(error.message || "Failed to sign out from all devices");
    } finally {
      setIsSigningOutAll(false);
    }
  };

  const handleSignOutCurrent = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active login sessions across devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        {currentSession && (
          <div className="p-4 bg-secondary/50 rounded-lg border border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {currentSession.deviceInfo.device === 'mobile' ? (
                    <Smartphone className="w-5 h-5 text-primary" />
                  ) : (
                    <Monitor className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {currentSession.deviceInfo.browser} on {currentSession.deviceInfo.os}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Current Session
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Active now</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOutCurrent}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="font-medium text-sm">Security Tip</p>
              <p className="text-sm text-muted-foreground mt-1">
                If you notice any suspicious activity or don't recognize a session, 
                sign out from all devices immediately and change your password.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out All */}
        <div className="pt-4 border-t border-border">
          <Button 
            variant="destructive" 
            onClick={handleSignOutAll}
            disabled={isSigningOutAll}
            className="w-full"
          >
            {isSigningOutAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out from All Devices
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            This will sign you out from all devices including this one
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getBrowserInfo(): { browser: string; os: string; device: string } {
  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = "Unknown Browser";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Opera")) browser = "Opera";

  // Detect OS
  let os = "Unknown OS";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone")) os = "iOS";

  // Detect device type
  const device = /Mobi|Android|iPhone|iPad/i.test(userAgent) ? "mobile" : "desktop";

  return { browser, os, device };
}
