"use client";

import { useState } from "react";
import {
  TrendingUp,
  CreditCard,
  Calendar,
  DollarSign,
  Plus,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import type { SubscriptionItem } from "@/lib/types";
import type { SubscriptionCreate } from "@/lib/validations/subscription";
import {
  useSubscriptions,
  getMonthlySpendFromSubs,
  getActiveCountFromSubs,
  getNextRenewalFromSubs,
  getYearlyCostFromSubs,
} from "@/hooks/useSubscriptions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SubscriptionTable } from "@/components/subscriptions/SubscriptionTable";
import { SubscriptionModal } from "@/components/subscriptions/SubscriptionModal";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";

export default function Dashboard() {
  const { cognitoId, displayName, loading: isAuthLoading } = useUserProfile();
  const { toast } = useToast();

  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubscriptionItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const {
    subscriptions,
    loading: subsLoading,
    error: subsError,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    refetch,
  } = useSubscriptions({ cognitoId });

  const items: SubscriptionItem[] = subscriptions.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  const monthlySpend = getMonthlySpendFromSubs(subscriptions);
  const activeCount = getActiveCountFromSubs(subscriptions);
  const nextRenewal = getNextRenewalFromSubs(subscriptions);
  const yearlyCost = getYearlyCostFromSubs(subscriptions);

  const handleSelect = (sub: SubscriptionItem) => {
    setSelectedSub(sub);
    setViewModalOpen(true);
  };

  const handleEdit = (sub: SubscriptionItem) => {
    setViewModalOpen(false);
    setEditTarget(sub);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSubscription(id);
      setViewModalOpen(false);
      toast({ title: "Deleted", description: "Subscription removed." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    }
  };

  const handleAddSubmit = async (data: SubscriptionCreate) => {
    setFormLoading(true);
    try {
      await addSubscription(data);
      setAddModalOpen(false);
      toast({ title: "Added", description: `${data.name} added to your subscriptions.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Add failed",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (data: SubscriptionCreate) => {
    if (!editTarget) return;
    setFormLoading(true);
    try {
      await updateSubscription(editTarget.id, data);
      setEditModalOpen(false);
      setEditTarget(null);
      toast({ title: "Updated", description: `${data.name} updated.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Update failed",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);

  const formatRenewalDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-CA", { month: "long", day: "numeric" });

  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-2">
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[2rem]" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Welcome back,{" "}
            <span className="text-[#155885]">
              {displayName || "User"}
            </span>
            .
          </h1>
          <p className="text-white/40 text-lg">
            Here&apos;s your subscription overview for{" "}
            {new Date().toLocaleDateString("en-CA", { month: "long", year: "numeric" })}.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-6 py-3 h-auto bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-2xl font-bold shadow-xl shadow-[#155885]/20"
        >
          <Plus size={20} />
          <span>Add Subscription</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Spend"
          value={formatCurrency(monthlySpend)}
          subtitle="Across all active services"
          icon={TrendingUp}
          trend={subscriptions.length > 0 ? { value: `${activeCount} active`, positive: true } : undefined}
        />
        <MetricCard
          title="Active Services"
          value={String(activeCount)}
          subtitle={`${subscriptions.length} total tracked`}
          icon={CreditCard}
        />
        <MetricCard
          title="Next Renewal"
          value={nextRenewal?.nextBillingDate ? formatRenewalDate(nextRenewal.nextBillingDate) : "N/A"}
          subtitle={
            nextRenewal
              ? `${nextRenewal.name} - ${formatCurrency(Number(nextRenewal.price))}`
              : "No upcoming renewals"
          }
          icon={Calendar}
        />
        <MetricCard
          title="Yearly Cost"
          value={formatCurrency(yearlyCost)}
          subtitle="Projected annual total"
          icon={DollarSign}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Subscriptions</h2>
            <p className="text-white/40 text-sm">Manage and track all your services</p>
          </div>
        </div>

        {subsError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle size={18} />
            <p className="text-sm">{subsError}</p>
            <Button variant="ghost" size="sm" onClick={refetch} className="ml-auto text-red-400 hover:text-red-300">
              Retry
            </Button>
          </div>
        )}

        {subsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <SubscriptionTable
            subscriptions={items}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <SubscriptionModal
        subscription={selectedSub}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 sm:rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-black">Add Subscription</DialogTitle>
            <DialogDescription className="text-white/40">Track a new subscription or service.</DialogDescription>
          </DialogHeader>
          <SubscriptionForm
            onSubmit={handleAddSubmit}
            onCancel={() => setAddModalOpen(false)}
            isLoading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 sm:rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-black">Edit Subscription</DialogTitle>
            <DialogDescription className="text-white/40">Update subscription details.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <SubscriptionForm
              defaultValues={{
                name: editTarget.name,
                price: Number(editTarget.price),
                currency: editTarget.currency,
                billingCycle: editTarget.billingCycle,
                status: editTarget.status,
                category: editTarget.category ?? undefined,
                providerUrl: editTarget.providerUrl ?? undefined,
                nextBillingDate: editTarget.nextBillingDate ? new Date(editTarget.nextBillingDate) : undefined,
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setEditModalOpen(false);
                setEditTarget(null);
              }}
              isLoading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
