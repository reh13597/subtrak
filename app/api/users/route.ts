import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedCognitoId } from "@/lib/auth";
import { z } from "zod";

const syncUserSchema = z.object({
  cognitoId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().max(100).optional().default(""),
  lastName: z.string().max(100).optional().default(""),
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

    const user = await prisma.user.upsert({
      where: { cognitoId: verifiedCognitoId },
      update: {
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      },
      create: {
        cognitoId: verifiedCognitoId,
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }
}
