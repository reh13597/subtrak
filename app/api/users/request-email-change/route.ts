import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendEmailChangeVerification } from "@/lib/send-verification-email";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";

const requestSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

const CODE_EXPIRY_MINUTES = 15;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const newEmail = parsed.data.newEmail.trim().toLowerCase();
    const currentEmail = (user.email ?? "").trim().toLowerCase();

    if (newEmail === currentEmail) {
      return NextResponse.json(
        { error: "New email is the same as your current email" },
        { status: 400 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    await execute(
      "DELETE FROM PendingEmailChange WHERE userId = ?",
      [user.id]
    );

    await execute(
      "INSERT INTO PendingEmailChange (userId, newEmail, code, expiresAt) VALUES (?, ?, ?, ?)",
      [user.id, newEmail, code, expiresAt]
    );

    const sent = await sendEmailChangeVerification(currentEmail, code);

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send verification email. Please check your email configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent to your current email address",
      expiresInMinutes: CODE_EXPIRY_MINUTES,
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Unknown error";
    const isTableMissing = typeof message === "string" && message.includes("doesn't exist");
    return NextResponse.json(
      {
        error: isTableMissing
          ? "Database table PendingEmailChange is missing. Run the migration: sql/schema.sql"
          : "Failed to request email change",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
