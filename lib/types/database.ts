export type BillingCycle = "MONTHLY" | "YEARLY" | "WEEKLY" | "CUSTOM";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";
export type UploadStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";
export type ReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface User {
  id: number;
  cognitoId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: number;
  userId: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  category: string | null;
  providerUrl: string | null;
  nextBillingDate: Date | null;
  notes: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatementUpload {
  id: number;
  userId: number;
  fileName: string;
  fileData: Buffer | null;
  mimeType: string | null;
  status: UploadStatus;
  createdAt: Date;
}

export interface ExtractedSubscriptionRow {
  id: number;
  uploadId: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  providerUrl: string | null;
  lastChargeDate: Date | null;
  nextBillingDate: Date | null;
  confidenceScore: number;
  reviewStatus: ReviewStatus;
  rawJson: string | null;
  createdAt: Date;
}
