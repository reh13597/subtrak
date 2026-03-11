"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  ExternalLink,
  Loader2
} from "lucide-react";

export default function SubscriptionsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#155885]" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tight">Your Subscriptions</h1>
          <p className="text-white/40">Manage and track all your active services in one place.</p>
        </div>
        <button className="inline-flex items-center space-x-2 px-6 py-3 bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-2xl font-bold transition shadow-xl shadow-[#155885]/20">
          <Plus size={20} />
          <span>New Subscription</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input 
            type="text" 
            placeholder="Search subscriptions..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#155885] transition"
          />
        </div>
        <div className="flex gap-4">
          <button className="flex items-center space-x-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white transition hover:bg-white/10">
            <Filter size={20} />
            <span className="font-bold">Filter</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#155885]/50 transition-all duration-500 relative overflow-hidden">
            <div className="flex items-start justify-between mb-8">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                <CreditCard size={28} />
              </div>
              <button className="p-2 text-white/20 hover:text-white transition">
                <MoreVertical size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="h-6 w-32 bg-white/10 rounded-full mb-2"></div>
                <div className="h-4 w-24 bg-white/5 rounded-full"></div>
              </div>
              
              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">Monthly</p>
                  <p className="text-xl font-black text-white">$ --.--</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                  <ExternalLink size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
