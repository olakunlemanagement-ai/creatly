import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/admin/CategoryForm";
import type { Category } from "@/types/database";

export const metadata: Metadata = {
  title: `Edit Category — ${APP_NAME} Admin`,
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single<Category>();

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/backstage-cl-hq-manage-9x3kp2/categories"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">Edit category</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {category.name} — <span className="font-mono text-xs">{category.slug}</span>
        </p>
      </div>
      <CategoryForm category={category} />
    </div>
  );
}
