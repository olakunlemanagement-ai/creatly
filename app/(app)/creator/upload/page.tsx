import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category, Resource } from "@/types/database";
import { UploadWizard } from "@/app/(app)/creator/upload/UploadWizard";

export const metadata: Metadata = { title: `Upload Asset — ${APP_NAME}` };

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth || auth.profile.role !== "creator") redirect("/creators");

  const supabase = await createClient();
  const { edit: editId } = await searchParams;

  // Fetch active categories for the detail form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order")
    .returns<Pick<Category, "id" | "name">[]>();

  // If editing a draft, verify ownership
  let draftId: string | undefined;
  if (editId) {
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (creator) {
      const { data: draft } = await supabase
        .from("resources")
        .select("id, review_status")
        .eq("id", editId)
        .eq("creator_id", creator.id)
        .returns<Pick<Resource, "id" | "review_status">[]>()
        .maybeSingle();

      if (draft && (draft.review_status === "draft" || draft.review_status === "rejected")) {
        draftId = draft.id;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"// Upload"}
        </p>
        <h1
          className="mt-1 font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {draftId ? "Edit draft" : "Upload new asset"}
        </h1>
      </div>

      <div className="max-w-xl">
        <UploadWizard
          categories={categories ?? []}
          userId={auth.user.id}
          existingDraftId={draftId}
        />
      </div>
    </div>
  );
}
