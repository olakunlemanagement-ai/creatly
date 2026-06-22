import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Resource, Download, PlanType } from "@/types/database";

type LogDownloadInput = {
  userId: string;
  resource: Pick<Resource, "id" | "creator_id">;
  subscriptionId: string;
  planType: PlanType;
};

// Inserts the immutable downloads row BEFORE any signed URL is created (CONVENTIONS §7.1).
// creator_id is copied from the resource at download time — denormalised so it never changes
// even if the resource is later reassigned to a different creator.
// Throws on insert failure; caller must NOT proceed to createSignedUrl if this throws.
export async function logDownload(input: LogDownloadInput): Promise<Download> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("downloads")
    .insert({
      user_id: input.userId,
      resource_id: input.resource.id,
      creator_id: input.resource.creator_id, // denormalised from resource at download time
      subscription_id: input.subscriptionId,
      plan_type: input.planType,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`logDownload failed: ${error?.message ?? "no data returned"}`);
  }

  return data;
}

// Creates a 60-second signed URL for a private resource file.
// Called ONLY after logDownload succeeds.
// Uses the admin (service-role) client because the resource-files bucket has no storage
// RLS SELECT policy for authenticated users — by design. See lib/supabase/admin.ts.
export async function createSignedUrl(filePath: string): Promise<string> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from("resource-files")
    .createSignedUrl(filePath, 60, { download: true });

  if (error || !data?.signedUrl) {
    throw new Error(`createSignedUrl failed: ${error?.message ?? "no URL returned"}`);
  }

  return data.signedUrl;
}
