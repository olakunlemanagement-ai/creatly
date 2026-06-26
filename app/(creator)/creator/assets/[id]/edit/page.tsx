import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { Category, Resource } from "@/types/database";
import { AssetEditForm } from "@/components/creator/AssetEditForm";

export const metadata: Metadata = { title: `Edit Asset — ${APP_NAME}` };

type AssetEditRow = Pick<
  Resource,
  | "id"
  | "title"
  | "description"
  | "category_id"
  | "tags"
  | "compatible_software"
  | "review_status"
  | "is_featured"
>;

export default async function AssetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const auth = await getAuthenticatedUser();
  if (!auth || auth.profile.role !== "creator") redirect("/creators");

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!creator) redirect("/creator/assets");

  // Use admin client: resources INSERT/UPDATE is admin-only via RLS; verify ownership in app code.
  const admin = createAdminClient();
  const { data: asset } = await admin
    .from("resources")
    .select(
      "id, title, description, category_id, tags, compatible_software, review_status, is_featured",
    )
    .eq("id", id)
    .eq("creator_id", creator.id)
    .returns<AssetEditRow[]>()
    .maybeSingle();

  if (!asset) redirect("/creator/assets");

  // Build category tree for the cascading selector
  const { data: rawCats } = await supabase
    .from("categories")
    .select("id, name, parent_id, level")
    .eq("is_active", true)
    .in("level", [1, 2])
    .order("sort_order")
    .returns<Pick<Category, "id" | "name" | "parent_id" | "level">[]>();

  const catList = rawCats ?? [];
  const rootMap = new Map<
    string,
    { id: string; name: string; children: { id: string; name: string }[] }
  >();
  for (const c of catList) {
    if (c.level === 1) rootMap.set(c.id, { id: c.id, name: c.name, children: [] });
  }
  for (const c of catList) {
    if (c.level === 2 && c.parent_id) {
      rootMap.get(c.parent_id)?.children.push({ id: c.id, name: c.name });
    }
  }
  const categories = Array.from(rootMap.values());

  // Warning: editing a published asset under manual review will trigger re-review
  const showReReviewWarning =
    asset.review_status === "approved" && !env.CREATOR_AUTO_APPROVE;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"// Edit asset"}
        </p>
        <h1
          className="mt-1 font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {asset.title}
        </h1>
      </div>

      {asset.is_featured && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          This asset has been featured by our team. The featured status is managed by admins and cannot be changed here.
        </p>
      )}

      <div className="max-w-xl">
        <AssetEditForm
          assetId={asset.id}
          defaultValues={{
            title: asset.title,
            description: asset.description ?? "",
            category_id: asset.category_id,
            tags: asset.tags.join(", "),
            compatible_software: asset.compatible_software.join(", "),
          }}
          categories={categories}
          showReReviewWarning={showReReviewWarning}
        />
      </div>
    </div>
  );
}
