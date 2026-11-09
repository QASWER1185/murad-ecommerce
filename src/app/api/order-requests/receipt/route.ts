import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guestSession, gateway, orderFailure } from "@/lib/orders/server";
import { signedEnvelope, orderHeaders } from "@/lib/orders/security";
export async function GET(request: NextRequest) {
  try {
    const { config, cookie } = await guestSession(request);
    const key = z.uuid().parse(request.nextUrl.searchParams.get("key"));
    const result = await gateway(
      signedEnvelope(config, cookie, "receipt", { idempotency_key: key }),
    );
    return NextResponse.json({ receipt: result }, { headers: orderHeaders });
  } catch (error) {
    return orderFailure(error);
  }
}
