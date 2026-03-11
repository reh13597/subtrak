"use client";

import { useState, useMemo } from "react";
import { Check, X, Loader2, Sparkles, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export interface ExtractedItem {
  id: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY" | "WEEKLY" | "CUSTOM";
  providerUrl?: string | null;
  lastChargeDate?: string | null;
  nextBillingDate?: string | null;
  confidenceScore: number;
  reviewStatus: "PENDING" | "ACCEPTED" | "REJECTED";
}

interface ExtractedPreviewProps {
  items: ExtractedItem[];
  uploadId: number;
  onConfirm: () => void;
  cognitoId: string;
}

function confidenceBadge(score: number) {
  if (score >= 0.8) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border rounded-full text-xs">
        {(score * 100).toFixed(0)}%
      </Badge>
    );
  }
  if (score >= 0.6) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border rounded-full text-xs">
        {(score * 100).toFixed(0)}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border rounded-full text-xs">
      {(score * 100).toFixed(0)}%
    </Badge>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ExtractedPreview({
  items,
  uploadId,
  onConfirm,
  cognitoId,
}: ExtractedPreviewProps) {
  const [decisions, setDecisions] = useState<Record<number, "ACCEPTED" | "REJECTED">>(() => {
    const initial: Record<number, "ACCEPTED" | "REJECTED"> = {};
    for (const item of items) {
      initial[item.id] = item.confidenceScore >= 0.6 ? "ACCEPTED" : "REJECTED";
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const counts = useMemo(() => {
    let accepted = 0;
    let rejected = 0;
    for (const v of Object.values(decisions)) {
      if (v === "ACCEPTED") accepted++;
      else rejected++;
    }
    return { accepted, rejected };
  }, [decisions]);

  const toggle = (id: number) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: prev[id] === "ACCEPTED" ? "REJECTED" : "ACCEPTED",
    }));
  };

  const handleSave = async () => {
    const acceptedIds = Object.entries(decisions)
      .filter(([, v]) => v === "ACCEPTED")
      .map(([k]) => Number(k));

    if (acceptedIds.length === 0) {
      toast({
        title: "No items selected",
        description: "Accept at least one subscription to save.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/extract/${uploadId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-cognito-id": cognitoId,
        },
        body: JSON.stringify({ acceptedIds }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save");
      }

      toast({ title: "Subscriptions saved", description: `${acceptedIds.length} subscription(s) added.` });
      onConfirm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(price);

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
            <Sparkles size={20} />
          </div>
          <div>
            <CardTitle className="text-white text-lg font-black">
              Extracted Subscriptions
            </CardTitle>
            <CardDescription className="text-white/40">
              Review AI-detected subscriptions before saving.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest">
                  Name
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest">
                  Price
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest hidden sm:table-cell">
                  Cycle
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest hidden md:table-cell">
                  Next Billing
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest">
                  Confidence
                </TableHead>
                <TableHead className="text-white/40 font-bold text-xs uppercase tracking-widest text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const accepted = decisions[item.id] === "ACCEPTED";
                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "border-white/5 transition",
                      accepted ? "hover:bg-white/5" : "opacity-50 hover:bg-white/5"
                    )}
                  >
                    <TableCell className="text-white font-medium">
                      <div className="space-y-0.5">
                        <p className="font-bold">{item.name}</p>
                        {item.providerUrl && (
                          <a
                            href={item.providerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#4a9fd5] hover:text-[#6bb5e0] text-xs transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={10} />
                            <span className="truncate max-w-[180px]">{item.providerUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      {formatPrice(item.price, item.currency)}
                    </TableCell>
                    <TableCell className="text-white/60 capitalize hidden sm:table-cell">
                      {item.billingCycle.toLowerCase()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.nextBillingDate ? (
                        <div className="flex items-center gap-1.5 text-white/60">
                          <Calendar size={12} className="text-white/30" />
                          <span className="text-sm">{formatDate(item.nextBillingDate)}</span>
                        </div>
                      ) : (
                        <span className="text-white/20 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>{confidenceBadge(item.confidenceScore)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(item.id)}
                        className={cn(
                          "rounded-xl text-xs font-semibold gap-1.5 transition-colors",
                          accepted
                            ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        )}
                        aria-label={accepted ? `Reject ${item.name}` : `Accept ${item.name}`}
                      >
                        {accepted ? (
                          <>
                            <Check size={14} />
                            Accepted
                          </>
                        ) : (
                          <>
                            <X size={14} />
                            Rejected
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-white/40">
            <span className="text-emerald-400 font-semibold">{counts.accepted}</span>{" "}
            accepted &middot;{" "}
            <span className="text-red-400 font-semibold">{counts.rejected}</span>{" "}
            rejected
          </p>
          <Button
            onClick={handleSave}
            disabled={saving || counts.accepted === 0}
            className="bg-[#155885] hover:bg-[#1a6ba1] text-white font-bold rounded-2xl px-8 h-11 shadow-lg shadow-[#155885]/20 disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving…
              </>
            ) : (
              `Save ${counts.accepted} Accepted`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
