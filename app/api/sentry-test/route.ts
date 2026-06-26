import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { fail } from "@/lib/api-response";

// Dev-only route to verify Sentry is capturing errors correctly.
// Returns 404 in production so it is never exposed.
export function GET(): NextResponse {
  if (process.env.NODE_ENV !== "development") {
    return fail("not_found", "Not found", 404);
  }

  Sentry.captureException(new Error("Sentry test error from /api/sentry-test"));

  return NextResponse.json({ ok: true, message: "Test error sent to Sentry." });
}
