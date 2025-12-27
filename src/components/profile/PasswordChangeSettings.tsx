import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function PasswordChangeSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const handleChangePassword = async () => {
    // Validate inputs
    const result = passwordSchema.safeParse({ newPassword, confirmPassword });
    
    if (!result.success) {
      const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "newPassword") {
          fieldErrors.newPassword = err.message;
        } else if (err.path[0] === "confirmPassword") {
          fieldErrors.confirmPassword = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsChanging(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChanging(false);
    }
  };

  const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
    if (!password) return { label: "", color: "", width: "0%" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-destructive", width: "33%" };
    if (score <= 4) return { label: "Medium", color: "bg-yellow-500", width: "66%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors(prev => ({ ...prev, newPassword: undefined }));
              }}
              placeholder="Enter new password"
              className={`pl-9 pr-10 ${errors.newPassword ? "border-destructive" : ""}`}
              maxLength={72}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
          
          {/* Password strength indicator */}
          {newPassword && (
            <div className="space-y-1">
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className={strength.label === "Strong" ? "text-green-500" : strength.label === "Medium" ? "text-yellow-500" : "text-destructive"}>{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors(prev => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Confirm new password"
              className={`pl-9 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
              maxLength={72}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Password requirements:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li className={newPassword.length >= 8 ? "text-green-500" : ""}>At least 8 characters</li>
            <li className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>One uppercase letter</li>
            <li className={/[a-z]/.test(newPassword) ? "text-green-500" : ""}>One lowercase letter</li>
            <li className={/[0-9]/.test(newPassword) ? "text-green-500" : ""}>One number</li>
          </ul>
        </div>

        <Button 
          onClick={handleChangePassword} 
          disabled={isChanging || !newPassword || !confirmPassword}
          className="w-full"
        >
          {isChanging ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
