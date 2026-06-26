import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { fail } from "@/lib/api-response";
import { env } from "@/lib/env";

// Protected test route — available in all environments.
// Requires ?token=SENTRY_TEST_TOKEN to prevent public triggering.
export function GET(request: NextRequest): NextResponse {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token !== env.SENTRY_TEST_TOKEN) {
    return fail("unauthorized", "Unauthorized", 401);
  }

  Sentry.captureException(new Error("Sentry test error from /api/sentry-test"));

  return NextResponse.json({ ok: true, message: "Test error sent to Sentry." });
}
