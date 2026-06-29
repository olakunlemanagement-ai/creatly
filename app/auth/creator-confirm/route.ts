import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

// OAuth callback for creator Google sign-up.
// After exchanging the code it promotes the user's profile to role='creator'
// so they are never routed through the consumer flow.

function safeRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/creators/apply");

  const cookieStore = await cookies();
  const errorRedirect = new URL("/auth/auth-error", request.url);

  if (!code) {
    errorRedirect.searchParams.set("reason", "missing_token");
    return NextResponse.redirect(errorRedirect);
  }

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    errorRedirect.searchParams.set("reason", "link_expired");
    return NextResponse.redirect(errorRedirect);
  }

  // Promote to creator. Safe to call even if already creator (idempotent).
  const admin = createAdminClient();
  await admin.from("profiles").update({ role: "creator" }).eq("id", data.user.id);

  return response;
}
