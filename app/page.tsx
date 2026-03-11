"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Bell, ShieldCheck, Zap, TrendingDown, DollarSign, Users, LayoutDashboard } from "lucide-react";
import heroImage from './assets/hero.webp';

// Hook for counting animation
const useCountUp = (end: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return count;
};

export default function Home() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowStats(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const avgSubs = useCountUp(12, 2000, showStats);
  const wastedSpend = useCountUp(150, 2000, showStats);
  const totalSubscribers = useCountUp(3, 2000, showStats);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url(${heroImage.src})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0d344f]/80 to-black/90"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap size={16} className="text-[#155885]" />
            <span>Master Your Subscriptions Today</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Welcome to <span className="text-[#155885] drop-shadow-2xl">SubTrak</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-white/70 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            Drowning in "micro-payments"? You're not alone. Most people lose track of their digital footprint within 3 months. SubTrak simplifies your spending and eliminates subscription fatigue.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
            <Link
              href="/login?mode=signup"
              className="px-10 py-5 bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#155885]/20 flex items-center space-x-3 group"
            >
              <span>Get Started Now</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-all backdrop-blur-md border border-white/10"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section ref={statsRef} className="py-24 bg-black border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4 group">
              <div className="inline-flex p-4 rounded-2xl bg-[#155885]/10 text-[#155885] transition-transform duration-500 group-hover:scale-110">
                <LayoutDashboard size={32} />
              </div>
              <div className="text-5xl font-black text-white tracking-tight">
                {avgSubs}
              </div>
              <p className="text-white/50 font-medium">Average subscriptions per person</p>
            </div>

            <div className="space-y-4 group">
              <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 transition-transform duration-500 group-hover:scale-110">
                <TrendingDown size={32} />
              </div>
              <div className="text-5xl font-black text-white tracking-tight">
                ${wastedSpend}
              </div>
              <p className="text-white/50 font-medium">Monthly spent on unnecessary services</p>
            </div>

            <div className="space-y-4 group">
              <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 text-blue-400 transition-transform duration-500 group-hover:scale-110">
                <Users size={32} />
              </div>
              <div className="text-5xl font-black text-white tracking-tight">
                {totalSubscribers}M+
              </div>
              <p className="text-white/50 font-medium">Active subscribers across Canada</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#155885] rounded-full blur-[150px] opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#155885] rounded-full blur-[150px] opacity-10"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Powerful Features</h2>
            <p className="text-xl text-white/50">Everything you need to regain control of your monthly finances.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#155885]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#155885]/10 transform hover:-translate-y-2"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-8 transition-transform duration-500 group-hover:rotate-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-gradient-to-br from-[#155885] to-[#0d344f] p-10 md:p-16 rounded-[2.5rem] text-center space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl md:text-5xl font-black text-white relative z-10">Stop guessing. Start tracking.</h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto relative z-10">Join thousands of Canadians saving hundreds every month by managing their subscriptions effectively.</p>
            <div className="relative z-10 pt-4">
              <Link
                href="/login?mode=signup"
                className="px-10 py-4 bg-white text-[#155885] rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition shadow-2xl inline-block"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    title: "Centralized Dashboard",
    description: "Visualize all your monthly, annual, and weekly subscriptions in one beautiful, interactive dashboard.",
    icon: <BarChart3 className="text-white" size={28} />,
    color: "bg-blue-600"
  },
  {
    title: "Smart Notifications",
    description: "Get alerted via Email or SMS before a renewal date so you never get hit with a surprise charge again.",
    icon: <Bell className="text-white" size={28} />,
    color: "bg-orange-500"
  },
  {
    title: "Spending Analysis",
    description: "In-depth breakdowns of your category spending to help you identify where you can cut back.",
    icon: <DollarSign className="text-white" size={28} />,
    color: "bg-emerald-500"
  },
  {
    title: "Secure Auth",
    description: "Your data is protected by AWS Cognito, ensuring enterprise-grade security for your financial overview.",
    icon: <ShieldCheck className="text-white" size={28} />,
    color: "bg-indigo-600"
  },
  {
    title: "Usage Logging",
    description: "Track how often you actually use your services to see if that $15 streaming plan is really worth it.",
    icon: <Zap className="text-white" size={28} />,
    color: "bg-amber-500"
  },
  {
    title: "Auto-Sync",
    description: "Seamlessly connect with major digital services to pull in your plan details automatically.",
    icon: <Users className="text-white" size={28} />,
    color: "bg-pink-600"
  }
];
