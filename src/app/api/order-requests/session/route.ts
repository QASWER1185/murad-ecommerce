import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  orderConfig,
  orderHeaders,
  guestCookie,
  validGuest,
  createGuest,
  csrfFor,
  challengeFor,
} from "@/lib/orders/security";
export async function GET(request: NextRequest) {
  await connection();
  try {
    const config = orderConfig();
    if (!config)
      return NextResponse.json({ enabled: false }, { headers: orderHeaders });
    if (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (request.headers.has("origin") &&
        request.headers.get("origin") !== config.origin)
    )
      return new NextResponse(null, { status: 403, headers: orderHeaders });
    const existing = (await cookies()).get(guestCookie)?.value;
    const cookie = validGuest(existing, config.secret)
      ? existing!
      : createGuest(config.secret);
    const response = NextResponse.json(
      {
        enabled: true,
        csrf: csrfFor(cookie, config.secret),
        challenge: challengeFor(cookie, config.secret),
      },
      { headers: orderHeaders },
    );
    if (cookie !== existing)
      response.cookies.set(guestCookie, cookie, {
        httpOnly: true,
        sameSite: "strict",
        secure: config.secure,
        path: "/api/order-requests",
        maxAge: 86400,
      });
    return response;
  } catch {
    return NextResponse.json(
      { enabled: false },
      { status: 503, headers: orderHeaders },
    );
  }
}
