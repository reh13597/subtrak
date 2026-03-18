"use client";

import { useEffect, useState } from "react";
import { 
  deleteUserAttributes, 
  signOut, 
  updateUserAttributes, 
  confirmUserAttribute, 
  sendUserAttributeVerificationCode 
} from "aws-amplify/auth";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  User,
  Mail,
  Shield,
  Bell,
  CreditCard,
  Loader2,
  LogOut,
  Pencil,
  X,
  Check,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { syncCurrentUserToDb } from "@/lib/sync-user";
import { authHeaders } from "@/lib/client-auth";

type SidebarTab = "profile" | "notifications" | "billing" | "security";

interface Preferences {
  emailNotifications: boolean;
  budgetAlerts: boolean;
}

export default function AccountPage() {
  const { profile, cognitoId, loading: isLoading, displayName, refreshProfile } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SidebarTab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<Preferences>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("subtrak-prefs");
        if (stored) return JSON.parse(stored);
      } catch { /* ignore */ }
    }
    return { emailNotifications: true, budgetAlerts: false };
  });

  useEffect(() => {
    if (profile) {
      setEditFirstName(profile.firstName ?? "");
      setEditLastName(profile.lastName ?? "");
      setEditEmail(profile.email ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("subtrak-prefs", JSON.stringify(prefs));
    }
  }, [prefs]);

  async function handleLogout() {
    try {
      await signOut();
      router.push("/");
    } catch {
      // sign out failed silently
    }
  }

  function startEditing() {
    setEditFirstName(profile?.firstName ?? "");
    setEditLastName(profile?.lastName ?? "");
    setEditEmail(profile?.email ?? "");
    setPendingNewEmail(null);
    setVerificationCode("");
    setSuccessMessage(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditFirstName(profile?.firstName ?? "");
    setEditLastName(profile?.lastName ?? "");
    setEditEmail(profile?.email ?? "");
    setPendingNewEmail(null);
    setVerificationCode("");
  }

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 10000);
  }

  async function handleResendCode() {
    setResending(true);
    try {
      await sendUserAttributeVerificationCode({ userAttributeKey: "email" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  }

  async function saveProfile() {
    if (!cognitoId) return;
    setSaving(true);
    setSuccessMessage(null);
    try {
      const trimmedEmail = editEmail.trim().toLowerCase();
      const trimmedFirstName = editFirstName.trim();
      const trimmedLastName = editLastName.trim();
      const emailChanged = trimmedEmail !== (profile?.email ?? "").trim().toLowerCase();
      const namesChanged = trimmedFirstName !== (profile?.firstName ?? "").trim() || trimmedLastName !== (profile?.lastName ?? "").trim();

      if (!trimmedEmail) {
        throw new Error("Email is required");
      }

      if (emailChanged) {
        const output = await updateUserAttributes({
          userAttributes: { email: trimmedEmail },
        });

        if (output.email?.nextStep.updateAttributeStep === "CONFIRM_ATTRIBUTE_WITH_CODE") {
          setPendingNewEmail(trimmedEmail);
          setVerificationCode("");
        } else {
          await syncCurrentUserToDb();
          await refreshProfile();
          setIsEditing(false);
          showSuccess("Email updated successfully.");
        }
      }

      if (namesChanged) {
        const userAttributes: Record<string, string> = {};
        const userAttributeKeys: ("given_name" | "family_name")[] = [];

        if (trimmedFirstName) {
          userAttributes.given_name = trimmedFirstName;
        } else {
          userAttributeKeys.push("given_name");
        }

        if (trimmedLastName) {
          userAttributes.family_name = trimmedLastName;
        } else {
          userAttributeKeys.push("family_name");
        }

        if (Object.keys(userAttributes).length > 0) {
          await updateUserAttributes({ userAttributes });
        }

        if (userAttributeKeys.length === 1) {
          await deleteUserAttributes({ userAttributeKeys: [userAttributeKeys[0]] });
        } else if (userAttributeKeys.length === 2) {
          await deleteUserAttributes({ userAttributeKeys: [userAttributeKeys[0], userAttributeKeys[1]] });
        }

        await syncCurrentUserToDb();
        await refreshProfile();
      }

      if (!emailChanged) {
        setIsEditing(false);
        showSuccess("Profile updated successfully.");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmEmailChange() {
    const trimmedCode = verificationCode.trim();

    if (!trimmedCode) return;

    if (!pendingNewEmail) return;

    setVerifyingEmail(true);
    try {
      await confirmUserAttribute({
        userAttributeKey: "email",
        confirmationCode: trimmedCode,
      });

      const headers = await authHeaders();
      const res = await fetch("/api/users/confirm-email-change", {
        method: "POST",
        headers,
        body: JSON.stringify({ newEmail: pendingNewEmail, code: "VERIFIED_BY_AMPLIFY" }),
      });

      if (!res.ok) {
        throw new Error("Cognito updated, but failed to sync to database.");
      }

      await refreshProfile();
      setPendingNewEmail(null);
      setVerificationCode("");
      setEditEmail(pendingNewEmail);
      setIsEditing(false);
      showSuccess("Your email has been successfully updated and verified.");
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Unable to verify your email change.",
        variant: "destructive",
      });
    } finally {
      setVerifyingEmail(false);
    }
  }

  function cancelEmailVerification() {
    setPendingNewEmail(null);
    setVerificationCode("");
  }

  function togglePref(key: keyof Preferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#155885]" size={48} />
      </div>
    );
  }

  const sidebarItems: { name: string; key: SidebarTab; icon: typeof User }[] = [
    { name: "Profile", key: "profile", icon: User },
    { name: "Notifications", key: "notifications", icon: Bell },
    { name: "Billing", key: "billing", icon: CreditCard },
    { name: "Security", key: "security", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#155885] to-[#1a6ba1] border-4 border-white/10 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
          {displayName[0]?.toUpperCase() || "U"}
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">Account Settings</h1>
          <p className="text-white/40 text-lg">Manage your personal information and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.key
                  ? "bg-[#155885] text-white shadow-xl shadow-[#155885]/20"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold">{item.name}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-6 py-4 rounded-2xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-bold">Sign Out</span>
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <User size={20} className="text-[#155885]" />
                  <span>Personal Information</span>
                </h3>
                {!isEditing && !pendingNewEmail ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditing}
                    className="text-[#155885] hover:text-[#1a6ba1] hover:bg-[#155885]/10 rounded-xl gap-1.5 font-bold"
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                ) : (
                  !pendingNewEmail && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                        className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl gap-1.5 font-bold"
                      >
                        <X size={14} />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveProfile}
                        disabled={saving}
                        className="bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-xl gap-1.5 font-bold"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Save
                      </Button>
                    </div>
                  )
                )}
              </div>

              {successMessage && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-500">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">First Name</p>
                  {isEditing || pendingNewEmail ? (
                    <Input
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11"
                      disabled={!!pendingNewEmail}
                    />
                  ) : (
                    <p className="text-white font-medium">{profile?.firstName || "Not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Last Name</p>
                  {isEditing || pendingNewEmail ? (
                    <Input
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11"
                      disabled={!!pendingNewEmail}
                    />
                  ) : (
                    <p className="text-white font-medium">{profile?.lastName || "Not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Email Address</p>
                  {isEditing || pendingNewEmail ? (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-white/20" />
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11"
                        disabled={!!pendingNewEmail}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-white/20" />
                      <p className="text-white font-medium">{profile?.email || "—"}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Member Since</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-white/20" />
                    <p className="text-white font-medium">{memberSince}</p>
                  </div>
                </div>
              </div>

              {pendingNewEmail && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-200">Verify your email change</p>
                    <p className="text-sm text-amber-100/80">
                      We sent a 6-digit code to your updated email <span className="font-semibold text-white">{pendingNewEmail}</span>.
                      Enter it below to confirm your new email for this account.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Input
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="6-digit code"
                        maxLength={6}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 pl-4 tracking-widest font-mono text-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={confirmEmailChange}
                        disabled={verifyingEmail || verificationCode.length < 6}
                        className="bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-xl font-bold flex-1 md:flex-none"
                      >
                        {verifyingEmail ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={cancelEmailVerification}
                        className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-bold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center pt-2">
                    <button
                      onClick={handleResendCode}
                      disabled={resending}
                      className="text-xs text-white/40 hover:text-[#155885] transition-colors flex items-center gap-1.5 font-semibold"
                    >
                      {resending ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                      Didn't receive a code? Resend
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
              <div className="border-b border-white/5 pb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Bell size={20} className="text-[#155885]" />
                  <span>Preferences</span>
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-5 border-b border-white/5">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-white/30 text-xs mt-0.5">Receive updates about upcoming renewals.</p>
                  </div>
                  <button
                    onClick={() => togglePref("emailNotifications")}
                    className={`w-12 h-7 rounded-full relative transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      prefs.emailNotifications ? "bg-[#155885]" : "bg-white/10"
                    }`}
                    role="switch"
                    aria-checked={prefs.emailNotifications}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-200 ${
                        prefs.emailNotifications
                          ? "right-1 bg-white shadow-md"
                          : "left-1 bg-white/40"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between py-5">
                  <div>
                    <p className="text-white font-medium">Monthly Budget Alerts</p>
                    <p className="text-white/30 text-xs mt-0.5">Get notified when you exceed your set budget.</p>
                  </div>
                  <button
                    onClick={() => togglePref("budgetAlerts")}
                    className={`w-12 h-7 rounded-full relative transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      prefs.budgetAlerts ? "bg-[#155885]" : "bg-white/10"
                    }`}
                    role="switch"
                    aria-checked={prefs.budgetAlerts}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-200 ${
                        prefs.budgetAlerts
                          ? "right-1 bg-white shadow-md"
                          : "left-1 bg-white/40"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
              <div className="border-b border-white/5 pb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <CreditCard size={20} className="text-[#155885]" />
                  <span>Billing</span>
                </h3>
              </div>
              <div className="text-center py-12 space-y-3">
                <CreditCard size={40} className="text-white/10 mx-auto" />
                <p className="text-white/30 font-medium">No billing information</p>
                <p className="text-white/15 text-sm">SubTrak is currently free to use.</p>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
              <div className="border-b border-white/5 pb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Shield size={20} className="text-[#155885]" />
                  <span>Security</span>
                </h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <p className="text-white font-medium">Authentication</p>
                    <p className="text-white/30 text-xs mt-0.5">Managed via Amazon Cognito</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-white font-medium">Password</p>
                    <p className="text-white/30 text-xs mt-0.5">Change your password through Cognito</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#155885] hover:text-[#1a6ba1] hover:bg-[#155885]/10 rounded-xl font-bold"
                    onClick={() => toast({ title: "Coming soon", description: "Password change will be available in a future update." })}
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
