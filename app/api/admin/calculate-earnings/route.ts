import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { calculateMonthlyEarnings } from "@/lib/earnings";
import { formatNaira } from "@/lib/format";

const bodySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format")
    .refine((m) => {
      const [y, mo] = m.split("-").map(Number);
      return y! >= 2020 && mo! >= 1 && mo! <= 12;
    }, "Invalid month"),
});

// POST /api/admin/calculate-earnings
// Admin-only. Calculates and upserts creator_earnings rows for a given month.
// Idempotent — safe to call multiple times for the same month.
export async function POST(req: NextRequest) {
  // 1. AUTH
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.profile.role !== "admin" && auth.profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. VALIDATE
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { month } = parsed.data;

  // 3. CALCULATE
  try {
    const summary = await calculateMonthlyEarnings(month);
    return NextResponse.json({
      ok: true,
      month,
      revenue_pool: formatNaira(summary.revenue_pool_kobo),
      creator_pool: formatNaira(summary.creator_pool_kobo),
      distributed: formatNaira(summary.total_distributed_kobo),
      platform_share: formatNaira(summary.platform_share_kobo),
      total_downloads: summary.total_downloads,
      creators_processed: summary.creators_processed,
      _kobo: summary,
    });
  } catch (err) {
    console.error("[calculate-earnings]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Calculation failed" },
      { status: 500 },
    );
  }
}
