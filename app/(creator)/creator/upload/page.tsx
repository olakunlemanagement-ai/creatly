import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category, Resource } from "@/types/database";
import { UploadWizard } from "@/components/creator/UploadWizard";

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

  const { data: rawCats } = await supabase
    .from("categories")
    .select("id, name, parent_id, level")
    .eq("is_active", true)
    .in("level", [1, 2])
    .order("sort_order")
    .returns<Pick<Category, "id" | "name" | "parent_id" | "level">[]>();

  // Build a structured list: level-1 roots with their level-2 children.
  const catList = rawCats ?? [];
  const rootMap = new Map<string, { id: string; name: string; children: { id: string; name: string }[] }>();
  for (const c of catList) {
    if (c.level === 1) rootMap.set(c.id, { id: c.id, name: c.name, children: [] });
  }
  for (const c of catList) {
    if (c.level === 2 && c.parent_id) rootMap.get(c.parent_id)?.children.push({ id: c.id, name: c.name });
  }
  const categories = Array.from(rootMap.values());

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
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
