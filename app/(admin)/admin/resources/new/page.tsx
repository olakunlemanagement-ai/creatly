import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { AdminUploadWizard } from "@/components/admin/AdminUploadWizard";

export const metadata: Metadata = {
  title: `Upload Resource — ${APP_NAME} Admin`,
};

export default async function NewResourcePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: creators }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("creators")
      .select("id, name")
      .eq("is_public", true)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/admin/resources"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to resources
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">Upload resource</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new resource to the catalogue. Files upload directly to storage on publish.
        </p>
      </div>

      <AdminUploadWizard
        categories={categories ?? []}
        creators={creators ?? []}
      />
    </div>
  );
}
