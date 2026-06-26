import { getAuthenticatedUser } from "@/lib/auth";
import { getUserEntitlement } from "@/lib/entitlement";
import { logDownload, createSignedUrl } from "@/lib/download";
import { ok, fail } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { downloadResourceParamsSchema } from "@/lib/validations/downloads";
import type { PlanType } from "@/types/database";
import { PLAN_TYPES } from "@/types/database";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. VALIDATE
    const rawParams = await params;
    const parsed = downloadResourceParamsSchema.safeParse(rawParams);
    if (!parsed.success) return fail("invalid_input", "Invalid resource ID.", 422);
    const { resourceId } = parsed.data;

    // 3. RESOURCE — must exist and be published; fetch only what is needed for the log
    const supabase = await createClient();
    const { data: resource } = await supabase
      .from("resources")
      .select("id, creator_id, file_path, file_name, status")
      .eq("id", resourceId)
      .maybeSingle();

    if (!resource || resource.status !== "published") {
      return fail("not_found", "Resource not found.", 404);
    }

    // 4. ENTITLEMENT — server-side check; never trust the client (CONVENTIONS §7.2)
    const entitlement = await getUserEntitlement(auth.user.id);
    if (!entitlement.entitled) {
      return fail("no_active_subscription", "An active subscription is required to download.", 403);
    }

    // 5. LOG — immutable downloads row is written BEFORE the signed URL is created.
    // If this fails, we throw and the catch block returns 500 — no URL is ever issued.
    // (CONVENTIONS §7.1: No log, no URL.)
    const planType = PLAN_TYPES.includes(entitlement.subscription.plan_type as PlanType)
      ? (entitlement.subscription.plan_type as PlanType)
      : "monthly"; // fallback shouldn't happen — DB enforces valid values

    await logDownload({
      userId: auth.user.id,
      resource: { id: resource.id, creator_id: resource.creator_id },
      subscriptionId: entitlement.subscription.id,
      planType,
    });

    // 6. SIGNED URL — only reached after the log commits
    const url = await createSignedUrl(resource.file_path);

    // 7. COUNTER — best-effort atomic increment; failure does NOT abort the download
    supabase
      .rpc("increment_download_count", { p_resource_id: resource.id })
      .then(({ error }) => {
        if (error) console.warn("[downloads] counter increment failed:", error.message);
      });

    // 8. RESPOND
    return ok({ url, fileName: resource.file_name });
  } catch (err) {
    // 6. HANDLE
    console.error("[api/downloads/[resourceId]]", err);
    return fail("internal_error", "Something went wrong. Please try again.", 500);
  }
}
