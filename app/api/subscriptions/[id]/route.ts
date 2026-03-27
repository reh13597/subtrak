import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { subscriptionUpdateSchema } from "@/lib/validations/subscription";
import type { Subscription } from "@/lib/types/database";
import type { RowDataPacket } from "mysql2/promise";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json({ error: "Invalid subscription ID" }, { status: 400 });
    }

    const rows = await query<(Subscription & RowDataPacket)[]>(
      "SELECT * FROM Subscription WHERE id = ? LIMIT 1",
      [subscriptionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (rows[0].userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to fetch subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json({ error: "Invalid subscription ID" }, { status: 400 });
    }

    const existing = await query<(Subscription & RowDataPacket)[]>(
      "SELECT * FROM Subscription WHERE id = ? LIMIT 1",
      [subscriptionId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (existing[0].userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id: _id, ...data } = subscriptionUpdateSchema.parse({ ...body, id: subscriptionId });

    const setClauses: string[] = ["updatedAt = NOW()"];
    const updateParams: (string | number | boolean | null | Date)[] = [];

    if (data.name !== undefined) { setClauses.push("name = ?"); updateParams.push(data.name); }
    if (data.price !== undefined) { setClauses.push("price = ?"); updateParams.push(data.price); }
    if (data.currency !== undefined) { setClauses.push("currency = ?"); updateParams.push(data.currency); }
    if (data.billingCycle !== undefined) { setClauses.push("billingCycle = ?"); updateParams.push(data.billingCycle); }
    if (data.status !== undefined) { setClauses.push("status = ?"); updateParams.push(data.status); }
    if (data.category !== undefined) { setClauses.push("category = ?"); updateParams.push(data.category); }
    if (data.providerUrl !== undefined) { setClauses.push("providerUrl = ?"); updateParams.push(data.providerUrl || null); }
    if (data.nextBillingDate !== undefined) { setClauses.push("nextBillingDate = ?"); updateParams.push(data.nextBillingDate); }
    if (data.notes !== undefined) { setClauses.push("notes = ?"); updateParams.push(data.notes); }

    updateParams.push(subscriptionId);

    await execute(
      `UPDATE Subscription SET ${setClauses.join(", ")} WHERE id = ?`,
      updateParams
    );

    const updated = await query<(Subscription & RowDataPacket)[]>(
      "SELECT * FROM Subscription WHERE id = ? LIMIT 1",
      [subscriptionId]
    );

    return NextResponse.json(updated[0]);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: (err as any).issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to update subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const subscriptionId = parseInt(id);

    if (isNaN(subscriptionId)) {
      return NextResponse.json({ error: "Invalid subscription ID" }, { status: 400 });
    }

    const existing = await query<(Subscription & RowDataPacket)[]>(
      "SELECT * FROM Subscription WHERE id = ? LIMIT 1",
      [subscriptionId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (existing[0].userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await execute("DELETE FROM Subscription WHERE id = ?", [subscriptionId]);

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Failed to delete subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
