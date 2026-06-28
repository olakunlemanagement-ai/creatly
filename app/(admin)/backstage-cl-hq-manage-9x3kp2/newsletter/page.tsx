import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { NewsletterExportButton } from "./NewsletterExportButton";

export const metadata: Metadata = {
  title: `Newsletter — ${APP_NAME} Admin`,
};

const PAGE_SIZE = 50;

interface SearchParams {
  page?: string;
}

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  const [{ count: totalCount }, { data: rows }] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("newsletter_subscribers")
      .select("id, email, source, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
  ]);

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  function buildUrl(p: number) {
    return `/backstage-cl-hq-manage-9x3kp2/newsletter?page=${p}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Newsletter</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {(totalCount ?? 0).toLocaleString()} subscriber{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <NewsletterExportButton />
      </div>

      {/* Summary card */}
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-brand-green-200 bg-brand-green-50/60 p-4 max-w-xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green-100">
          <Users className="h-4 w-4 text-brand-green-700" />
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">
            {(totalCount ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total subscribers</p>
        </div>
      </div>

      {/* Subscriber list */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(rows ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                (rows ?? []).map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{row.email}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {row.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {fmt(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildUrl(page - 1)}
                className="rounded-xl border border-border px-4 py-2 font-medium transition-colors hover:bg-muted"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildUrl(page + 1)}
                className="rounded-xl border border-border px-4 py-2 font-medium transition-colors hover:bg-muted"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
