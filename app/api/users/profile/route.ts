import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  email: z.string().email().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const setClauses: string[] = ["updatedAt = NOW()"];
    const params: (string | number | null)[] = [];

    if (data.firstName !== undefined) {
      setClauses.push("firstName = ?");
      params.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      setClauses.push("lastName = ?");
      params.push(data.lastName);
    }
    if (data.email !== undefined) {
      setClauses.push("email = ?");
      params.push(data.email);
    }

    params.push(user.id);

    await execute(
      `UPDATE User SET ${setClauses.join(", ")} WHERE id = ?`,
      params
    );

    return NextResponse.json({
      id: user.id,
      email: data.email ?? user.email,
      firstName: data.firstName ?? user.firstName,
      lastName: data.lastName ?? user.lastName,
      createdAt: user.createdAt,
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues.map((i) => i.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
