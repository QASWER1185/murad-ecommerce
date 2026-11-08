import { NextRequest, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/orders/contracts";
import {
  guestSession,
  guestJson,
  gateway,
  OrderError,
  orderFailure,
} from "@/lib/orders/server";
import {
  signedEnvelope,
  orderHeaders,
  validChallenge,
  trustedClientIp,
} from "@/lib/orders/security";
export async function POST(request: NextRequest) {
  try {
    const { config, cookie } = await guestSession(request, true);
    const input = submissionSchema.parse(await guestJson(request));
    if (!validChallenge(input.challenge, cookie, config.secret))
      throw new OrderError("ORDER_CSRF", 403);
    input.request.items.sort((a, b) =>
      a.product_id.localeCompare(b.product_id),
    );
    const result = await gateway(
      signedEnvelope(
        config,
        cookie,
        "submit",
        input.request,
        input.request.customer_phone,
        trustedClientIp(request.headers),
      ),
    );
    return NextResponse.json(result, { status: 201, headers: orderHeaders });
  } catch (error) {
    return orderFailure(error);
  }
}
