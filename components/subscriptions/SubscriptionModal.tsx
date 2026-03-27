"use client";

import { useState } from "react";
import {
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  Tag,
  Globe,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import type { SubscriptionItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const statusColors: Record<SubscriptionItem["status"], string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PAUSED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface SubscriptionModalProps {
  subscription: SubscriptionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (subscription: SubscriptionItem) => void;
  onDelete: (id: number) => void;
}

export function SubscriptionModal({
  subscription,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: SubscriptionModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!subscription) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
    }).format(price);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(subscription.id);
      setConfirmDelete(false);
      onOpenChange(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setConfirmDelete(false);
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 sm:rounded-2xl max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {subscription.icon && <span className="text-3xl">{subscription.icon}</span>}
            <div>
              <DialogTitle className="text-white text-xl font-black">
                {subscription.name}
              </DialogTitle>
              <DialogDescription className="text-white/40">
                {subscription.category}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Badge
              className={cn(
                "rounded-full text-xs font-semibold border",
                statusColors[subscription.status]
              )}
            >
              {subscription.status}
            </Badge>
            <span className="text-2xl font-black text-white">
              {formatPrice(subscription.price, subscription.currency)}
            </span>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-3">
            <DetailRow icon={RefreshCw} label="Billing Cycle">
              <span className="capitalize">
                {subscription.billingCycle.toLowerCase()}
              </span>
            </DetailRow>
            <DetailRow icon={DollarSign} label="Currency">
              {subscription.currency}
            </DetailRow>
            {subscription.nextBillingDate && (
              <DetailRow icon={Calendar} label="Next Billing">
                {formatDate(subscription.nextBillingDate)}
              </DetailRow>
            )}
            {subscription.category && (
              <DetailRow icon={Tag} label="Category">
                {subscription.category}
              </DetailRow>
            )}
            {subscription.providerUrl && (
              <DetailRow icon={Globe} label="Provider">
                <a
                  href={subscription.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#155885] hover:underline inline-flex items-center gap-1"
                >
                  {new URL(subscription.providerUrl).hostname}
                  <ExternalLink size={12} />
                </a>
              </DetailRow>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {confirmDelete ? (
            <>
              <p className="text-sm text-red-400 flex-1">
                Are you sure? This cannot be undone.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onEdit(subscription)}
                className="border-white/10 text-white hover:bg-white/5"
              >
                <Pencil size={14} />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/40 flex items-center gap-2">
        <Icon size={14} className="text-white/20" />
        {label}
      </span>
      <span className="text-white">{children}</span>
    </div>
  );
}
