import { describe, expect, it } from "vitest";
import { isDbConnectivityError } from "@/lib/db";

describe("isDbConnectivityError", () => {
  it("returns true for known mysql connectivity error codes", () => {
    expect(isDbConnectivityError({ code: "ETIMEDOUT" })).toBe(true);
    expect(isDbConnectivityError({ code: "ECONNREFUSED" })).toBe(true);
    expect(isDbConnectivityError({ code: "ENOTFOUND" })).toBe(true);
  });

  it("returns false for non-connectivity errors", () => {
    expect(isDbConnectivityError({ code: "ER_BAD_FIELD_ERROR" })).toBe(false);
    expect(isDbConnectivityError(null)).toBe(false);
    expect(isDbConnectivityError("ETIMEDOUT")).toBe(false);
  });
});
