import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { downloadHistoryQuerySchema } from "@/lib/validations/downloads";

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. VALIDATE
    const { searchParams } = new URL(req.url);
    const parsed = downloadHistoryQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );
    if (!parsed.success) return fail("invalid_input", "Invalid query parameters.", 422);
    const { page } = parsed.data;

    // 3. EXECUTE — RLS enforces own-rows-only; no extra filter needed
    const supabase = await createClient();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("downloads")
      .select("*", { count: "exact" })
      .eq("user_id", auth.user.id)
      .order("downloaded_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // 4. RESPOND
    const total = count ?? 0;
    return ok({
      downloads: data ?? [],
      page,
      pageSize: PAGE_SIZE,
      total,
      hasMore: total > page * PAGE_SIZE,
    });
  } catch (err) {
    console.error("[api/downloads]", err);
    return fail("internal_error", "Something went wrong. Please try again.", 500);
  }
}
