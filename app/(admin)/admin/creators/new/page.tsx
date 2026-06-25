import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { CreatorForm } from "@/components/admin/CreatorForm";

export const metadata: Metadata = {
  title: `New Creator — ${APP_NAME} Admin`,
};

export default function NewCreatorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/creators"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to creators
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">New creator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new creator to the Creatly catalogue.
        </p>
      </div>
      <CreatorForm />
    </div>
  );
}
