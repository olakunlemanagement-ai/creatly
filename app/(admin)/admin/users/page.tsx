import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { DeactivateUserButton } from "@/components/admin/DeactivateUserButton";

export const metadata: Metadata = {
  title: `Consumers — ${APP_NAME} Admin`,
};

interface SearchParams {
  sub?: string;
  q?: string;
  page?: string;
}

const PAGE_SIZE = 30;

const SUB_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "free", label: "Free" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sub = sp.sub ?? "";
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [auth, supabase] = await Promise.all([getAuthenticatedUser(), createClient()]);
  const isSuperAdmin = auth ? await hasPermission(auth.user.id, "*") : false;

  let query = supabase
    .from("profiles")
    .select(
      `id, full_name, email, role, created_at, onboarded,
       subscriptions!subscriptions_owner_id_fkey(status, plan_id)`,
      { count: "exact" },
    )
    .eq("role", "user");

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data: rows, count } = await query;

  type ProfileRow = {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    created_at: string | null;
    onboarded: boolean | null;
    subscriptions: { status: string; plan_id: string }[];
  };

  const users = (rows ?? []) as unknown as ProfileRow[];

  const filteredUsers =
    sub === "active"
      ? users.filter((u) => u.subscriptions?.some((s) => s.status === "active"))
      : sub === "free"
        ? users.filter((u) => !u.subscriptions?.some((s) => s.status === "active"))
        : users;

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      ...(sub && { sub }),
      ...(q && { q }),
      page: "1",
      ...overrides,
    });
    return `/admin/users?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Consumers</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Registered consumer accounts · {totalCount.toLocaleString()} total
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="mb-6 flex flex-wrap gap-3">
        {/* Search */}
        <form method="GET" action="/admin/users" className="flex-1 min-w-48">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {sub && <input type="hidden" name="sub" value={sub} />}
        </form>

        {/* Subscription filter */}
        <div className="flex gap-1">
          {SUB_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={buildUrl({ sub: opt.value })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                sub === opt.value
                  ? "border-terracotta-500 bg-terracotta-500 text-white"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Consumer</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Subscription</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No consumers found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const activeSub = (u.subscriptions ?? []).find((s) => s.status === "active");
                return (
                  <tr key={u.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{u.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {activeSub ? (
                        <span className="inline-flex items-center rounded-full bg-brand-green-100 px-2 py-0.5 text-xs font-medium text-brand-green-700">
                          {activeSub.plan_id}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmt(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-xs font-medium text-brand-green-700 hover:underline"
                        >
                          View →
                        </Link>
                        {isSuperAdmin && (
                          <DeactivateUserButton userId={u.id} userName={u.full_name ?? u.email} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
