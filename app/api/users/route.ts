import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { cognitoId, email, firstName, lastName } = await request.json();

    if (!cognitoId || !email) {
      return NextResponse.json(
        { error: "cognitoId and email are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { cognitoId },
      update: { email, firstName, lastName },
      create: { cognitoId, email, firstName, lastName },
    });

    return NextResponse.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upsert user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
