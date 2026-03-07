import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const [rows] = await db.query("SELECT * FROM subscriptions");
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { name, cost, billing_cycle, user_id } = await req.json();
  await db.query(
    "INSERT INTO subscriptions (name, cost, billing_cycle, user_id) VALUES (?, ?, ?, ?)",
    [name, cost, billing_cycle, user_id]
  );
  return NextResponse.json({ message: "Subscription added!" });
}