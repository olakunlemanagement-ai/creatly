import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const querySchema = z.object({
  reference: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. VALIDATE
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({ reference: searchParams.get("reference") });
    if (!parsed.success) return fail("invalid_input", "Missing reference.", 422);

    // 3. Read payment_references (RLS enforces user_id = caller)
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_references")
      .select("status, plan_id, kobo, settled_at")
      .eq("reference", parsed.data.reference)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      console.error("[verify] db error:", error);
      return fail("internal_error", "Could not verify payment.", 500);
    }
    if (!data) return fail("not_found", "Reference not found.", 404);

    return ok({ status: data.status, plan_id: data.plan_id, settled_at: data.settled_at });
  } catch (err) {
    console.error("[verify] unexpected error:", err);
    return fail("internal_error", "Something went wrong.", 500);
  }
}
