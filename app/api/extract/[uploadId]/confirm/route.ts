import { NextResponse } from "next/server";
import { query, getConnection } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { StatementUpload, ExtractedSubscriptionRow } from "@/lib/types/database";
import type { RowDataPacket } from "mysql2/promise";

type RouteParams = { params: Promise<{ uploadId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { uploadId } = await params;
    const id = parseInt(uploadId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
    }

    const { acceptedIds } = await request.json();

    if (!Array.isArray(acceptedIds) || acceptedIds.length === 0) {
      return NextResponse.json(
        { error: "acceptedIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const uploads = await query<(StatementUpload & RowDataPacket)[]>(
      "SELECT id, userId FROM StatementUpload WHERE id = ? LIMIT 1",
      [id]
    );

    if (uploads.length === 0) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (uploads[0].userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const numericIds = acceptedIds.map(Number);
    const placeholders = numericIds.map(() => "?").join(",");

    const extractions = await query<(ExtractedSubscriptionRow & RowDataPacket)[]>(
      `SELECT * FROM ExtractedSubscription WHERE id IN (${placeholders}) AND uploadId = ?`,
      [...numericIds, id]
    );

    if (extractions.length === 0) {
      return NextResponse.json(
        { error: "No matching extractions found for this upload" },
        { status: 404 }
      );
    }

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const extractionIds = extractions.map((e) => e.id);
      const updatePlaceholders = extractionIds.map(() => "?").join(",");
      await conn.execute(
        `UPDATE ExtractedSubscription SET reviewStatus = 'ACCEPTED' WHERE id IN (${updatePlaceholders})`,
        extractionIds
      );

      for (const ext of extractions) {
        await conn.execute(
          `INSERT INTO Subscription (userId, name, price, currency, billingCycle, providerUrl, nextBillingDate, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())`,
          [
            user.id,
            ext.name,
            ext.price,
            ext.currency,
            ext.billingCycle,
            ext.providerUrl,
            ext.nextBillingDate,
          ]
        );
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return NextResponse.json({ created: extractions.length });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to confirm extractions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
