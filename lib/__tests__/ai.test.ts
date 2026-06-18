import { describe, expect, it } from "vitest";
import { calculateNextBillingDate } from "@/lib/ai";

function expectedAfter(input: string, mutate: (date: Date) => void): Date {
  const date = new Date(input);
  mutate(date);
  return date;
}

describe("calculateNextBillingDate", () => {
  it("adds one week for WEEKLY billing", () => {
    const input = "2024-06-10";
    const expected = expectedAfter(input, (date) => date.setDate(date.getDate() + 7));
    const result = calculateNextBillingDate(input, "WEEKLY");
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("adds one month for MONTHLY billing", () => {
    const input = "2024-01-15";
    const expected = expectedAfter(input, (date) => date.setMonth(date.getMonth() + 1));
    const result = calculateNextBillingDate(input, "MONTHLY");
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("adds one year for YEARLY billing", () => {
    const input = "2024-06-15";
    const expected = expectedAfter(input, (date) => date.setFullYear(date.getFullYear() + 1));
    const result = calculateNextBillingDate(input, "YEARLY");
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("defaults CUSTOM to one month", () => {
    const input = "2024-06-10";
    const expected = expectedAfter(input, (date) => date.setMonth(date.getMonth() + 1));
    const result = calculateNextBillingDate(input, "CUSTOM");
    expect(result.getTime()).toBe(expected.getTime());
  });
});
