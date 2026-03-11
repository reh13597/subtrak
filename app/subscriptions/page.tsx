"use client";

import { useState, useCallback } from "react";
import { CreditCard, Plus, Sparkles, AlertCircle } from "lucide-react";
import type { SubscriptionItem } from "@/lib/types";
import type { SubscriptionCreate } from "@/lib/validations/subscription";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { SubscriptionTable } from "@/components/subscriptions/SubscriptionTable";
import { SubscriptionModal } from "@/components/subscriptions/SubscriptionModal";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { StatementUploader } from "@/components/upload/StatementUploader";
import {
  ExtractedPreview,
  type ExtractedItem,
} from "@/components/upload/ExtractedPreview";
import { authHeaders } from "@/lib/client-auth";

type ExtractionFlow = "upload" | "preview" | "confirmed";

export default function SubscriptionsPage() {
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubscriptionItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { cognitoId, loading: authLoading } = useUserProfile();
  const [flowState, setFlowState] = useState<ExtractionFlow>("upload");
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const { toast } = useToast();

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

  const handleUploadComplete = useCallback(async (id: number) => {
    setUploadId(id);
    setLoadingItems(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/extract/${id}`, { headers });
      if (res.ok) {
        const data = (await res.json()) as { items: ExtractedItem[] };
        setExtractedItems(data.items ?? []);
        setFlowState("preview");
      }
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const handleConfirm = () => {
    setFlowState("confirmed");
    setExtractedItems([]);
    setUploadId(null);
    refetch();
  };

  const resetFlow = () => {
    setFlowState("upload");
    setExtractedItems([]);
    setUploadId(null);
  };

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
      toast({ title: "Added", description: `${data.name} added.` });
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Subscriptions</h1>
              <p className="text-white/40">Manage and track all your active services in one place.</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-6 py-3 h-auto bg-[#155885] hover:bg-[#1a6ba1] text-white rounded-2xl font-bold shadow-xl shadow-[#155885]/20"
        >
          <Plus size={20} />
          <span>New Subscription</span>
        </Button>
      </div>

      {/* AI Statement Extraction */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#155885]/10 flex items-center justify-center text-[#155885]">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">AI Statement Extraction</h2>
            <p className="text-white/40 text-sm">Upload a bank statement and let AI find your subscriptions.</p>
          </div>
        </div>

        {authLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : cognitoId ? (
          <>
            {(flowState === "upload" || flowState === "confirmed") && (
              <>
                {flowState === "confirmed" && (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-3">
                    <CreditCard size={18} className="text-emerald-400" />
                    <p className="text-emerald-400 text-sm font-semibold">Subscriptions saved successfully!</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFlow}
                      className="ml-auto text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl text-xs"
                    >
                      Upload another
                    </Button>
                  </div>
                )}
                <StatementUploader onUploadComplete={handleUploadComplete} />
              </>
            )}

            {loadingItems && (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            )}

            {flowState === "preview" && uploadId !== null && extractedItems.length > 0 && (
              <ExtractedPreview
                items={extractedItems}
                uploadId={uploadId}
                onConfirm={handleConfirm}
              />
            )}
          </>
        ) : null}
      </section>

      <Separator className="bg-white/10" />

      {/* Subscription Table */}
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
