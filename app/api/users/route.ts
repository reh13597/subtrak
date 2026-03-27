import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getVerifiedCognitoId } from "@/lib/auth";
import { z } from "zod";
import type { User } from "@/lib/types/database";
import type { RowDataPacket } from "mysql2/promise";

const syncUserSchema = z.object({
  cognitoId: z.string().min(1),
  email: z.string().email(),
  emailVerified: z.boolean().optional().default(true),
  firstName: z.string().max(100).nullable().optional().default(null),
  lastName: z.string().max(100).nullable().optional().default(null),
});

export async function POST(request: Request) {
  try {
    const verifiedCognitoId = await getVerifiedCognitoId(request);

    if (!verifiedCognitoId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = syncUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    if (parsed.data.cognitoId !== verifiedCognitoId) {
      return NextResponse.json({ error: "Forbidden: cognitoId mismatch" }, { status: 403 });
    }

    const result = await execute(
      `INSERT INTO User (cognitoId, email, firstName, lastName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       cognitoId = VALUES(cognitoId),
       email = VALUES(email),
       firstName = COALESCE(VALUES(firstName), firstName),
       lastName = COALESCE(VALUES(lastName), lastName),
       updatedAt = NOW()`,
      [
        verifiedCognitoId,
        parsed.data.email,
        parsed.data.firstName,
        parsed.data.lastName,
      ]
    );

    console.log("[api/users] Upsert result: affectedRows =", result.affectedRows, ", insertId =", result.insertId);

    const rows = await query<(User & RowDataPacket)[]>(
      "SELECT * FROM User WHERE cognitoId = ? LIMIT 1",
      [verifiedCognitoId]
    );

    console.log("[api/users] Query results for", verifiedCognitoId, ":", rows.length, "rows found");

    if (rows.length === 0) {
      console.error("[api/users] CRITICAL: User not found in DB immediately after UPSERT!");
      return NextResponse.json({ error: "User sync failed: record not created" }, { status: 500 });
    }

    const user = rows[0];

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("[api/users] POST Error:", err);
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ 
      error: "Failed to upsert user",
      detail: message 
    }, { status: 500 });
  }
}
