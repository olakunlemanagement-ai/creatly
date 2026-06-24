// Session refresh + route protection.
//
// Two responsibilities:
//  1. Refresh the Supabase auth session on every request (cookie propagation).
//  2. Gate protected routes and redirect logged-in users away from auth pages.
//
// IMPORTANT: Do not insert logic between the supabase client creation and the
// return of supabaseResponse — doing so risks losing cookie updates.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /creators is a public marketing/storefront namespace; only /creators/apply requires auth.
// /creator (no s) is the private creator dashboard prefix.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/onboarding", "/creator/", "/creators/apply"];
const AUTH_ONLY_PATHS = ["/login", "/signup"];

function safeNextParam(raw: string | null): string | null {
  if (!raw) return null;
  // Same-origin relative paths only — block open redirects.
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session. Result used below for routing decisions.
  // Keep this call adjacent to the return — no new NextResponse between them.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Logged-in users hitting /login or /signup go to /browse.
  if (user && AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/browse";
    return NextResponse.redirect(url);
  }

  // Unauthenticated users hitting protected routes go to /login?next=<path>.
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    const next = safeNextParam(pathname);
    url.pathname = "/login";
    url.searchParams.set("next", next ?? "/browse");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
