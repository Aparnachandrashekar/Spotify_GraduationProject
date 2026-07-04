import { NextResponse } from "next/server";
import { getErrorStatus } from "@/lib/errors";
import type { ApiErrorResponse } from "@/lib/types";

export function apiError(
  message: string,
  status?: number,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: message },
    { status: status ?? getErrorStatus(message) },
  );
}
