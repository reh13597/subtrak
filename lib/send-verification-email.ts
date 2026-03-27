import emailjs from "@emailjs/nodejs";

/**
 * Email change verification - sends code to user's CURRENT email.
 *
 * REQUIRED: Create a dedicated EmailJS template for this (do NOT reuse the contact form template).
 * - In the template's "To Email" field, set: {{to_email}}
 * - In the body, include: {{code}}
 * - Set EMAILJS_TEMPLATE_ID_EMAIL_CHANGE to this template's ID
 *
 * The contact form template typically sends to a fixed address; it won't deliver to the user.
 */
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID_EMAIL_CHANGE || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || "";

export async function sendEmailChangeVerification(toEmail: string, code: string): Promise<boolean> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[send-verification-email] Missing config. Need: EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_EMAIL_CHANGE, EMAILJS_PUBLIC_KEY"
      );
    }
    return false;
  }

  if (!PRIVATE_KEY && process.env.NODE_ENV === "development") {
    console.warn("[send-verification-email] EMAILJS_PRIVATE_KEY is required for server-side send");
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: toEmail,
        code,
        message: `Your verification code is: ${code}. Enter it in SubTrak to confirm your new email address. This code expires in 15 minutes.`,
      },
      {
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY || undefined,
      }
    );
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[send-verification-email] EmailJS error:", err);
    }
    return false;
  }
}
