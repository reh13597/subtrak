"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  CreditCard, 
  Loader2,
  Settings,
  LogOut
} from "lucide-react";
import { signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkUser();
  }, []);

  async function handleLogout() {
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#155885]" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="w-24 h-24 rounded-full bg-[#155885] border-4 border-white/10 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
          {user?.signInDetails?.loginId?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">Account Settings</h1>
          <p className="text-white/40 text-lg">Manage your personal information and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {[
            { name: "Profile", icon: User, active: true },
            { name: "Notifications", icon: Bell },
            { name: "Billing", icon: CreditCard },
            { name: "Security", icon: Shield },
          ].map((item) => (
            <button 
              key={item.name}
              className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all duration-300 ${item.active ? "bg-[#155885] text-white shadow-xl shadow-[#155885]/20" : "text-white/40 hover:bg-white/5 hover:text-white"}`}
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

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <User size={20} className="text-[#155885]" />
                <span>Personal Information</span>
              </h3>
              <button className="text-sm font-bold text-[#155885] hover:underline transition">Edit</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Full Name</p>
                <p className="text-white font-medium">User Profile Name</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Email Address</p>
                <p className="text-white font-medium">{user?.signInDetails?.loginId || "example@email.com"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Member Since</p>
                <p className="text-white font-medium">March 2026</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Timezone</p>
                <p className="text-white font-medium">PST (Vancouver, BC)</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Bell size={20} className="text-[#155885]" />
                <span>Preferences</span>
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-white/20 text-xs">Receive updates about upcoming renewals.</p>
                </div>
                <div className="w-12 h-6 bg-[#155885] rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white font-medium">Monthly Budget Alerts</p>
                  <p className="text-white/20 text-xs">Get notified when you exceed your set budget.</p>
                </div>
                <div className="w-12 h-6 bg-white/10 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
