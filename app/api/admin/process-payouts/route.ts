import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { processPayouts } from "@/lib/payouts";
import { formatNaira } from "@/lib/format";

const bodySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format"),
});

// POST /api/admin/process-payouts
// Admin-only. Processes creator payouts for a given month via Paystack Transfer API.
// Idempotent — already-paid earnings are skipped.
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

  // 3. PROCESS
  try {
    const summary = await processPayouts(month);
    return NextResponse.json({
      ok: true,
      month,
      processed: summary.processed,
      skipped: summary.skipped,
      total: formatNaira(summary.total_kobo),
      total_kobo: summary.total_kobo,
      errors: summary.errors,
    });
  } catch (err) {
    console.error("[process-payouts]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payout processing failed" },
      { status: 500 },
    );
  }
}
