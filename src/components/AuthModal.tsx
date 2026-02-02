"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import {
  X,
  LogIn,
  UserPlus,
  Sparkles,
  Mail,
  Lock,
  Github,
  Loader2,
  Eye,
  EyeOff,
  User,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = "signin" | "signup";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [isAnimating, setIsAnimating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive } = useSignUp();
  const { isSignedIn } = useUser();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("signin");
      setIsAnimating(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setPendingVerification(false);
      setVerificationCode("");
    }
  }, [isOpen]);

  // Prevent background scrolling and handle escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen, onClose]);

  // Close modal when user signs in successfully
  useEffect(() => {
    if (isSignedIn && isOpen) {
      onClose();
    }
  }, [isSignedIn, isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleTabSwitch = (tab: AuthTab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setError("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPendingVerification(false);
    }
  };

  // OAuth sign in (GitHub)
  const handleOAuthSignIn = async (provider: "oauth_github") => {
    if (!signInLoaded || !signIn) return;

    try {
      setIsLoading(true);
      setError("");
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "OAuth sign in failed";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Email/password sign in
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signIn) return;

    try {
      setIsLoading(true);
      setError("");

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        // Sign in successful - the useEffect will close the modal
        window.location.reload();
      } else {
        setError("Sign in incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      const errorMessage =
        clerkError.errors?.[0]?.message ||
        "Sign in failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password sign up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      const errorMessage =
        clerkError.errors?.[0]?.message || "Sign up failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email code
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;

    try {
      setIsLoading(true);
      setError("");

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          window.location.reload();
        } else {
          setError(
            "Verification completed but session could not be created. Please try signing in.",
          );
        }
      } else {
        setError("Verification could not be completed. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      const errorMessage =
        clerkError.errors?.[0]?.message || "Invalid verification code.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Ambient glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div
        className={`relative bg-background rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10 w-full max-w-md mx-auto max-h-[90vh] flex flex-col transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner accents */}
        <div className="absolute -top-px -left-px w-16 h-16 border-t-2 border-l-2 border-primary/40 rounded-tl-2xl pointer-events-none" />
        <div className="absolute -top-px -right-px w-16 h-16 border-t-2 border-r-2 border-primary/40 rounded-tr-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative bg-primary/10 border-b border-primary/20 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl animate-pulse" />
                {activeTab === "signin" ? (
                  <LogIn className="w-5 h-5 text-accent relative z-10" />
                ) : (
                  <UserPlus className="w-5 h-5 text-accent relative z-10" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {pendingVerification
                    ? "Verify Email"
                    : activeTab === "signin"
                      ? "Welcome Back"
                      : "Join Us"}
                  <Sparkles className="w-4 h-4 text-accent" />
                </h2>
                <p className="text-sm text-muted-foreground">
                  {pendingVerification
                    ? "Check your email for a code"
                    : activeTab === "signin"
                      ? "Sign in to continue"
                      : "Create your account"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 p-2 hover:bg-muted/50 rounded-xl hover:rotate-90"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Switcher - hide during verification */}
          {!pendingVerification && (
            <div className="mt-4 relative">
              <div className="flex bg-muted/50 rounded-xl p-1 relative">
                {/* Animated background indicator */}
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg shadow-lg shadow-primary/30 transition-all duration-300 ease-out ${
                    activeTab === "signin" ? "left-1" : "left-[calc(50%+2px)]"
                  }`}
                />

                <button
                  onClick={() => handleTabSwitch("signin")}
                  className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${
                    activeTab === "signin"
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => handleTabSwitch("signup")}
                  className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${
                    activeTab === "signup"
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-grow overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Email Verification Form */}
          {pendingVerification ? (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify Email"
                )}
              </button>
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign up
              </button>
            </form>
          ) : (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleOAuthSignIn("oauth_github")}
                  disabled={isLoading}
                  className="w-full py-3 bg-muted border border-border rounded-xl font-medium text-foreground hover:bg-secondary hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <Github className="w-5 h-5" />
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email/Password Form */}
              <form
                onSubmit={
                  activeTab === "signin" ? handleEmailSignIn : handleEmailSignUp
                }
                className="space-y-4"
              >
                {/* Name fields - only for sign up */}
                {activeTab === "signup" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-accent" />
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-accent" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password - only for sign up */}
                {activeTab === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-accent" />
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : activeTab === "signin" ? (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer accent */}
        <div className="px-5 pb-4">
          <div className="h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
}
