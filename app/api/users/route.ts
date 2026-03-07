import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "aws-amplify/auth/server";

export async function POST(req: Request) {
  const { email, firstName, lastName } = await req.json();

  try {
    await db.query(
      "INSERT INTO users (id, email, first_name, last_name) VALUES (UUID(), ?, ?, ?)",
      [email, firstName, lastName]
    );
    return NextResponse.json({ message: "User created!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}