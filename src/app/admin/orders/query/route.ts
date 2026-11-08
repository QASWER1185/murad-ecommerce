import { NextRequest, NextResponse } from "next/server";
import { jsonMutation } from "@/lib/admin/request";
import { searchSchema } from "@/lib/orders/contracts";
import { orderHeaders } from "@/lib/orders/security";
import { orderFailure, OrderError } from "@/lib/orders/server";
export async function POST(request: NextRequest) {
  try {
    const { client, input } = await jsonMutation(request);
    const filters = searchSchema.parse(input);
    const result = await client.rpc("admin_order_requests", {
      p_filters: filters,
    });
    if (result.error) throw new OrderError("ORDER_ACCESS", 403);
    return NextResponse.json(result.data, { headers: orderHeaders });
  } catch (error) {
    if (!(error instanceof OrderError))
      return NextResponse.json(
        { error: "Administrator access and valid request required." },
        { status: 403, headers: orderHeaders },
      );
    return orderFailure(error);
  }
}
