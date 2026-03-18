import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const extractionSchema = z.array(
  z.object({
    name: z.string(),
    price: z.number(),
    currency: z.string(),
    billingCycle: z.enum(["MONTHLY", "YEARLY", "WEEKLY", "CUSTOM"]),
    providerUrl: z.string().optional(),
    lastChargeDate: z.string().optional(),
    confidenceScore: z.number().min(0).max(1),
  })
);

export type ExtractedSubscription = z.infer<typeof extractionSchema>[number];

const EXTRACTION_PROMPT = `You are a financial data extraction assistant. Analyze the attached bank statement and extract all recurring subscription charges.

For each subscription found, return a JSON object with these fields:
- name (string): The subscription service name (clean, human-readable, e.g. "Netflix", "Spotify", "Adobe Creative Cloud")
- price (number): The charge amount as a positive number
- currency (string): The 3-letter currency code (e.g. "CAD", "USD")
- billingCycle (string): One of "MONTHLY", "YEARLY", "WEEKLY", or "CUSTOM"
- providerUrl (string): The official website URL where the user can manage or cancel their subscription (e.g. "https://www.netflix.com", "https://www.spotify.com"). You MUST provide this for every known service.
- lastChargeDate (string): The date when this subscription was last charged, in ISO 8601 format (YYYY-MM-DD). Read this directly from the bank statement transaction date.
- confidenceScore (number): Your confidence in the extraction from 0 to 1

Important:
- For providerUrl, always provide the main website URL for well-known services. For lesser-known ones, provide your best guess or omit.
- For lastChargeDate, read the exact transaction date from the statement. This is critical for calculating the next billing date.

Return ONLY a raw JSON array. No markdown, no code fences, no commentary. If no subscriptions are found, return an empty array [].`;

function mimeTypeForFile(mimeType: string | null, fileName: string): string {
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) return "application/pdf";
  if (mimeType === "text/csv" || fileName.endsWith(".csv")) return "text/csv";
  return mimeType || "application/octet-stream";
}

export function calculateNextBillingDate(lastChargeDate: string, billingCycle: string): Date {
  const date = new Date(lastChargeDate);

  switch (billingCycle) {
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "MONTHLY":
    case "CUSTOM":
    default:
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date;
}

export async function extractSubscriptionsFromFile(
  fileData: Buffer,
  mimeType: string | null,
  fileName: string
): Promise<{ success: true; data: ExtractedSubscription[] } | { success: false; error: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return { success: false, error: "GEMINI_API_KEY is missing from environment variables." };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the exact model name discovered in your curl output
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" }
    );

    const resolvedMime = mimeTypeForFile(mimeType, fileName);
    const base64Data = fileData.toString("base64");

    const result = await model.generateContent([
      { text: EXTRACTION_PROMPT },
      {
        inlineData: {
          mimeType: resolvedMime,
          data: base64Data,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return {
        success: false,
        error: "Failed to parse AI response as JSON. The model returned an invalid format.",
      };
    }

    const validated = extractionSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        success: false,
        error: `Validation failed: ${validated.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return { success: true, data: validated.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during AI extraction";
    return { success: false, error: message };
  }
}
