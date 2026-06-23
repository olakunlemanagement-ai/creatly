import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { env } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReviewCard } from "@/components/admin/ReviewCard";

export const metadata: Metadata = { title: `Review Queue — ${APP_NAME}` };

// When CREATOR_AUTO_APPROVE=true (default), creators and uploads are auto-approved
// on submit, so this queue will normally be empty. The queue still functions correctly
// when the flag is flipped to false — flip it to require manual review of all submissions.

type SubmittedResource = {
  id: string;
  title: string;
  description: string | null;
  preview_image_path: string;
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  tags: string[];
  submitted_at: string | null;
  creator_id: string;
};

export default async function AdminReviewPage() {
  // ADMIN GATE — enforced server-side; non-admins get 404 (no information leak).
  const auth = await getAuthenticatedUser();
  if (!auth || auth.profile.role !== "admin") notFound();

  const supabase = await createClient();

  // Fetch submitted resources, newest first.
  const { data: resources, error } = await supabase
    .from("resources")
    .select(
      "id, title, description, preview_image_path, file_name, file_size_bytes, file_type, tags, submitted_at, creator_id",
    )
    .eq("review_status", "submitted")
    .order("submitted_at", { ascending: true }) // oldest first — FIFO review order
    .returns<SubmittedResource[]>();

  if (error) {
    console.error("[AdminReviewPage] failed to load queue", { message: error.message });
  }

  const submissions = resources ?? [];

  // Fetch creators and categories for the submissions in one pass.
  const creatorIds = [...new Set(submissions.map((r) => r.creator_id))];

  const { data: creators } = creatorIds.length
    ? await supabase
        .from("creators")
        .select("id, name, slug")
        .in("id", creatorIds)
    : { data: [] };

  // Fetch category names for each resource.
  // We need category_id per resource — fetch it separately since we kept the select minimal.
  const resourceIds = submissions.map((r) => r.id);
  const { data: resourceCategories } = resourceIds.length
    ? await supabase
        .from("resources")
        .select("id, category_id, categories(name)")
        .in("id", resourceIds)
    : { data: [] };

  type CategoryJoin = { id: string; category_id: string; categories: { name: string } | null };

  const creatorMap = new Map((creators ?? []).map((c) => [c.id, c]));
  const categoryMap = new Map(
    ((resourceCategories as CategoryJoin[]) ?? []).map((r) => [
      r.id,
      r.categories?.name ?? "Unknown",
    ]),
  );

  const reviewItems = submissions.map((r) => {
    const creator = creatorMap.get(r.creator_id);
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      preview_image_path: r.preview_image_path,
      file_name: r.file_name,
      file_size_bytes: r.file_size_bytes,
      file_type: r.file_type,
      tags: r.tags,
      submitted_at: r.submitted_at,
      creator_name: creator?.name ?? "Unknown creator",
      creator_handle: creator?.slug ?? "",
      category_name: categoryMap.get(r.id) ?? "Unknown",
    };
  });

  const autoApprove = env.CREATOR_AUTO_APPROVE;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground mt-1">
          Submitted assets pending approval before going live in the catalogue.
        </p>
        {autoApprove && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Auto-approve is ON</strong> — submissions are currently approved automatically
            on submit. Set <code>CREATOR_AUTO_APPROVE=false</code> to route them here for manual
            review.
          </div>
        )}
      </div>

      {reviewItems.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 px-6 py-16 text-center">
          <p className="text-lg font-medium">Queue is empty</p>
          <p className="text-sm text-muted-foreground mt-1">
            {autoApprove
              ? "Assets are auto-approved — nothing to review."
              : "No submissions waiting for review."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {reviewItems.length} submission{reviewItems.length !== 1 ? "s" : ""} waiting
          </p>
          {reviewItems.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
