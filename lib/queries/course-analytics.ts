import { query } from "@/lib/db";
import type {
  CourseAnalyticsPayload,
  DivisionCheckRow,
  ExtractionUploadJoinRow,
  SubscriptionAggregateRow,
  SubscriptionByBillingCycleRow,
} from "@/lib/types/course-analytics";
import type { BillingCycle } from "@/lib/types/database";
import type { RowDataPacket } from "mysql2/promise";

type JoinPacket = RowDataPacket & {
  extractionId: number;
  extractionName: string;
  price: string | number;
  billingCycle: BillingCycle;
  uploadId: number;
  uploadFileName: string;
  uploadStatus: string;
};

type AggPacket = RowDataPacket & {
  cnt: number | string;
  avgPrice: string | number | null;
  minPrice: string | number | null;
  maxPrice: string | number | null;
  sumPrice: string | number | null;
};

type GroupPacket = RowDataPacket & {
  billingCycle: BillingCycle;
  cnt: number | string;
  avgPrice: string | number | null;
  sumPrice: string | number | null;
};

type DistinctCountPacket = RowDataPacket & { c: number | string };

type DivisionPacket = RowDataPacket & {
  coversAll: number | bigint | boolean | null;
};

/**
 * JOIN: each extraction row with its parent upload (user scoped via StatementUpload.userId).
 */
export async function getExtractionUploadJoinForUser(
  userId: number
): Promise<ExtractionUploadJoinRow[]> {
  const rows = await query<JoinPacket[]>(
    `SELECT
       es.id AS extractionId,
       es.name AS extractionName,
       es.price,
       es.billingCycle,
       su.id AS uploadId,
       su.fileName AS uploadFileName,
       su.status AS uploadStatus
     FROM ExtractedSubscription es
     INNER JOIN StatementUpload su ON su.id = es.uploadId
     WHERE su.userId = ?
     ORDER BY su.createdAt DESC, es.id ASC
     LIMIT 50`,
    [userId]
  );

  return rows.map((r) => ({
    extractionId: r.extractionId,
    extractionName: r.extractionName,
    price: Number(r.price),
    billingCycle: r.billingCycle,
    uploadId: r.uploadId,
    uploadFileName: r.uploadFileName,
    uploadStatus: r.uploadStatus,
  }));
}

/**
 * Aggregation without GROUP BY over the authenticated user's subscriptions.
 */
export async function getSubscriptionAggregatesForUser(
  userId: number
): Promise<SubscriptionAggregateRow> {
  const rows = await query<AggPacket[]>(
    `SELECT
       COUNT(*) AS cnt,
       AVG(price) AS avgPrice,
       MIN(price) AS minPrice,
       MAX(price) AS maxPrice,
       SUM(price) AS sumPrice
     FROM Subscription
     WHERE userId = ?`,
    [userId]
  );

  const r = rows[0];
  if (!r) {
    return { count: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, sumPrice: 0 };
  }

  return {
    count: Number(r.cnt),
    avgPrice: Number(r.avgPrice ?? 0),
    minPrice: Number(r.minPrice ?? 0),
    maxPrice: Number(r.maxPrice ?? 0),
    sumPrice: Number(r.sumPrice ?? 0),
  };
}

/**
 * Aggregation with GROUP BY billingCycle.
 */
export async function getSubscriptionAggregatesByBillingCycle(
  userId: number
): Promise<SubscriptionByBillingCycleRow[]> {
  const rows = await query<GroupPacket[]>(
    `SELECT
       billingCycle,
       COUNT(*) AS cnt,
       AVG(price) AS avgPrice,
       SUM(price) AS sumPrice
     FROM Subscription
     WHERE userId = ?
     GROUP BY billingCycle
     ORDER BY billingCycle ASC`,
    [userId]
  );

  return rows.map((r) => ({
    billingCycle: r.billingCycle,
    count: Number(r.cnt),
    avgPrice: Number(r.avgPrice ?? 0),
    sumPrice: Number(r.sumPrice ?? 0),
  }));
}

/**
 * Relational division style: true iff this user has at least one subscription
 * for every distinct billingCycle that appears anywhere in Subscription.
 * If the global table has no rows / no distinct cycles, returns false and count 0.
 */
export async function getDivisionCoverageForUser(userId: number): Promise<DivisionCheckRow> {
  const distinctRows = await query<DistinctCountPacket[]>(
    `SELECT COUNT(DISTINCT billingCycle) AS c FROM Subscription`,
    []
  );
  const distinctBillingCyclesInDatabase = Number(distinctRows[0]?.c ?? 0);

  if (distinctBillingCyclesInDatabase === 0) {
    return {
      coversAllDistinctBillingCyclesInDatabase: false,
      distinctBillingCyclesInDatabase: 0,
    };
  }

  const divRows = await query<DivisionPacket[]>(
    `SELECT NOT EXISTS (
       SELECT 1
       FROM (SELECT DISTINCT billingCycle AS bc FROM Subscription) AS u
       WHERE NOT EXISTS (
         SELECT 1 FROM Subscription s
         WHERE s.userId = ? AND s.billingCycle = u.bc
       )
     ) AS coversAll`,
    [userId]
  );

  const raw = divRows[0]?.coversAll;
  const covers =
    raw === true ||
    raw === 1 ||
    raw === BigInt(1) ||
    (typeof raw === "number" && raw !== 0);

  return {
    coversAllDistinctBillingCyclesInDatabase: Boolean(covers),
    distinctBillingCyclesInDatabase,
  };
}

export async function getCourseAnalyticsForUser(userId: number): Promise<CourseAnalyticsPayload> {
  const [extractionUploadJoin, subscriptionAggregates, subscriptionByBillingCycle, division] =
    await Promise.all([
      getExtractionUploadJoinForUser(userId),
      getSubscriptionAggregatesForUser(userId),
      getSubscriptionAggregatesByBillingCycle(userId),
      getDivisionCoverageForUser(userId),
    ]);

  return {
    extractionUploadJoin,
    subscriptionAggregates,
    subscriptionByBillingCycle,
    division,
  };
}
