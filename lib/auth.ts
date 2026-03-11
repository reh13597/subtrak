import { NextResponse } from "next/server";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { prisma } from "@/lib/prisma";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return request.headers.get("x-id-token");
}

export async function getAuthUser(request: Request) {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = await verifier.verify(token);
    const cognitoId = payload.sub;

    if (!cognitoId) return null;

    const user = await prisma.user.findUnique({
      where: { cognitoId },
    });

    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request) {
  const user = await getAuthUser(request);

  if (!user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return user;
}

export async function getVerifiedCognitoId(request: Request): Promise<string | null> {
  const token = extractToken(request);
  if (!token) return null;

  try {
    const payload = await verifier.verify(token);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
