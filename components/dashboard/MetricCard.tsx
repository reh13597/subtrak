"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: MetricCardProps) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#155885]/30 transition group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#155885] rounded-full blur-[80px] opacity-10 -mr-16 -mt-16" />
      <div className="space-y-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
          <Icon size={24} />
        </div>
        <div>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
            {title}
          </p>
          <h3 className="text-3xl font-black text-white">{value}</h3>
        </div>
        {trend ? (
          <p
            className={cn(
              "text-sm font-medium flex items-center space-x-1",
              trend.positive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            <span>{trend.value}</span>
          </p>
        ) : (
          <p className="text-white/40 text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
