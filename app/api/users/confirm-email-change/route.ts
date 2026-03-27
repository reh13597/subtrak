import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AdminUpdateUserAttributesCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";

const confirmSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  code: z.string().min(6, "Code must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { newEmail, code } = parsed.data;
    const normalizedNewEmail = newEmail.trim().toLowerCase();

    // If verified by Amplify, we skip the Cognito admin update as it's already done
    if (code === "VERIFIED_BY_AMPLIFY") {
      await execute(
        "UPDATE User SET email = ?, updatedAt = NOW() WHERE cognitoId = ?",
        [normalizedNewEmail, user.cognitoId]
      );
      
      await execute("DELETE FROM PendingEmailChange WHERE userId = ?", [user.id]);

      return NextResponse.json({
        message: "Email synced successfully",
        email: normalizedNewEmail,
      });
    }

    const rows = await query<RowDataPacket[]>(
      "SELECT id, newEmail, code, expiresAt FROM PendingEmailChange WHERE userId = ? ORDER BY createdAt DESC LIMIT 1",
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No pending email change. Request a new verification code." },
        { status: 400 }
      );
    }

    const pending = rows[0];

    if (pending.newEmail !== normalizedNewEmail) {
      return NextResponse.json(
        { error: "Email does not match the pending change request." },
        { status: 400 }
      );
    }

    if (pending.code !== code.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    const expiresAt = new Date(pending.expiresAt);

    if (expiresAt <= new Date()) {
      await execute("DELETE FROM PendingEmailChange WHERE userId = ?", [user.id]);
      return NextResponse.json(
        { error: "Verification code has expired. Request a new one." },
        { status: 400 }
      );
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1",
    });

    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;

    if (!userPoolId) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    await client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: user.cognitoId,
        UserAttributes: [
          { Name: "email", Value: normalizedNewEmail },
          { Name: "email_verified", Value: "true" },
        ],
      })
    );

    await execute("DELETE FROM PendingEmailChange WHERE userId = ?", [user.id]);

    await execute(
      "UPDATE User SET email = ?, updatedAt = NOW() WHERE id = ?",
      [normalizedNewEmail, user.id]
    );

    return NextResponse.json({
      message: "Email updated successfully",
      email: normalizedNewEmail,
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to confirm email change" }, { status: 500 });
  }
}
