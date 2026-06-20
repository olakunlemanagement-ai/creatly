// Browser Supabase client — use in Client Components and public reads only.
// Uses the publishable key (sb_publishable_…), which is safe to expose to the browser.
// Do NOT use this for writes to protected tables or any server-side authenticated operation.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
