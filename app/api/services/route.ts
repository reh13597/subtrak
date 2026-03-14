import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  try {
    const rows = await query<RowDataPacket[]>("SELECT * FROM Service");
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
