"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
} from "aws-amplify/auth";
import { syncCurrentUserToDb } from "@/lib/sync-user";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  loginSchema,
  signupSchema,
  confirmSchema,
  type LoginInput,
  type SignupInput,
  type ConfirmInput,
} from "@/lib/validations/auth";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const initialTab = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Stashed credentials for the confirm flow (auto sign-in after verify)
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [pendingFirstName, setPendingFirstName] = useState("");
  const [pendingLastName, setPendingLastName] = useState("");

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "" },
  });

  const confirmForm = useForm<ConfirmInput>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { email: "", confirmationCode: "" },
  });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (data: LoginInput) => {
    clearMessages();
    setIsLoading(true);
    try {
      await signIn({ username: data.email, password: data.password });
      await syncCurrentUserToDb();
      setSuccess("Success! Redirecting to dashboard...");
      setTimeout(() => router.push(redirectTo), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupInput) => {
    clearMessages();
    setIsLoading(true);
    try {
      await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
          },
        },
      });

      setPendingEmail(data.email);
      setPendingPassword(data.password);
      setPendingFirstName(data.firstName);
      setPendingLastName(data.lastName);

      confirmForm.setValue("email", data.email);

      setSuccess("Verification code sent to your email!");
      setActiveTab("confirm");
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setIsLoading(false);
    }
  };

  const handleConfirm = async (data: ConfirmInput) => {
    clearMessages();
    setIsLoading(true);
    try {
      await confirmSignUp({
        username: data.email,
        confirmationCode: data.confirmationCode,
      });

      await signIn({ username: data.email, password: pendingPassword });
      await syncCurrentUserToDb();

      setSuccess("Account verified! Welcome to SubTrak.");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid confirmation code.");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    clearMessages();
    try {
      const email = confirmForm.getValues("email") || pendingEmail;
      await resendSignUpCode({ username: email });
      setSuccess("New code sent!");
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
  };

  const switchTab = (tab: string) => {
    clearMessages();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl overflow-hidden relative group">
        {/* Decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#155885] rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#155885] rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity" />

        <CardHeader className="relative text-center pb-2">
          <CardTitle className="text-3xl font-bold text-white tracking-tight">
            {activeTab === "confirm" ? "Check Your Email." : "Welcome Back."}
          </CardTitle>
          <CardDescription className="text-white/60 text-base mt-1">
            {activeTab === "confirm"
              ? `We sent a verification code to ${pendingEmail || "your email."}`
              : "One step away from greatness."}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-5">
          {/* Status Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="shrink-0" size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="shrink-0" size={20} />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={switchTab}>
            <TabsList className="w-full bg-white/5 border border-white/10">
              <TabsTrigger
                value="signin"
                className="flex-1 data-[state=active]:bg-[#155885] data-[state=active]:text-white text-white/60"
              >
                Log In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="flex-1 data-[state=active]:bg-[#155885] data-[state=active]:text-white text-white/60"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger
                value="confirm"
                className="flex-1 data-[state=active]:bg-[#155885] data-[state=active]:text-white text-white/60"
              >
                Confirm
              </TabsTrigger>
            </TabsList>

            {/* ─── Sign In ─── */}
            <TabsContent value="signin" className="mt-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 flex items-center gap-2">
                          <Mail size={14} /> Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 flex items-center gap-2">
                          <Lock size={14} /> Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-xl py-5 font-bold text-base shadow-xl shadow-[#155885]/20"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-white/50 text-sm pt-1">
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("signup")}
                      className="text-white font-bold hover:text-[#155885] transition"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              </Form>
            </TabsContent>

            {/* ─── Sign Up ─── */}
            <TabsContent value="signup" className="mt-6">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 flex items-center gap-2">
                            <User size={14} /> First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jane"
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 flex items-center gap-2">
                            <User size={14} /> Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 flex items-center gap-2">
                          <Mail size={14} /> Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 flex items-center gap-2">
                          <Lock size={14} /> Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Min. 8 characters"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-xl py-5 font-bold text-base shadow-xl shadow-[#155885]/20"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-white/50 text-sm pt-1">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("signin")}
                      className="text-white font-bold hover:text-[#155885] transition"
                    >
                      Login
                    </button>
                  </p>
                </form>
              </Form>
            </TabsContent>

            {/* ─── Confirm Email ─── */}
            <TabsContent value="confirm" className="mt-6">
              <Form {...confirmForm}>
                <form onSubmit={confirmForm.handleSubmit(handleConfirm)} className="space-y-4">
                  <FormField
                    control={confirmForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 flex items-center gap-2">
                          <Mail size={14} /> Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={confirmForm.control}
                    name="confirmationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 flex items-center gap-2">
                          <KeyRound size={14} /> Verification Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit code"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#155885] text-center tracking-widest font-mono text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-xl py-5 font-bold text-base shadow-xl shadow-[#155885]/20"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm pt-1">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-white/50 hover:text-white transition"
                    >
                      Didn&apos;t receive a code?{" "}
                      <span className="font-bold">Resend</span>
                    </button>
                  </p>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#155885]" size={40} />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
