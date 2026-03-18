import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { authHeaders } from "@/lib/client-auth";

export async function syncCurrentUserToDb(): Promise<string | null> {
  try {
    console.log("[sync-user] Starting sync...");
    const currentUser = await getCurrentUser();
    const cognitoId = currentUser.userId;
    console.log("[sync-user] Cognito ID:", cognitoId);

    let email = "";
    let emailVerified = true;
    let firstName: string | null = null;
    let lastName: string | null = null;

    try {
      const attrs = await fetchUserAttributes();
      email = attrs.email ?? "";
      emailVerified = attrs.email_verified !== "false";
      firstName = attrs.given_name?.trim() || null;
      lastName = attrs.family_name?.trim() || null;
      console.log("[sync-user] Attributes:", { email, emailVerified, firstName, lastName });
    } catch (attrErr) {
      console.warn("[sync-user] Could not fetch attributes:", attrErr);
    }

    const headers = await authHeaders();
    if (!headers.Authorization) {
      console.error("[sync-user] No Authorization header generated!");
    }

    const res = await fetch("/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify({ cognitoId, email, emailVerified, firstName, lastName }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[sync-user] Sync API failed:", res.status, errorData);
      return null;
    }

    console.log("[sync-user] Sync successful!");
    return cognitoId;
  } catch (err) {
    console.error("[sync-user] Sync error:", err);
    return null;
  }
}
