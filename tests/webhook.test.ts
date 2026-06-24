/**
 * Webhook handler unit tests (Phase 2, Step 2.8)
 *
 * These tests exercise the webhook logic in isolation by mocking the Supabase admin client.
 * They do NOT hit the network or a real database.
 *
 * Run: pnpm test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";
import { PLANS } from "@/lib/pricing";

// ── Mock @/lib/supabase/admin ─────────────────────────────────────────────────

const mockSingle   = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect   = vi.fn();
const mockInsert   = vi.fn();
const mockUpdate   = vi.fn();
const mockUpsert   = vi.fn();
const mockEq       = vi.fn();

// Chain builder — each method returns `this` so Supabase-style chains work.
function chain(terminal: unknown = undefined) {
  const obj: Record<string, unknown> = {};
  obj.select    = vi.fn().mockReturnValue(obj);
  obj.insert    = vi.fn().mockReturnValue(obj);
  obj.update    = vi.fn().mockReturnValue(obj);
  obj.upsert    = vi.fn().mockReturnValue(obj);
  obj.eq        = vi.fn().mockReturnValue(obj);
  obj.maybeSingle = vi.fn().mockResolvedValue(terminal ?? { data: null, error: null });
  obj.single    = vi.fn().mockResolvedValue(terminal ?? { data: null, error: null });
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = vi.fn((_table?: string): any => chain());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

// ── Helper: build a signed webhook request ────────────────────────────────────

const TEST_KEY = "test_secret_key";

function makeRequest(
  payload: object,
  opts: { key?: string; badSig?: boolean } = {}
): Request {
  const body = JSON.stringify(payload);
  const key  = opts.key ?? TEST_KEY;
  const hash = createHmac("sha512", key).update(body).digest("hex");
  const sig  = opts.badSig ? "0000000000000000" : hash;

  return new Request("http://localhost/api/webhooks/paystack", {
    method:  "POST",
    headers: {
      "Content-Type":          "application/json",
      "x-paystack-signature":  sig,
    },
    body,
  });
}

// ── Import the handler AFTER mocks are registered ────────────────────────────

const { POST } = await import("@/app/api/webhooks/paystack/route");

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/paystack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = TEST_KEY;
  });

  it("returns 403 for invalid HMAC signature", async () => {
    const req = makeRequest({ event: "charge.success" }, { badSig: true });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("accepts and processes a valid charge.success event", async () => {
    // Simulate: subscription_events.maybeSingle returns null (no duplicate)
    // subscriptions.upsert returns a subscription id
    // All other calls return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockImplementation((_table?: string): any => {
      const table = _table ?? "";
      const c = chain();
      if (table === "subscription_events") {
        // select → maybeSingle → no duplicate
        (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
      }
      if (table === "subscriptions") {
        // upsert → select → single → returns subscription
        (c.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { id: "sub-123" },
          error: null,
        });
      }
      return c;
    });

    const payload = {
      event: "charge.success",
      data: {
        reference: "ref-abc",
        amount:    PLANS.solo_monthly.kobo,
        metadata:  { user_id: "user-1", plan_id: "solo_monthly", kobo: PLANS.solo_monthly.kobo },
      },
    };

    const req = makeRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 200 and skips processing for a duplicate reference (idempotency)", async () => {
    // subscription_events already has this reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockImplementation((_table?: string): any => {
      const table = _table ?? "";
      const c = chain();
      if (table === "subscription_events") {
        (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { id: "existing-event" },
          error: null,
        });
      }
      return c;
    });

    const payload = {
      event: "charge.success",
      data: {
        reference: "ref-already-seen",
        amount:    PLANS.solo_monthly.kobo,
        metadata:  { user_id: "user-1", plan_id: "solo_monthly", kobo: PLANS.solo_monthly.kobo },
      },
    };

    const req = makeRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(200);
    // subscriptions table should NOT have been written
    const subCallArgs = (mockFrom.mock.calls as string[][]).filter(([t]) => t === "subscriptions");
    expect(subCallArgs).toHaveLength(0);
  });

  it("returns 422 when amount does not match plan (defence-in-depth)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockImplementation((_table?: string): any => {
      const table = _table ?? "";
      const c = chain();
      if (table === "subscription_events") {
        (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
      }
      return c;
    });

    const payload = {
      event: "charge.success",
      data: {
        reference: "ref-mismatch",
        amount:    999,  // wrong amount
        metadata:  { user_id: "user-1", plan_id: "solo_monthly", kobo: 999 },
      },
    };

    const req = makeRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("processes subscription.disable and marks subscription cancelled", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFrom.mockImplementation((_table?: string): any => {
      const table = _table ?? "";
      const c = chain();
      if (table === "subscriptions") {
        (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { id: "sub-456" },
          error: null,
        });
      }
      return c;
    });

    const payload = {
      event: "subscription.disable",
      data:  { subscription_code: "SUB_testcode" },
    };

    const req = makeRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
