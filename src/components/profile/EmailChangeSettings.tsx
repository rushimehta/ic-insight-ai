import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export function EmailChangeSettings() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter a new email address");
      return;
    }

    if (newEmail === user?.email) {
      toast.error("New email must be different from current email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Verification email sent to your new address");
    } catch (error: any) {
      console.error("Error changing email:", error);
      toast.error(error.message || "Failed to change email");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Verification Email Sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We've sent a verification email to <strong>{newEmail}</strong>. 
            Please click the link in the email to confirm your new address.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your email won't change until you verify the new address.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setEmailSent(false);
              setNewEmail("");
            }}
          >
            Change to Different Email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Change Email
        </CardTitle>
        <CardDescription>
          Update your email address. You'll need to verify the new address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Email</Label>
          <Input value={user?.email || ""} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newEmail">New Email</Label>
          <Input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="newemail@example.com"
          />
        </div>
        <Button onClick={handleEmailChange} disabled={isSubmitting || !newEmail.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending Verification...
            </>
          ) : (
            "Send Verification Email"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
