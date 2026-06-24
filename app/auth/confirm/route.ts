import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Supabase email callback — handles two token types:
//   type=signup   → email verification (new user clicked confirmation link)
//   type=recovery → password reset (user clicked the reset link)
//
// On success, redirects to `next` (validated) or `/browse`.
// On failure, redirects to `/auth/auth-error` with a reason param.

function safeRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  // Only allow same-origin relative paths — block open redirects.
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/onboarding");

  const cookieStore = await cookies();

  const errorRedirect = new URL("/auth/auth-error", request.url);

  // Build a redirect response — cookies are written onto it so the session
  // is available immediately on the destination page.
  const successUrl = new URL(next, request.url);
  const response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // PKCE code-exchange flow (some Supabase link types use this)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
    errorRedirect.searchParams.set("reason", "link_expired");
    return NextResponse.redirect(errorRedirect);
  }

  // OTP / email-link flow (signup confirmation, password recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return response;
    errorRedirect.searchParams.set("reason", "link_expired");
    return NextResponse.redirect(errorRedirect);
  }

  errorRedirect.searchParams.set("reason", "missing_token");
  return NextResponse.redirect(errorRedirect);
}
