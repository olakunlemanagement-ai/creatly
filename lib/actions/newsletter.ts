"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

const subscribeSchema = z.object({
  email:  z.string().email("Enter a valid email address."),
  source: z.enum(["footer", "landing", "pricing"]).default("footer"),
});

export type SubscribeState =
  | { ok: true }
  | { ok: false; error: string };

export async function subscribeToNewsletter(
  _prev: SubscribeState | null,
  formData: FormData,
): Promise<SubscribeState> {
  const parsed = subscribeSchema.safeParse({
    email:  formData.get("email"),
    source: formData.get("source") ?? "footer",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const { email, source } = parsed.data;

  // admin client: newsletter_subscribers has no public-read RLS; insert is allowed by policy
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, source });

  if (error) {
    // Postgres unique-violation code = 23505
    if (error.code === "23505") {
      return { ok: false, error: "You're already subscribed — thanks!" };
    }
    console.error("[newsletter] insert error:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Send welcome email — fire-and-forget; don't fail the action if email fails
  sendWelcomeEmail(email).catch((err) =>
    console.error("[newsletter] welcome email error:", err),
  );

  return { ok: true };
}

async function sendWelcomeEmail(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[newsletter] RESEND_API_KEY not set — welcome email skipped.");
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${APP_NAME} <${SUPPORT_EMAIL}>`,
      to:   email,
      subject: `Welcome to ${APP_NAME} — you're on the list 🎉`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f2ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:#f5f2ec;">
    You're on the list — the best African creative resources, delivered.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f5f2ec;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;width:100%;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#1a3d2f;padding:32px 40px;text-align:center;">
              <span style="font-size:28px;font-weight:700;color:#f5f2ec;letter-spacing:-0.5px;">
                ${APP_NAME}
              </span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px;">
                You're on the list.
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Thanks for subscribing. We'll send you the best African creative resources,
                new asset drops, and creator stories. No spam, ever.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#4b5563;">
                In the meantime, explore our growing catalogue of templates, fonts,
                mockups, and motion assets built for African creatives.
              </p>
              <a href="https://joincreatly.com/browse"
                 style="display:inline-block;background-color:#1a3d2f;color:#f5f2ec;
                        text-decoration:none;padding:14px 28px;border-radius:8px;
                        font-size:14px;font-weight:600;letter-spacing:0.2px;">
                Browse resources →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9f9f9;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                You're receiving this because you subscribed at joincreatly.com.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  });
}
