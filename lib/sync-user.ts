import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";

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

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cognitoId, email, firstName, lastName }),
    });

    if (!res.ok) {
      console.error("Failed to sync user to database:", await res.text());
      return null;
    }

    return cognitoId;
  } catch {
    return null;
  }
}
