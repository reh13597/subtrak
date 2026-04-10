import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { authHeaders } from "@/lib/client-auth";

async function parseErrorBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text.slice(0, 200) };
  }
}

export async function syncCurrentUserToDb(): Promise<string | null> {
  try {
    const currentUser = await getCurrentUser();
    const cognitoId = currentUser.userId;

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
    } catch (attrErr) {
      console.warn("[sync-user] Could not fetch attributes:", attrErr);
    }

    const headers = await authHeaders();
    const res = await fetch("/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify({ cognitoId, email, emailVerified, firstName, lastName }),
    });

    if (!res.ok) {
      const errorData = await parseErrorBody(res);
      if (process.env.NODE_ENV === "development") {
        console.warn("[sync-user] Sync API failed:", res.status, errorData);
      }
      return null;
    }

    return cognitoId;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[sync-user] Sync error:", err);
    }
    return null;
  }
}
