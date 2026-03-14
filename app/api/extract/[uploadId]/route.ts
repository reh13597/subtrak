import { NextResponse } from "next/server";
import { query, execute, getConnection } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { extractSubscriptionsFromFile, calculateNextBillingDate } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import type { StatementUpload, ExtractedSubscriptionRow } from "@/lib/types/database";
import type { RowDataPacket } from "mysql2/promise";

type RouteParams = { params: Promise<{ uploadId: string }> };

const EXTRACT_MAX_PER_WINDOW = 5;
const EXTRACT_WINDOW_MS = 60 * 60 * 1000;

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { uploadId } = await params;
    const id = parseInt(uploadId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
    }

    const uploads = await query<(StatementUpload & RowDataPacket)[]>(
      "SELECT id, userId, fileName, mimeType, status, createdAt FROM StatementUpload WHERE id = ? LIMIT 1",
      [id]
    );

    if (uploads.length === 0) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (uploads[0].userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const extractions = await query<(ExtractedSubscriptionRow & RowDataPacket)[]>(
      "SELECT * FROM ExtractedSubscription WHERE uploadId = ? ORDER BY confidenceScore DESC",
      [id]
    );

    const items = extractions.map((e) => ({
      id: e.id,
      name: e.name,
      price: Number(e.price),
      currency: e.currency,
      billingCycle: e.billingCycle,
      providerUrl: e.providerUrl,
      lastChargeDate: e.lastChargeDate ? new Date(e.lastChargeDate).toISOString() : null,
      nextBillingDate: e.nextBillingDate ? new Date(e.nextBillingDate).toISOString() : null,
      confidenceScore: e.confidenceScore,
      reviewStatus: e.reviewStatus,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to fetch extractions" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);

    const rateLimitKey = `extract:${user.id}`;
    const { allowed, retryAfterMs } = checkRateLimit(
      rateLimitKey,
      EXTRACT_MAX_PER_WINDOW,
      EXTRACT_WINDOW_MS
    );

    if (!allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 60_000)} minute(s).` },
        { status: 429 }
      );
    }

    const { uploadId } = await params;
    const id = parseInt(uploadId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
    }

    const uploads = await query<(StatementUpload & RowDataPacket)[]>(
      "SELECT * FROM StatementUpload WHERE id = ? LIMIT 1",
      [id]
    );

    if (uploads.length === 0) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const upload = uploads[0];

    if (upload.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!upload.fileData) {
      return NextResponse.json({ error: "Upload has no file data" }, { status: 400 });
    }

    await execute(
      "UPDATE StatementUpload SET status = 'PROCESSING' WHERE id = ?",
      [id]
    );

    const result = await extractSubscriptionsFromFile(
      Buffer.from(upload.fileData),
      upload.mimeType,
      upload.fileName
    );

    if (!result.success) {
      await execute(
        "UPDATE StatementUpload SET status = 'FAILED' WHERE id = ?",
        [id]
      );
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const insertedIds: number[] = [];

      for (const item of result.data) {
        const lastChargeDate = item.lastChargeDate ? new Date(item.lastChargeDate) : null;
        const nextBillingDate = item.lastChargeDate
          ? calculateNextBillingDate(item.lastChargeDate, item.billingCycle)
          : null;

        const [insertResult] = await conn.execute<import("mysql2/promise").ResultSetHeader>(
          `INSERT INTO ExtractedSubscription (uploadId, name, price, currency, billingCycle, providerUrl, lastChargeDate, nextBillingDate, confidenceScore, reviewStatus, rawJson, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW())`,
          [
            id,
            item.name,
            item.price,
            item.currency,
            item.billingCycle,
            item.providerUrl ?? null,
            lastChargeDate,
            nextBillingDate,
            item.confidenceScore,
            JSON.stringify(item),
          ]
        );
        insertedIds.push(insertResult.insertId);
      }

      await conn.execute(
        "UPDATE StatementUpload SET status = 'DONE' WHERE id = ?",
        [id]
      );

      await conn.commit();

      if (insertedIds.length === 0) {
        return NextResponse.json({ items: [] });
      }

      const placeholders = insertedIds.map(() => "?").join(",");
      const [extractions] = await conn.query<(ExtractedSubscriptionRow & RowDataPacket)[]>(
        `SELECT * FROM ExtractedSubscription WHERE id IN (${placeholders}) ORDER BY confidenceScore DESC`,
        insertedIds
      );

      const items = extractions.map((e) => ({
        id: e.id,
        name: e.name,
        price: Number(e.price),
        currency: e.currency,
        billingCycle: e.billingCycle,
        providerUrl: e.providerUrl,
        lastChargeDate: e.lastChargeDate ? new Date(e.lastChargeDate).toISOString() : null,
        nextBillingDate: e.nextBillingDate ? new Date(e.nextBillingDate).toISOString() : null,
        confidenceScore: e.confidenceScore,
        reviewStatus: e.reviewStatus,
      }));

      return NextResponse.json({ items });
    } catch (txErr) {
      await conn.rollback();
      await execute(
        "UPDATE StatementUpload SET status = 'FAILED' WHERE id = ?",
        [id]
      );
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
