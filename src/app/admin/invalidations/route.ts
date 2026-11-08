import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { jsonMutation, checked, requestError } from "@/lib/admin/request";
import { privateHeaders } from "@/lib/admin/security";
export async function POST(request: NextRequest) {
  try {
    const { client } = await jsonMutation(request);
    const events = checked(
      await client.rpc("claim_catalog_invalidations", { p_limit: 50 }),
    ) as {
      id: string;
      token: string;
      entity_type: string;
      old_slug: string | null;
      new_slug: string | null;
    }[];
    let processed = 0,
      failed = 0;
    for (const event of events) {
      let error: string | null = null;
      try {
        revalidateTag("catalog", { expire: 0 });
        revalidatePath("/", "layout");
        for (const path of ["/sitemap.xml", "/robots.txt"])
          revalidatePath(path);
      } catch {
        error = "Framework invalidation failed";
        failed++;
      }
      const acknowledged = checked(
        await client.rpc("finish_catalog_invalidation", {
          p_id: event.id,
          p_token: event.token,
          p_error: error,
        }),
      );
      if (acknowledged && !error) processed++;
    }
    return NextResponse.json(
      { claimed: events.length, processed, failed, more: events.length === 50 },
      { headers: privateHeaders },
    );
  } catch (error) {
    return requestError(error);
  }
}
