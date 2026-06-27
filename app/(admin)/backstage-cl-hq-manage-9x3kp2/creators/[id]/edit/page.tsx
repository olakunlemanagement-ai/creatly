import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { CreatorForm } from "@/components/admin/CreatorForm";
import type { Creator } from "@/types/database";

export const metadata: Metadata = {
  title: `Edit Creator — ${APP_NAME} Admin`,
};

export default async function EditCreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", id)
    .single<Creator>();

  if (!creator) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/backstage-cl-hq-manage-9x3kp2/creators"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to creators
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Edit creator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {creator.name} — <span className="font-mono text-xs">{creator.slug}</span>
        </p>
      </div>
      <CreatorForm creator={creator} />
    </div>
  );
}
