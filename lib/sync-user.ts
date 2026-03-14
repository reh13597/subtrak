import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { authHeaders } from "@/lib/client-auth";

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
    } catch {
      // attributes may not be available in all contexts
    }

    const headers = await authHeaders();
    const res = await fetch("/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify({ cognitoId, email, emailVerified, firstName, lastName }),
    });

    if (!res.ok) {
      return null;
    }

    return cognitoId;
  } catch {
    return null;
  }
}
