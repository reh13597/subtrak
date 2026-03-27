import { z } from "zod";

export const subscriptionCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  price: z.number().positive("Price must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("CAD"),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "WEEKLY", "CUSTOM"]).default("MONTHLY"),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).default("ACTIVE"),
  category: z.string().max(100).optional(),
  providerUrl: z.string().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  nextBillingDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

export const subscriptionFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "WEEKLY", "CUSTOM"]).optional(),
});

export type SubscriptionCreate = z.infer<typeof subscriptionCreateSchema>;
export type SubscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>;
export type SubscriptionFilter = z.infer<typeof subscriptionFilterSchema>;
