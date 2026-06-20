import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError } from "@/types/api";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccess<T>, { status });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code, message } } satisfies ApiError,
    { status },
  );
}
