import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, ArrowRight, Shield, KeyRound, Building2 } from "lucide-react";
import { z } from "zod";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SSOLogin } from "@/components/auth/SSOLogin";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // MFA state
  const [showMFA, setShowMFA] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifyingMFA, setIsVerifyingMFA] = useState(false);
  
  // SSO state
  const [showSSO, setShowSSO] = useState(false);

  // MFA enrollment state (for new account activation)
  const [showMFAEnrollment, setShowMFAEnrollment] = useState(false);
  const [mfaQRCode, setMfaQRCode] = useState<string>("");
  const [mfaSecret, setMfaSecret] = useState<string>("");
  const [enrollFactorId, setEnrollFactorId] = useState<string>("");
  const [enrollCode, setEnrollCode] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (!showForgotPassword) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      setResetEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);

        if (error) {
          // Check if MFA is required
          if (error.message.includes("MFA") || error.message.includes("mfa")) {
            // Need to handle MFA challenge
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            const verifiedFactors = factorsData?.totp?.filter(f => f.status === "verified") || [];

            if (verifiedFactors.length > 0) {
              const factorId = verifiedFactors[0].id;
              const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId,
              });

              if (challengeError) throw challengeError;

              setMfaFactorId(factorId);
              setMfaChallengeId(challengeData.id);
              setShowMFA(true);
              setIsLoading(false);
              return;
            }
          }

          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          // Check if user has MFA enrolled - if AAL is 1, they might need to verify
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          
          if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
            // User has MFA but needs to verify
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            const verifiedFactors = factorsData?.totp?.filter(f => f.status === "verified") || [];
            
            if (verifiedFactors.length > 0) {
              const factorId = verifiedFactors[0].id;
              const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId,
              });
              
              if (challengeError) throw challengeError;
              
              setMfaFactorId(factorId);
              setMfaChallengeId(challengeData.id);
              setShowMFA(true);
              setIsLoading(false);
              return;
            }
          }
          
          toast.success("Welcome back!");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          // Enforce MFA enrollment for new non-SSO accounts
          try {
            const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
              factorType: "totp",
              friendlyName: "Authenticator App",
            });

            if (enrollError) {
              console.error("MFA enrollment error:", enrollError);
              toast.success("Account created! You can set up MFA later in settings.");
              navigate("/");
            } else if (enrollData) {
              setMfaQRCode(enrollData.totp.qr_code);
              setMfaSecret(enrollData.totp.secret);
              setEnrollFactorId(enrollData.id);
              setShowMFAEnrollment(true);
              setIsLoading(false);
              return;
            }
          } catch {
            toast.success("Account created successfully!");
            navigate("/");
          }
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerify = async () => {
    if (!mfaFactorId || !mfaChallengeId || mfaCode.length !== 6) return;

    setIsVerifyingMFA(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      console.error("MFA verification error:", error);
      toast.error(error.message || "Invalid verification code");
      setMfaCode("");
      
      // Create a new challenge if verification failed
      try {
        const { data: challengeData } = await supabase.auth.mfa.challenge({
          factorId: mfaFactorId,
        });
        if (challengeData) {
          setMfaChallengeId(challengeData.id);
        }
      } catch (e) {
        console.error("Failed to create new challenge:", e);
      }
    } finally {
      setIsVerifyingMFA(false);
    }
  };

  const handleMFAEnrollVerify = async () => {
    if (enrollCode.length !== 6) return;
    setIsEnrolling(true);

    try {
      // Challenge the newly enrolled factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollFactorId,
      });
      if (challengeError) throw challengeError;

      // Verify with the user's code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challengeData.id,
        code: enrollCode,
      });
      if (verifyError) throw verifyError;

      toast.success("MFA enabled successfully! Your account is now secured.");
      navigate("/");
    } catch (error: any) {
      console.error("MFA enrollment verification error:", error);
      toast.error(error.message || "Invalid code. Please try again.");
      setEnrollCode("");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSkipMFA = () => {
    toast.info("You can set up MFA later in Settings > Security.");
    navigate("/");
  };

  const handleBackFromMFA = async () => {
    await supabase.auth.signOut();
    setShowMFA(false);
    setMfaFactorId(null);
    setMfaChallengeId(null);
    setMfaCode("");
  };

  // MFA enrollment screen (after signup)
  if (showMFAEnrollment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 opacity-0 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Secure Your Account</h1>
            <p className="text-muted-foreground mt-2">
              Set up two-factor authentication to protect your account
            </p>
          </div>

          <div className="glass rounded-2xl p-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, or Microsoft Authenticator)
                </p>
                {mfaQRCode && (
                  <div className="flex justify-center mb-4">
                    <img src={mfaQRCode} alt="MFA QR Code" className="w-48 h-48 rounded-lg border border-border" />
                  </div>
                )}
                {mfaSecret && (
                  <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                    <p className="text-[10px] text-muted-foreground mb-1">Or enter this key manually:</p>
                    <code className="text-xs font-mono select-all">{mfaSecret}</code>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-center mb-3">Enter the 6-digit verification code</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={enrollCode} onChange={setEnrollCode}>
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

              <Button
                onClick={handleMFAEnrollVerify}
                variant="glow"
                className="w-full"
                disabled={enrollCode.length !== 6 || isEnrolling}
              >
                {isEnrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Enable Two-Factor Authentication
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button variant="ghost" className="w-full text-xs" onClick={handleSkipMFA}>
                Skip for now (not recommended)
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-4">
            MFA is required for all non-SSO accounts to comply with security policy
          </p>
        </div>
      </div>
    );
  }

  // Forgot password screen
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 opacity-0 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 shadow-glow">
              <KeyRound className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground mt-2">
              {resetEmailSent 
                ? "Check your email for a reset link"
                : "Enter your email to receive a password reset link"
              }
            </p>
          </div>

          <div className="glass rounded-2xl p-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {resetEmailSent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and follow the instructions.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="resetEmail"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({});
                      }}
                      placeholder="you@company.com"
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MFA verification screen
  if (showMFA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 opacity-0 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
            <p className="text-muted-foreground mt-2">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="glass rounded-2xl p-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={mfaCode}
                  onChange={setMfaCode}
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

              <Button
                onClick={handleMFAVerify}
                variant="glow"
                className="w-full"
                disabled={mfaCode.length !== 6 || isVerifyingMFA}
              >
                {isVerifyingMFA ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Verify
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleBackFromMFA}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 opacity-0 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-2xl font-bold text-primary-foreground">IC</span>
          </div>
          <h1 className="text-2xl font-bold">IC Prep AI</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@company.com"
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            
            <Button
              type="submit"
              variant="glow"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          {/* SSO Divider */}
          {isLogin && !showSSO && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 gap-2"
                onClick={() => setShowSSO(true)}
              >
                <Building2 className="w-4 h-4" />
                Sign in with Enterprise SSO
              </Button>
            </div>
          )}

          {/* SSO Providers */}
          {showSSO && (
            <div className="mt-6 pt-6 border-t border-border">
              <SSOLogin onBack={() => setShowSSO(false)} />
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          Your IC preparation data is encrypted and secure &middot; SOC 2 Type II compliant
        </p>
      </div>
    </div>
  );
}
