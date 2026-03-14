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

    await execute(
      `INSERT INTO User (cognitoId, email, firstName, lastName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       email = IF(?, VALUES(email), email),
       firstName = VALUES(firstName),
       lastName = VALUES(lastName),
       updatedAt = NOW()`,
      [
        verifiedCognitoId,
        parsed.data.email,
        parsed.data.firstName,
        parsed.data.lastName,
        parsed.data.emailVerified,
      ]
    );

    const rows = await query<(User & RowDataPacket)[]>(
      "SELECT * FROM User WHERE cognitoId = ? LIMIT 1",
      [verifiedCognitoId]
    );

    const user = rows[0];

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }
}
