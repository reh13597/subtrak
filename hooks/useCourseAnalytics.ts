"use client";

import { useState, useEffect, useCallback } from "react";
import { authHeaders } from "@/lib/client-auth";
import type { CourseAnalyticsPayload } from "@/lib/types/course-analytics";

interface UseCourseAnalyticsOptions {
  cognitoId: string | null;
}

export function useCourseAnalytics({ cognitoId }: UseCourseAnalyticsOptions) {
  const [data, setData] = useState<CourseAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!cognitoId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/analytics", { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as {
          error?: string;
          code?: string;
        } | null;
        if (res.status === 503 || body?.code === "DB_UNAVAILABLE") {
          throw new Error(
            "Cannot reach the database. If you are on a new network, add your IP to the RDS security group or use a VPN."
          );
        }
        throw new Error(body?.error ?? "Failed to load analytics");
      }
      const json = (await res.json()) as CourseAnalyticsPayload;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [cognitoId]);

  useEffect(() => {
    if (!cognitoId) {
      setLoading(false);
      return;
    }
    void refetch();
  }, [cognitoId, refetch]);

  return { data, loading, error, refetch };
}
