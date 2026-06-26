// Session refresh + strict role-based route protection.
//
// Responsibilities:
//  1. Refresh the Supabase auth session on every request (cookie propagation).
//  2. Gate protected routes by role — airtight walls between user/creator/admin.
//
// Role routing matrix:
//  /dashboard/*, /onboarding  → role='user' only
//  /creator/* (not auth pages) → role='creator' only
//  /admin/*                   → role in ('admin','super_admin') only
//  /login, /signup/*          → unauthenticated only (redirect logged-in to role home)
//  /creator/login, /creator/signup → unauthenticated or same-flow (redirect if already in)
//  /creators/apply            → unauthenticated OR role='creator'
//  /browse, /resources/*, /pricing, /creators/* (public storefront) → public

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type UserRole = "user" | "creator" | "admin" | "super_admin";

function safeNextParam(raw: string | null): string | null {
  if (!raw) return null;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

// The canonical home for each role after login.
function roleHome(role: UserRole): string {
  if (role === "creator") return "/creator/home";
  if (role === "admin" || role === "super_admin") return "/admin";
  return "/browse";
}

// /creator/login and /creator/signup are public auth pages — not gated.
function isCreatorAuthPage(p: string): boolean {
  return (
    p === "/creator/login" ||
    p.startsWith("/creator/login/") ||
    p === "/creator/signup" ||
    p.startsWith("/creator/signup/")
  );
}

// /login, /signup, /signup/* — user-side public auth pages.
function isUserAuthPage(p: string): boolean {
  return (
    p === "/login" ||
    p.startsWith("/login/") ||
    p === "/signup" ||
    p.startsWith("/signup/")
  );
}

// /dashboard/*, /onboarding — user-role only.
function isUserOnlyRoute(p: string): boolean {
  return p.startsWith("/dashboard") || p === "/onboarding" || p.startsWith("/onboarding/");
}

// /creator/* — creator-role only, but carve out auth pages (they're public).
function isCreatorOnlyRoute(p: string): boolean {
  return p.startsWith("/creator") && !isCreatorAuthPage(p);
}

// /admin/* — admin/super_admin only.
function isAdminRoute(p: string): boolean {
  return p.startsWith("/admin");
}

// /creators/apply — special: unauthenticated OR creator only.
function isCreatorsApply(p: string): boolean {
  return p === "/creators/apply" || p.startsWith("/creators/apply/");
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

  // Refresh session. Keep adjacent to return — no new NextResponse between them.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Helper: build a redirect preserving cookie updates ────────────────────
  function redirectTo(dest: string): NextResponse {
    const url = request.nextUrl.clone();
    url.pathname = dest;
    url.search = "";
    const res = NextResponse.redirect(url);
    // Forward any updated session cookies so the redirect target has them.
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      res.cookies.set(name, value, opts),
    );
    return res;
  }

  function redirectToLogin(loginPath: string): NextResponse {
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.search = "";
    const safe = safeNextParam(pathname);
    if (safe) url.searchParams.set("next", safe);
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      res.cookies.set(name, value, opts),
    );
    return res;
  }

  // ── Unauthenticated routing ──────────────────────────────────────────────
  if (!user) {
    // User-side protected routes → /login?next=<path>
    if (isUserOnlyRoute(pathname)) {
      return redirectToLogin("/login");
    }
    // Creator-only routes → /creator/login?next=<path>
    if (isCreatorOnlyRoute(pathname)) {
      return redirectToLogin("/creator/login");
    }
    // Admin routes → / (no login hint for admin to avoid leaking)
    if (isAdminRoute(pathname)) {
      return redirectTo("/");
    }
    // /creators/apply, creator auth pages, user auth pages, public routes → allow
    return supabaseResponse;
  }

  // ── Authenticated: fetch role (once, only for routes that need it) ────────
  const needsRole =
    isUserAuthPage(pathname) ||
    isCreatorAuthPage(pathname) ||
    isUserOnlyRoute(pathname) ||
    isCreatorOnlyRoute(pathname) ||
    isAdminRoute(pathname) ||
    isCreatorsApply(pathname);

  let role: UserRole | null = null;
  if (needsRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = (profile?.role as UserRole) ?? null;
  }

  // ── Logged-in + user auth pages (/login, /signup/*) ──────────────────────
  if (isUserAuthPage(pathname)) {
    return redirectTo(role ? roleHome(role) : "/browse");
  }

  // ── Logged-in + creator auth pages (/creator/login, /creator/signup) ─────
  if (isCreatorAuthPage(pathname)) {
    if (role === "creator") return redirectTo("/creator/home");
    if (role === "user") return redirectTo("/browse");
    if (role === "admin" || role === "super_admin") return redirectTo("/admin");
    return supabaseResponse; // null role — let through
  }

  // ── User-only routes: /dashboard/*, /onboarding ──────────────────────────
  if (isUserOnlyRoute(pathname)) {
    if (role === "user") return supabaseResponse;
    if (role === "creator") return redirectTo("/creator/home");
    if (role === "admin" || role === "super_admin") return redirectTo("/admin");
    return redirectTo("/browse");
  }

  // ── Creator-only routes: /creator/* (not auth pages) ────────────────────
  if (isCreatorOnlyRoute(pathname)) {
    if (role === "creator") return supabaseResponse;
    if (role === "user") return redirectTo("/browse");
    if (role === "admin" || role === "super_admin") return redirectTo("/admin");
    return redirectTo("/browse");
  }

  // ── Admin routes: /admin/* ───────────────────────────────────────────────
  if (isAdminRoute(pathname)) {
    if (role !== "admin" && role !== "super_admin") {
      return redirectTo("/");
    }
    // /admin/team restricted to super_admin only
    if (pathname.startsWith("/admin/team") && role !== "super_admin") {
      return redirectTo("/admin/overview");
    }
    return supabaseResponse;
  }

  // ── /creators/apply: unauthenticated OR creator only ─────────────────────
  if (isCreatorsApply(pathname)) {
    if (!role || role === "creator") return supabaseResponse;
    if (role === "user") return redirectTo("/browse");
    if (role === "admin" || role === "super_admin") return redirectTo("/admin");
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
