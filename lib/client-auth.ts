import { fetchAuthSession } from "aws-amplify/auth";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getIdToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 60_000) {
    return cachedToken;
  }

  let lastError: any = null;
  for (let i = 0; i < 3; i++) {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString() ?? null;

      if (idToken) {
        cachedToken = idToken;
        const payload = JSON.parse(atob(idToken.split(".")[1]));
        tokenExpiry = (payload.exp ?? 0) * 1000;
        return idToken;
      }
      
      console.warn(`[getIdToken] Attempt ${i + 1}: No ID token in session. Tokens keys:`, Object.keys(session.tokens ?? {}));
    } catch (err) {
      lastError = err;
      console.warn(`[getIdToken] Attempt ${i + 1} failed:`, err);
    }
    // Wait a bit before retrying
    await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
  }

  console.error("[getIdToken] Exhausted retries. Last error:", lastError);
  cachedToken = null;
  tokenExpiry = 0;
  return null;
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
