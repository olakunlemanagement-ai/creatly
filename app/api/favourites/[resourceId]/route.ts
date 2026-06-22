import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { toggleFavouriteParamsSchema } from "@/lib/validations/favourites";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. VALIDATE
    const { resourceId } = await params;
    const parsed = toggleFavouriteParamsSchema.safeParse({ resourceId });
    if (!parsed.success) return fail("invalid_input", "Invalid resource ID.", 422);

    const supabase = await createClient();
    const userId = auth.user.id;
    const validatedResourceId = parsed.data.resourceId;

    // 3. AUTHORIZE — RLS restricts favourites to own rows (user_id = auth.uid()); no extra check needed

    // 4. EXECUTE — toggle: delete if a favourite exists, insert if not
    const { data: existing } = await supabase
      .from("favourites")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", validatedResourceId)
      .maybeSingle();

    let favourited: boolean;

    if (existing) {
      await supabase
        .from("favourites")
        .delete()
        .eq("user_id", userId)
        .eq("resource_id", validatedResourceId);
      favourited = false;
    } else {
      await supabase
        .from("favourites")
        .insert({ user_id: userId, resource_id: validatedResourceId });
      favourited = true;
    }

    // 5. RESPOND
    return ok({ favourited });
  } catch (err) {
    // 6. HANDLE
    console.error("[api/favourites/toggle]", err);
    return fail("internal_error", "Something went wrong. Please try again.", 500);
  }
}
