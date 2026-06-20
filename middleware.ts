// Refreshes the Supabase auth session on every request so Server Components always
// receive a valid, non-expired token. Cookie propagation follows the pattern required
// by Next.js App Router (middleware must own the setAll path; Server Components cannot).
//
// Route protection (auth gating) is NOT done here — that is added in step 1.3.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
          // 1. Mirror new cookies onto the request so downstream Server Components see them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // 2. Rebuild the response so cookies propagate to the browser.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session. Keep this call and the return adjacent — do not insert
  // logic between them that creates a new NextResponse, or cookies will be lost.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
