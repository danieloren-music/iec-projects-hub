import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DataSourceUnavailableError } from "@/lib/data/portfolio-repository";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "SCHEMA_UNCONFIRMED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details: unknown = null,
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  );
}

export function apiUnavailable(message: string) {
  return apiError(503, "SERVICE_UNAVAILABLE", message);
}

export function schemaUnconfirmedResponse() {
  return apiError(
    503,
    "SCHEMA_UNCONFIRMED",
    "This PMO data contract has not been confirmed; no records or mutations are available.",
  );
}

export async function withApiLogging(
  request: Request,
  operation: () => Promise<Response>,
): Promise<Response> {
  const startedAt = Date.now();
  let status = 500;

  try {
    const response = await operation();
    status = response.status;
    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "api_request_failed",
        method: request.method,
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    if (error instanceof DataSourceUnavailableError) {
      status = 503;
      return apiError(503, "SERVICE_UNAVAILABLE", error.message);
    }

    if (error instanceof ZodError) {
      status = 400;
      return apiError(400, "BAD_REQUEST", "Request validation failed.", error.issues);
    }

    return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  } finally {
    console.info(
      JSON.stringify({
        level: "info",
        event: "api_request",
        method: request.method,
        path: new URL(request.url).pathname,
        status,
        durationMs: Date.now() - startedAt,
      }),
    );
  }
}
