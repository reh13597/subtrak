"use client";

import { Shield, Users, Zap, Heart, Globe, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen py-20 px-6 space-y-32">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">
          We're on a mission to <span className="text-[#155885]">simplify</span> your life.
        </h1>
        <p className="text-xl text-white/50 leading-relaxed max-w-2xl mx-auto">
          SubTrak was born out of a simple realization: managing subscriptions shouldn't be a full-time job.
          We're building the tools to help you regain control of your monthly finances.
        </p>
      </section>

      {/* Values Grid */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {values.map((value, idx) => (
          <div key={idx} className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#155885]/50 transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885] mb-8 group-hover:scale-110 transition-transform">
              <value.icon size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
            <p className="text-white/40 leading-relaxed">{value.description}</p>
          </div>
        ))}
      </section>

      {/* Story Section */}
      <section className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#155885] rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Our Story</h2>
          <div className="space-y-6 text-white/60 text-lg leading-relaxed">
            <p>
              SubTrak started as a university project at SFU, driven by the common frustration of "subscription fatigue."
              We noticed that our friends and family were losing hundreds of dollars every year to services they had forgotten they were paying for.
            </p>
            <p>
              We decided to build a platform that doesn't just list your subscriptions, but provides the insights and automation needed
              to make smart financial decisions. Today, SubTrak is a labor of love, built with the latest technologies to ensure
              security, speed, and a world-class user experience.
            </p>
          </div>
        </div>
      </section>

      {/* Team/Footer Accent */}
      <section className="max-w-7xl mx-auto text-center py-20">
        <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-bold uppercase tracking-widest">
          <Heart size={16} className="text-red-500" />
          <span>Built with passion in British Columbia</span>
        </div>
      </section>
    </div>
  );
}

const values = [
  {
    title: "Privacy First",
    description: "Your financial data is yours alone. We use enterprise-grade encryption and secure AWS infrastructure to protect your information.",
    icon: Shield
  },
  {
    title: "User Centric",
    description: "Every feature we build is designed to solve a real problem. We listen to our community to shape the future of SubTrak.",
    icon: Users
  },
  {
    title: "Pure Efficiency",
    description: "No bloat, no clutter. Just the insights you need to manage your subscriptions as quickly as possible.",
    icon: Zap
  }
];
