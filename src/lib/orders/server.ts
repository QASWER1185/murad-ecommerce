import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  orderConfig,
  guestCookie,
  validGuest,
  csrfFor,
  orderHeaders,
} from "./security";
import { validCsrf, validOrigin } from "@/lib/admin/security";
import { readBounded } from "@/lib/admin/request";
import { publicCatalogClient } from "@/lib/storefront/server";
import { operationalEvent } from "@/lib/monitoring/events";
export class OrderError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
export const orderErrors: Record<string, { status: number; message: string }> =
  {
    ORDER_INVALID_REQUEST: {
      status: 422,
      message: "Please check your contact details and request.",
    },
    ORDER_INVALID_SELECTION: {
      status: 422,
      message: "Please review your product selection.",
    },
    ORDER_UNAVAILABLE: {
      status: 409,
      message:
        "Some selected products are unavailable. Refresh your selection.",
    },
    ORDER_SELECTION_CHANGED: {
      status: 409,
      message:
        "Product information changed. Refresh and review before submitting.",
    },
    ORDER_IDEMPOTENCY_CONFLICT: {
      status: 409,
      message:
        "This request was already submitted with different details. Recover its receipt before starting another.",
    },
    ORDER_RATE_LIMIT: {
      status: 429,
      message: "Too many requests. Please wait before trying again.",
    },
    ORDER_STALE_VERSION: {
      status: 409,
      message: "This request changed. Refresh before updating.",
    },
    ORDER_INVALID_TRANSITION: {
      status: 422,
      message: "This status transition is not permitted.",
    },
    ORDER_EXPLICIT_CONFIRMATION_REQUIRED: {
      status: 422,
      message: "Explicit confirmation is required.",
    },
  };
export async function guestSession(request: NextRequest, mutation = false) {
  const config = orderConfig();
  if (!config) throw new OrderError("ORDER_DISABLED", 503);
  if (
    (mutation && !validOrigin(request.headers, config.origin)) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new OrderError("ORDER_ORIGIN", 403);
  const cookie = (await cookies()).get(guestCookie)?.value;
  if (!validGuest(cookie, config.secret))
    throw new OrderError("ORDER_SESSION", 403);
  if (
    mutation &&
    !validCsrf(
      csrfFor(cookie!, config.secret),
      request.headers.get("x-csrf-token"),
    )
  )
    throw new OrderError("ORDER_CSRF", 403);
  return { config, cookie: cookie! };
}
export async function guestJson(request: NextRequest) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new OrderError("ORDER_INVALID_REQUEST", 415);
  try {
    return JSON.parse((await readBounded(request, 32768)).toString());
  } catch {
    throw new OrderError("ORDER_INVALID_REQUEST", 422);
  }
}
export async function gateway(args: {
  p_envelope: string;
  p_signature: string;
}) {
  const result = await publicCatalogClient()!.rpc(
    "order_request_gateway",
    args,
  );
  if (result.error) {
    const code = Object.keys(orderErrors).find((key) =>
      result.error!.message.includes(key),
    );
    if (code) throw new OrderError(code, orderErrors[code].status);
    operationalEvent("order_gateway_failure", { route: "/api/order-requests" });
    throw new OrderError("ORDER_GATEWAY", 503);
  }
  if (result.data?.error) {
    const code = String(result.data.error);
    throw new OrderError(code, orderErrors[code]?.status || 503);
  }
  return result.data;
}
export function orderFailure(error: unknown) {
  const code =
    error instanceof OrderError ? error.code : "ORDER_INVALID_REQUEST";
  const status = error instanceof OrderError ? error.status : 422;
  return NextResponse.json(
    {
      code,
      error:
        orderErrors[code]?.message ||
        (status === 403
          ? "Refresh this page and try again."
          : "Request service is temporarily unavailable."),
    },
    {
      status,
      headers: {
        ...orderHeaders,
        ...(status === 429 ? { "Retry-After": "900" } : {}),
      },
    },
  );
}
