import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publicCatalogClient } from "@/lib/storefront/server";
import {
  guestSession,
  guestJson,
  OrderError,
  orderFailure,
} from "@/lib/orders/server";
import { orderHeaders } from "@/lib/orders/security";
export async function POST(request: NextRequest) {
  try {
    await guestSession(request, true);
    const { ids } = z
      .object({ ids: z.array(z.uuid()).min(1).max(50) })
      .strict()
      .parse(await guestJson(request));
    const result = await publicCatalogClient()!.rpc("catalog_order_preview", {
      p_ids: ids,
    });
    if (result.error) throw new OrderError("ORDER_GATEWAY", 503);
    return NextResponse.json({ items: result.data }, { headers: orderHeaders });
  } catch (error) {
    return orderFailure(error);
  }
}
