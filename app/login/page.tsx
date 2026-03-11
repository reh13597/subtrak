"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup" | "confirm">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update mode if URL changes
  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup") setMode("signup");
    else if (m === "login") setMode("login");
  }, [searchParams]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      await signIn({ username: email, password });
      setSuccess("Success! Redirecting to dashboard...");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          }
        }
      });
      setSuccess("Verification code sent to your email!");
      setMode("confirm");
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode });

      // Auto sign-in after confirmation
      await signIn({ username: email, password });

      // Insert into MySQL via our API
      const dbResponse = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          Email: email, 
          FirstName: firstName, 
          LastName: lastName, 
          Password: password 
        }),
      });

      if (!dbResponse.ok) {
        console.error("Failed to sync user to database");
      }

      setSuccess("Account verified! Welcome to SubTrak.");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid confirmation code.");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: email });
      setSuccess("New code sent!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative group">
        {/* Animated accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#155885] rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#155885] rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>

        <div className="text-center relative">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            {mode === "confirm" ? "Check Email" : "Welcome Back."}
          </h2>
          <p className="mt-3 text-white/60 text-lg">
            {mode === "confirm"
              ? `We sent a code to ${email}`
              : "One step away from greatness."}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <form className="mt-8 space-y-6 relative" onSubmit={
          mode === "login" ? handleLogin :
          mode === "signup" ? handleSignup :
          handleConfirm
        }>
          <div className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-white/40" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#155885] transition"
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-white/40" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#155885] transition"
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {mode !== "confirm" && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-white/40" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#155885] transition"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-white/40" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#155885] transition"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {mode === "confirm" && (
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-3.5 text-white/40" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Verification Code"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#155885] transition text-center tracking-widest font-mono text-xl"
                  onChange={(e) => setConfirmationCode(e.target.value)}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-xl py-4 font-bold text-lg transition shadow-xl shadow-[#155885]/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Verify Code"}</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            {mode === "login" ? (
              <p className="text-white/50">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-white font-bold hover:text-[#155885] transition"
                >
                  Create an account
                </button>
              </p>
            ) : mode === "signup" ? (
              <p className="text-white/50">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-white font-bold hover:text-[#155885] transition"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-white/50 hover:text-white transition text-sm"
              >
                Didn't receive a code? <span className="font-bold">Resend</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#155885]" size={40} />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
