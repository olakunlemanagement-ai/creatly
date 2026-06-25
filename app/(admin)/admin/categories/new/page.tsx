import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata: Metadata = {
  title: `New Category — ${APP_NAME} Admin`,
};

export default async function NewCategoryPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">New category</h1>
      </div>
      <CategoryForm nextSortOrder={(count ?? 0) * 10} />
    </div>
  );
}
