import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}-under`;
    const max = 3;
    const windowMs = 60_000;

    expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);
    expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);
    expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);
  });

  it("blocks requests once the limit is exceeded", () => {
    const key = `test-${Date.now()}-block`;
    const max = 2;
    const windowMs = 60_000;

    expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);
    expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);

    const blocked = checkRateLimit(key, max, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});
