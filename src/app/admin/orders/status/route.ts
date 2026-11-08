import { NextRequest, NextResponse } from "next/server";
import { jsonMutation } from "@/lib/admin/request";
import { statusSchema } from "@/lib/orders/contracts";
import { orderHeaders } from "@/lib/orders/security";
import { orderErrors, orderFailure, OrderError } from "@/lib/orders/server";
export async function POST(request: NextRequest) {
  try {
    const { client, input } = await jsonMutation(request);
    const value = statusSchema.parse(input);
    const result = await client.rpc("update_order_request_status", {
      p_id: value.id,
      p_version: value.version,
      p_status: value.status,
      p_note: value.note,
      p_confirm: value.confirm,
    });
    if (result.error) {
      const code = Object.keys(orderErrors).find((k) =>
        result.error!.message.includes(k),
      );
      throw new OrderError(
        code || "ORDER_ACCESS",
        code ? orderErrors[code].status : 403,
      );
    }
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
