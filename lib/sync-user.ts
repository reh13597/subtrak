import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { authHeaders } from "@/lib/client-auth";

export async function syncCurrentUserToDb(): Promise<string | null> {
  try {
    const currentUser = await getCurrentUser();
    const cognitoId = currentUser.userId;

    let email = "";
    let firstName = "";
    let lastName = "";

    try {
      const attrs = await fetchUserAttributes();
      email = attrs.email ?? "";
      firstName = attrs.given_name ?? "";
      lastName = attrs.family_name ?? "";
    } catch {
      // attributes may not be available in all contexts
    }

    const headers = await authHeaders();
    const res = await fetch("/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify({ cognitoId, email, firstName, lastName }),
    });

    if (!res.ok) {
      return null;
    }

    return cognitoId;
  } catch {
    return null;
  }
}
