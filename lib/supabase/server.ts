// Server Supabase client — use in Server Components, Server Actions, and Route Handlers.
// Reads the auth session from request cookies via next/headers.
// Uses the publishable key; RLS is enforced by Supabase based on the user's JWT.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from a Server Component (which cannot write cookies).
            // The middleware handles session refresh in that case — this catch is intentional.
          }
        },
      },
    },
  );
}
