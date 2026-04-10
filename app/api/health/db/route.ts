import { NextResponse } from "next/server";
import { query, isDbConnectivityError } from "@/lib/db";

/**
 * Safe DB connectivity check for production debugging.
 * Does not expose secrets — only whether env is present and TCP/query succeeds.
 */
export async function GET() {
  const hasHost = Boolean(process.env.DB_HOST?.trim());
  const hasUser = Boolean(process.env.DB_USER);
  const hasName = Boolean(process.env.DB_NAME);

  if (!hasHost || !hasUser || !hasName) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        missing: [
          !hasHost && "DB_HOST",
          !hasUser && "DB_USER",
          !hasName && "DB_NAME",
        ].filter(Boolean),
      },
      { status: 503 }
    );
  }

  try {
    await query("SELECT 1 AS ok");
    return NextResponse.json({ ok: true, step: "db" });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "UNKNOWN";
    const status = isDbConnectivityError(err) ? 503 : 500;
    return NextResponse.json(
      { ok: false, step: "db", code },
      { status }
    );
  }
}
