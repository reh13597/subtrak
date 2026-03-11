"use client";

import { useState, useEffect, useCallback } from "react";
import type { SubscriptionCreate } from "@/lib/validations/subscription";

export interface Subscription {
  id: number;
  userId: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY" | "WEEKLY" | "CUSTOM";
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  category: string | null;
  providerUrl: string | null;
  nextBillingDate: string | null;
  notes: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseSubscriptionsOptions {
  cognitoId: string | null;
}

export function useSubscriptions({ cognitoId }: UseSubscriptionsOptions) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (cognitoId) h["x-user-cognito-id"] = cognitoId;
    return h;
  };

  const fetchSubscriptions = useCallback(async () => {
    if (!cognitoId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions", {
        headers: { "x-user-cognito-id": cognitoId },
      });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [cognitoId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = useCallback(
    async (data: SubscriptionCreate) => {
      if (!cognitoId) return;
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to add subscription");
      }
      const created = await res.json();
      setSubscriptions((prev) => [created, ...prev]);
      return created;
    },
    [cognitoId]
  );

  const updateSubscription = useCallback(
    async (id: number, data: Partial<SubscriptionCreate>) => {
      if (!cognitoId) return;
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update subscription");
      }
      const updated = await res.json();
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
      return updated;
    },
    [cognitoId]
  );

  const deleteSubscription = useCallback(
    async (id: number) => {
      if (!cognitoId) return;
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
        headers: { "x-user-cognito-id": cognitoId },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete subscription");
      }
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    },
    [cognitoId]
  );

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
}

export function getMonthlySpendFromSubs(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === "ACTIVE")
    .reduce((total, s) => {
      const price = Number(s.price);
      if (s.billingCycle === "YEARLY") return total + price / 12;
      if (s.billingCycle === "WEEKLY") return total + price * 4;
      return total + price;
    }, 0);
}

export function getActiveCountFromSubs(subs: Subscription[]): number {
  return subs.filter((s) => s.status === "ACTIVE").length;
}

export function getNextRenewalFromSubs(subs: Subscription[]): Subscription | null {
  const active = subs.filter(
    (s) => s.status === "ACTIVE" && s.nextBillingDate
  );
  if (active.length === 0) return null;
  return active.reduce((earliest, s) =>
    s.nextBillingDate! < earliest.nextBillingDate! ? s : earliest
  );
}

export function getYearlyCostFromSubs(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === "ACTIVE")
    .reduce((total, s) => {
      const price = Number(s.price);
      if (s.billingCycle === "YEARLY") return total + price;
      if (s.billingCycle === "WEEKLY") return total + price * 52;
      return total + price * 12;
    }, 0);
}
