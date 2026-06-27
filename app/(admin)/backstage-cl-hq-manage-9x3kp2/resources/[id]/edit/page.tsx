import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { ResourceEditForm } from "@/components/admin/ResourceEditForm";
import type { Resource } from "@/types/database";

export const metadata: Metadata = {
  title: `Edit Resource — ${APP_NAME} Admin`,
};

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: resource },
    { data: categories },
    { data: creators },
  ] = await Promise.all([
    supabase.from("resources").select("*").eq("id", id).single<Resource>(),
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("creators").select("id, name").eq("is_public", true).order("name"),
  ]);

  if (!resource) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/backstage-cl-hq-manage-9x3kp2/resources"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to resources
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">Edit resource</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {resource.title} — <span className="font-mono text-xs">{resource.slug}</span>
        </p>
      </div>

      <ResourceEditForm
        resource={resource}
        categories={categories ?? []}
        creators={creators ?? []}
      />
    </div>
  );
}
