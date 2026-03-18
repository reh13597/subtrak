import { NextResponse } from "next/server";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { query } from "@/lib/db";
import type { User } from "@/lib/types/database";
import type { RowDataPacket } from "mysql2/promise";

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

export async function getAuthUser(request: Request): Promise<User | null> {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = await verifier.verify(token);
    const cognitoId = payload.sub;

    if (!cognitoId) return null;

    const rows = await query<(User & RowDataPacket)[]>(
      "SELECT * FROM User WHERE cognitoId = ? LIMIT 1",
      [cognitoId]
    );

    return rows[0] ?? null;
  } catch (error) {
    console.error("getAuthUser verifier error:", error);
    return null;
  }
}

export async function requireAuth(request: Request): Promise<User> {
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
  } catch (error) {
    console.error("getVerifiedCognitoId verifier error:", error);
    return null;
  }
}
