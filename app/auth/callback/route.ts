import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// PKCE callback — Supabase appends ?code=... to the emailRedirectTo URL.
// Exchanges the code for a session, then redirects to `next` (or /onboarding).
// On failure, redirects to /auth/auth-error with a reason param.

function safeRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/onboarding");

  const errorRedirect = new URL("/auth/auth-error", request.url);

  if (!code) {
    errorRedirect.searchParams.set("reason", "missing_token");
    return NextResponse.redirect(errorRedirect);
  }

  const cookieStore = await cookies();
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) return response;

  errorRedirect.searchParams.set("reason", "link_expired");
  return NextResponse.redirect(errorRedirect);
}
