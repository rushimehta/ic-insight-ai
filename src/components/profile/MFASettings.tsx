import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield, 
  Smartphone, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  QrCode,
  Key,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface MFAFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
  created_at: string;
}

export function MFASettings() {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<{
    id: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<MFAFactor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      // Combine all factor types
      const allFactors = [...(data.totp || [])];
      setFactors(allFactors as MFAFactor[]);
    } catch (error) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollMFA = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setEnrollmentData({
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setShowEnrollDialog(true);
    } catch (error: any) {
      console.error("Error enrolling MFA:", error);
      toast.error(error.message || "Failed to set up MFA");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerifyEnrollment = async () => {
    if (!enrollmentData || verifyCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollmentData.id,
        code: verifyCode,
      });

      if (error) throw error;

      toast.success("MFA enabled successfully!");
      setShowEnrollDialog(false);
      setEnrollmentData(null);
      setVerifyCode("");
      fetchFactors();
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteFactor = async () => {
    if (!factorToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorToDelete.id,
      });

      if (error) throw error;

      toast.success("MFA factor removed");
      setFactorToDelete(null);
      fetchFactors();
    } catch (error: any) {
      console.error("Error deleting MFA factor:", error);
      toast.error(error.message || "Failed to remove MFA factor");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelEnrollment = async () => {
    if (enrollmentData) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrollmentData.id });
      } catch (error) {
        console.error("Error canceling enrollment:", error);
      }
    }
    setShowEnrollDialog(false);
    setEnrollmentData(null);
    setVerifyCode("");
  };

  const verifiedFactors = factors.filter(f => f.status === "verified");
  const hasMFAEnabled = verifiedFactors.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="mt-1">
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            {hasMFAEnabled ? (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                Not Enabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasMFAEnabled ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your account is not protected by two-factor authentication. We strongly recommend enabling it.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Enrolled Factors */}
          {verifiedFactors.length > 0 && (
            <div className="space-y-3">
              <Label>Enrolled Authenticators</Label>
              {verifiedFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{factor.friendly_name || "Authenticator App"}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setFactorToDelete(factor)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add MFA Button */}
          {!hasMFAEnabled && (
            <Button onClick={handleEnrollMFA} disabled={isEnrolling} className="w-full">
              {isEnrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Set up Authenticator App
                </>
              )}
            </Button>
          )}

          {hasMFAEnabled && (
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is enabled. You'll be asked for a verification code when signing in.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => !open && cancelEnrollment()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Set Up Authenticator
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          {enrollmentData && (
            <div className="space-y-6 py-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img
                    src={enrollmentData.qr}
                    alt="MFA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Or enter this code manually:
                </Label>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <code className="flex-1 p-2 bg-secondary rounded text-xs font-mono break-all">
                    {enrollmentData.secret}
                  </code>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-3">
                <Label>Enter the 6-digit code from your app</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verifyCode}
                    onChange={setVerifyCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelEnrollment}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyEnrollment}
              disabled={verifyCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Enable"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!factorToDelete} onOpenChange={() => setFactorToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Remove Authenticator
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this authenticator? This will disable two-factor authentication for your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFactorToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFactor}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
