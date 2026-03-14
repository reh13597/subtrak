import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { subscriptionCreateSchema } from "@/lib/validations/subscription";
import { z } from "zod";
import type { Subscription } from "@/lib/types/database";
import type { RowDataPacket } from "mysql2/promise";

const querySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "WEEKLY", "CUSTOM"]).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      billingCycle: searchParams.get("billingCycle") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { search, status, billingCycle } = parsed.data;
    const conditions: string[] = ["userId = ?"];
    const params: (string | number | null)[] = [user.id];

    if (search) {
      conditions.push("name LIKE ?");
      params.push(`%${search}%`);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (billingCycle) {
      conditions.push("billingCycle = ?");
      params.push(billingCycle);
    }

    const subscriptions = await query<(Subscription & RowDataPacket)[]>(
      `SELECT * FROM Subscription WHERE ${conditions.join(" AND ")} ORDER BY createdAt DESC`,
      params
    );

    return NextResponse.json({ subscriptions });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = subscriptionCreateSchema.parse(body);

    const result = await execute(
      `INSERT INTO Subscription (userId, name, price, currency, billingCycle, status, category, providerUrl, nextBillingDate, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user.id,
        data.name,
        data.price,
        data.currency,
        data.billingCycle,
        data.status,
        data.category ?? null,
        data.providerUrl || null,
        data.nextBillingDate ?? null,
        data.notes ?? null,
      ]
    );

    const rows = await query<(Subscription & RowDataPacket)[]>(
      "SELECT * FROM Subscription WHERE id = ?",
      [result.insertId]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
