import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getAuthUser(request: Request) {
  const cognitoId = request.headers.get("x-user-cognito-id");

  if (!cognitoId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { cognitoId },
  });

  return user;
}

export async function requireAuth(request: Request) {
  const user = await getAuthUser(request);

  if (!user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return user;
}
