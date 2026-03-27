export interface SubscriptionItem {
  id: number;
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
}
