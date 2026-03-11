import { fetchAuthSession } from "aws-amplify/auth";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getIdToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 60_000) {
    return cachedToken;
  }

  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() ?? null;

    if (idToken) {
      cachedToken = idToken;
      const payload = JSON.parse(atob(idToken.split(".")[1]));
      tokenExpiry = (payload.exp ?? 0) * 1000;
    }

    return idToken;
  } catch {
    cachedToken = null;
    tokenExpiry = 0;
    return null;
  }
}

export function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = 0;
}

export async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function authHeadersFormData(): Promise<Record<string, string>> {
  const token = await getIdToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
