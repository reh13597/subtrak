export interface MockSubscription {
  id: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY" | "WEEKLY" | "CUSTOM";
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  category: string;
  providerUrl: string;
  nextBillingDate: string;
  icon: string;
}

export const mockSubscriptions: MockSubscription[] = [
  {
    id: 1,
    name: "Netflix",
    price: 16.49,
    currency: "CAD",
    billingCycle: "MONTHLY",
    status: "ACTIVE",
    category: "Entertainment",
    providerUrl: "https://netflix.com",
    nextBillingDate: "2026-04-01",
    icon: "🎬",
  },
  {
    id: 2,
    name: "Spotify",
    price: 10.99,
    currency: "CAD",
    billingCycle: "MONTHLY",
    status: "ACTIVE",
    category: "Music",
    providerUrl: "https://spotify.com",
    nextBillingDate: "2026-03-28",
    icon: "🎵",
  },
  {
    id: 3,
    name: "GitHub",
    price: 4.0,
    currency: "USD",
    billingCycle: "MONTHLY",
    status: "ACTIVE",
    category: "Developer Tools",
    providerUrl: "https://github.com",
    nextBillingDate: "2026-03-15",
    icon: "💻",
  },
  {
    id: 4,
    name: "AWS",
    price: 156.0,
    currency: "USD",
    billingCycle: "MONTHLY",
    status: "ACTIVE",
    category: "Cloud",
    providerUrl: "https://aws.amazon.com",
    nextBillingDate: "2026-04-01",
    icon: "☁️",
  },
  {
    id: 5,
    name: "Adobe Creative Cloud",
    price: 79.99,
    currency: "CAD",
    billingCycle: "MONTHLY",
    status: "ACTIVE",
    category: "Design",
    providerUrl: "https://adobe.com",
    nextBillingDate: "2026-03-20",
    icon: "🎨",
  },
  {
    id: 6,
    name: "Google One",
    price: 39.99,
    currency: "CAD",
    billingCycle: "YEARLY",
    status: "ACTIVE",
    category: "Storage",
    providerUrl: "https://one.google.com",
    nextBillingDate: "2026-09-12",
    icon: "📦",
  },
  {
    id: 7,
    name: "ChatGPT Plus",
    price: 20.0,
    currency: "USD",
    billingCycle: "MONTHLY",
    status: "PAUSED",
    category: "AI",
    providerUrl: "https://chat.openai.com",
    nextBillingDate: "2026-03-22",
    icon: "🤖",
  },
  {
    id: 8,
    name: "Disney+",
    price: 11.99,
    currency: "CAD",
    billingCycle: "MONTHLY",
    status: "CANCELLED",
    category: "Entertainment",
    providerUrl: "https://disneyplus.com",
    nextBillingDate: "2026-04-05",
    icon: "✨",
  },
];

export function getMonthlySpend(): number {
  return mockSubscriptions
    .filter((sub) => sub.status === "ACTIVE")
    .reduce((total, sub) => {
      if (sub.billingCycle === "YEARLY") return total + sub.price / 12;
      if (sub.billingCycle === "WEEKLY") return total + sub.price * 4;
      return total + sub.price;
    }, 0);
}

export function getActiveCount(): number {
  return mockSubscriptions.filter((sub) => sub.status === "ACTIVE").length;
}

export function getNextRenewal(): MockSubscription | null {
  const active = mockSubscriptions.filter((sub) => sub.status === "ACTIVE");
  if (active.length === 0) return null;

  return active.reduce((earliest, sub) =>
    sub.nextBillingDate < earliest.nextBillingDate ? sub : earliest
  );
}

export function getYearlyCost(): number {
  return mockSubscriptions
    .filter((sub) => sub.status === "ACTIVE")
    .reduce((total, sub) => {
      if (sub.billingCycle === "YEARLY") return total + sub.price;
      if (sub.billingCycle === "WEEKLY") return total + sub.price * 52;
      return total + sub.price * 12;
    }, 0);
}
