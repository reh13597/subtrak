"use client";

import { useEffect, useState } from "react";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { 
  LayoutDashboard, 
  TrendingUp, 
  CreditCard, 
  Calendar,
  Plus,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        const attributes = await fetchUserAttributes();
        setFirstName(attributes.given_name || "");
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#155885]" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Welcome back, <span className="text-[#155885]">{firstName || user?.signInDetails?.loginId?.split('@')[0] || "User"}</span>.
          </h1>
          <p className="text-white/40 text-lg">Here's your subscription overview for March 2026.</p>
        </div>
        <Link 
          href="/subscriptions"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-2xl font-bold transition shadow-xl shadow-[#155885]/20"
        >
          <Plus size={20} />
          <span>Add Subscription</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#155885]/30 transition group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#155885] rounded-full blur-[80px] opacity-10 -mr-16 -mt-16"></div>
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Monthly Spend</p>
              <h3 className="text-3xl font-black text-white">$142.50</h3>
            </div>
            <p className="text-emerald-400 text-sm font-medium flex items-center space-x-1">
              <ArrowUpRight size={14} />
              <span>4% from last month</span>
            </p>
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#155885]/30 transition group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#155885] rounded-full blur-[80px] opacity-10 -mr-16 -mt-16"></div>
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Active Services</p>
              <h3 className="text-3xl font-black text-white">8</h3>
            </div>
            <p className="text-white/40 text-sm">2 annual, 6 monthly</p>
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#155885]/30 transition group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#155885] rounded-full blur-[80px] opacity-10 -mr-16 -mt-16"></div>
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Next Renewal</p>
              <h3 className="text-3xl font-black text-white">March 14</h3>
            </div>
            <p className="text-white/40 text-sm">Netflix Standard - $15.49</p>
          </div>
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 h-[400px] flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
            <LayoutDashboard size={32} />
          </div>
          <h4 className="text-xl font-bold text-white">Spending Chart</h4>
          <p className="text-white/40 max-w-xs">Visual spending analysis is currently being calculated.</p>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 h-[400px] flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
            <Calendar size={32} />
          </div>
          <h4 className="text-xl font-bold text-white">Recent Activity</h4>
          <p className="text-white/40 max-w-xs">Your recent subscription log will appear here.</p>
        </div>
      </div>
    </div>
  );
}
