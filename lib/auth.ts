import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type AuthenticatedUser = {
  user: { id: string; email: string; user_metadata: Record<string, unknown> };
  profile: Profile;
};

// Used in Server Components and route handlers as the standard auth gate
// (CONVENTIONS §5.2). Returns null for unauthenticated or missing profile.
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    user: { id: user.id, email: user.email ?? "", user_metadata: user.user_metadata ?? {} },
    profile,
  };
}
