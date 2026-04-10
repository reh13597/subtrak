"use client";

import { Database, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCourseAnalytics } from "@/hooks/useCourseAnalytics";

interface CourseAnalyticsPanelProps {
  cognitoId: string | null;
}

export function CourseAnalyticsPanel({ cognitoId }: CourseAnalyticsPanelProps) {
  const { data, loading, error, refetch } = useCourseAnalytics({ cognitoId });

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

  if (!cognitoId) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#155885]/10 flex items-center justify-center text-[#155885] shrink-0">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Database analytics</h2>
            <p className="text-white/40 text-xs sm:text-sm">
              Join, aggregates, GROUP BY, and division-style SQL (course demo)
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={loading}
          className="border-white/10 text-white/80 hover:bg-white/5 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()} className="text-red-400 hover:text-red-300">
            Retry
          </Button>
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : data ? (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-sm">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">JOIN (extractions ⋈ uploads)</h3>
            {data.extractionUploadJoin.length === 0 ? (
              <p className="text-white/40 text-sm">No statement extractions yet. Upload a statement to populate this join.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/50">Upload file</TableHead>
                      <TableHead className="text-white/50">Extraction</TableHead>
                      <TableHead className="text-white/50 text-right">Price</TableHead>
                      <TableHead className="text-white/50 hidden sm:table-cell">Cycle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.extractionUploadJoin.slice(0, 15).map((row) => (
                      <TableRow key={row.extractionId} className="border-white/10">
                        <TableCell className="text-white/80 max-w-[140px] truncate" title={row.uploadFileName}>
                          {row.uploadFileName}
                        </TableCell>
                        <TableCell className="text-white">{row.extractionName}</TableCell>
                        <TableCell className="text-right text-white/90">{formatMoney(row.price)}</TableCell>
                        <TableCell className="text-white/60 capitalize hidden sm:table-cell">{row.billingCycle.toLowerCase()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Aggregation (COUNT, AVG, MIN, MAX, SUM)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
              <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                <p className="text-white/40 text-xs uppercase">Count</p>
                <p className="text-white font-bold text-lg">{data.subscriptionAggregates.count}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                <p className="text-white/40 text-xs uppercase">Avg</p>
                <p className="text-white font-bold text-lg">{formatMoney(data.subscriptionAggregates.avgPrice)}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                <p className="text-white/40 text-xs uppercase">Min</p>
                <p className="text-white font-bold text-lg">{formatMoney(data.subscriptionAggregates.minPrice)}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                <p className="text-white/40 text-xs uppercase">Max</p>
                <p className="text-white font-bold text-lg">{formatMoney(data.subscriptionAggregates.maxPrice)}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/10 p-3 col-span-2 sm:col-span-1">
                <p className="text-white/40 text-xs uppercase">Sum</p>
                <p className="text-white font-bold text-lg">{formatMoney(data.subscriptionAggregates.sumPrice)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">GROUP BY billing cycle</h3>
            {data.subscriptionByBillingCycle.length === 0 ? (
              <p className="text-white/40 text-sm">No subscriptions to group.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/50">Billing cycle</TableHead>
                      <TableHead className="text-white/50 text-right">Count</TableHead>
                      <TableHead className="text-white/50 text-right hidden sm:table-cell">Avg price</TableHead>
                      <TableHead className="text-white/50 text-right">Sum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.subscriptionByBillingCycle.map((row) => (
                      <TableRow key={row.billingCycle} className="border-white/10">
                        <TableCell className="text-white capitalize">{row.billingCycle.toLowerCase()}</TableCell>
                        <TableCell className="text-right text-white">{row.count}</TableCell>
                        <TableCell className="text-right text-white/80 hidden sm:table-cell">{formatMoney(row.avgPrice)}</TableCell>
                        <TableCell className="text-right text-white">{formatMoney(row.sumPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Division-style check (coverage of all distinct cycles in DB)
            </h3>
            <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
              True when your subscriptions include at least one row for every distinct{" "}
              <code className="text-[#155885]">billingCycle</code> value that appears anywhere in{" "}
              <code className="text-[#155885]">Subscription</code> (relational division pattern with NOT EXISTS).
            </p>
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-black/30 border border-white/10 p-4">
              <span
                className={`font-black text-lg ${data.division.coversAllDistinctBillingCyclesInDatabase ? "text-emerald-400" : "text-amber-400"}`}
              >
                {data.division.coversAllDistinctBillingCyclesInDatabase ? "Covers all" : "Does not cover all"}
              </span>
              <span className="text-white/40 text-sm">
                Distinct cycles in database:{" "}
                <span className="text-white/80">{data.division.distinctBillingCyclesInDatabase}</span>
              </span>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
