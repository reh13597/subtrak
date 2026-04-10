import type { BillingCycle } from "@/lib/types/database";

/** INNER JOIN ExtractedSubscription with StatementUpload (scoped to user via upload) */
export interface ExtractionUploadJoinRow {
  extractionId: number;
  extractionName: string;
  price: number;
  billingCycle: BillingCycle;
  uploadId: number;
  uploadFileName: string;
  uploadStatus: string;
}

/** Single-row aggregates over Subscription (no GROUP BY) */
export interface SubscriptionAggregateRow {
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  sumPrice: number;
}

/** GROUP BY billingCycle */
export interface SubscriptionByBillingCycleRow {
  billingCycle: BillingCycle;
  count: number;
  avgPrice: number;
  sumPrice: number;
}

/** Relational division style: user covers every distinct billingCycle present in Subscription */
export interface DivisionCheckRow {
  coversAllDistinctBillingCyclesInDatabase: boolean;
  distinctBillingCyclesInDatabase: number;
}

export interface CourseAnalyticsPayload {
  extractionUploadJoin: ExtractionUploadJoinRow[];
  subscriptionAggregates: SubscriptionAggregateRow;
  subscriptionByBillingCycle: SubscriptionByBillingCycleRow[];
  division: DivisionCheckRow;
}
