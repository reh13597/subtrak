import { NextResponse } from "next/server";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { query, isDbConnectivityError } from "@/lib/db";
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

  let cognitoId: string;
  try {
    const payload = await verifier.verify(token);
    if (!payload.sub) return null;
    cognitoId = payload.sub;
  } catch (error) {
    console.error("getAuthUser JWT verify failed:", error);
    return null;
  }

  try {
    const rows = await query<(User & RowDataPacket)[]>(
      "SELECT * FROM User WHERE cognitoId = ? LIMIT 1",
      [cognitoId]
    );
    return rows[0] ?? null;
  } catch (error) {
    if (isDbConnectivityError(error)) {
      console.error("getAuthUser database unreachable:", error);
      throw NextResponse.json(
        {
          error: "Database temporarily unavailable",
          code: "DB_UNAVAILABLE",
        },
        { status: 503 }
      );
    }
    console.error("getAuthUser database error:", error);
    throw NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
