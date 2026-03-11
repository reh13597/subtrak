import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  const { Email, Password, FirstName, LastName, DateJoined } = await req.json();

  try {
    const dateJoined = DateJoined || new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(
      "INSERT INTO User (Email, Password, FirstName, LastName, DateJoined) VALUES (?, ?, ?, ?, ?)",
      [Email, Password, FirstName, LastName, dateJoined]
    );
    return NextResponse.json({ message: "User created!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}