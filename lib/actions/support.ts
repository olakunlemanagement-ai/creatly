"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

const RATE_LIMIT_COOKIE = "support_last_sent";
const RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

const SUBJECT_OPTIONS = [
  "Billing",
  "Downloads",
  "Technical",
  "Account",
  "Other",
] as const;

const contactSchema = z.object({
  subject: z.enum(SUBJECT_OPTIONS, {
    errorMap: () => ({ message: "Select a subject." }),
  }),
  message: z
    .string()
    .min(20, "Please write at least 20 characters.")
    .max(2000, "Message too long (max 2000 characters)."),
});

export type ContactState = { ok: true } | { ok: false; error: string };

export async function sendSupportMessage(
  _prev: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "You must be signed in to contact support." };

  // Rate limiting — one submission per 10 minutes per session
  const cookieStore = await cookies();
  const lastSent = cookieStore.get(RATE_LIMIT_COOKIE)?.value;
  if (lastSent) {
    const elapsed = Date.now() - parseInt(lastSent, 10);
    if (elapsed < RATE_LIMIT_MS) {
      const waitMin = Math.ceil((RATE_LIMIT_MS - elapsed) / 60_000);
      return { ok: false, error: `Please wait ${waitMin} minute${waitMin !== 1 ? "s" : ""} before sending another message.` };
    }
  }

  const parsed = contactSchema.safeParse({
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[support] RESEND_API_KEY not set — support message not delivered.");
    // Still record the rate-limit cookie so we don't spam logs
  } else {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${APP_NAME} <noreply@joincreatly.com>`,
        to:   CONTACT_EMAIL,
        reply_to: auth.user.email,
        subject: `[Support] ${parsed.data.subject} — from ${auth.user.email}`,
        html: `
          <p><strong>From:</strong> ${auth.user.email} (user ID: ${auth.user.id})</p>
          <p><strong>Subject:</strong> ${parsed.data.subject}</p>
          <hr />
          <p style="white-space:pre-wrap">${parsed.data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        `,
      }),
    });

    if (!res.ok) {
      console.error("[support] Resend error:", await res.text());
      return { ok: false, error: "Could not send your message. Please email us directly." };
    }
  }

  // Set rate-limit cookie (session duration)
  cookieStore.set(RATE_LIMIT_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: RATE_LIMIT_MS / 1000,
    path: "/",
  });

  return { ok: true };
}

export { SUBJECT_OPTIONS };
