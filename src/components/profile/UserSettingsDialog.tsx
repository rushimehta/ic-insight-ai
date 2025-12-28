import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "./ProfileSettings";
import { MFASettings } from "./MFASettings";
import { PasswordChangeSettings } from "./PasswordChangeSettings";
import { SessionManagement } from "./SessionManagement";
import { User, Shield, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const [hasMFA, setHasMFA] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      checkMFAStatus();
    }
  }, [open]);

  const checkMFAStatus = async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = data?.totp?.filter(f => f.status === "verified") || [];
      setHasMFA(verifiedFactors.length > 0);
    } catch (error) {
      console.error("Error checking MFA status:", error);
      setHasMFA(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Account Settings
          </DialogTitle>
        </DialogHeader>

        {hasMFA === false && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is required. Please enable MFA in the Security tab to continue using the platform securely.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-6">
            <PasswordChangeSettings />
            <SessionManagement />
            <MFASettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
