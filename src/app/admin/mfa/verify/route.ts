import { operationalEvent } from "@/lib/monitoring/events";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { readAdminConfig } from "@/lib/admin/config";
import { catalogSessionAccess } from "@/lib/admin/assurance";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { csrfCookie, privateHeaders, validCsrf, validOrigin } from "@/lib/admin/security";
import { readBounded } from "@/lib/admin/request";
export async function POST(request: NextRequest) {
  const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: privateHeaders });
  try {
    const config = readAdminConfig();
    if (!config) return fail(503, "Admin access is disabled.");
    if (!validOrigin(request.headers, config.origin)) return fail(403, "Request origin rejected.");
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return fail(415, "Form required.");
    const fields = new URLSearchParams((await readBounded(request, 2048)).toString());
    if ([...fields.keys()].some((k, i, all) => all.indexOf(k) !== i)) return fail(422, "Duplicate fields rejected.");
    if (!validCsrf((await cookies()).get(csrfCookie)?.value, fields.get("csrf"))) return fail(403, "Security token expired.");
    const client = await requestAdminClient(true);
    const access = await catalogSessionAccess(client);
    if (access.needsMfa) {
      const key = createHmac("sha256", config.rateSecret).update(`mfa:${access.user.id}`).digest("hex");
      const limit = await client.rpc("consume_admin_login_attempt", { account_key: key });
      if (limit.error) return fail(503, "Verification protection unavailable.");
      if (limit.data !== true) return fail(429, "Too many verification attempts. Wait 15 minutes.");
      const factorId = fields.get("factor") || "", code = fields.get("code") || "";
      if (!/^[0-9a-f-]{36}$/i.test(factorId) || !/^[0-9]{6}$/.test(code)) return fail(422, "Enter a valid verification code.");
      const factors = await client.auth.mfa.listFactors();
      if (!factors.data?.totp.some((f) => f.id === factorId && f.status === "verified")) return fail(403, "Verified authenticator required.");
      const verified = await client.auth.mfa.challengeAndVerify({ factorId, code });
      if (verified.error || (await catalogSessionAccess(client)).needsMfa) {
        operationalEvent("admin_mfa_rejected", { route: "/admin/mfa", status: 403 });
        return fail(403, "Unable to verify code.");
      }
      operationalEvent("admin_mfa_verified", { route: "/admin/mfa", status: 200 });
    }
    if (request.headers.get("accept")?.includes("application/json")) return NextResponse.json({ location: "/admin" }, { headers: privateHeaders });
    return NextResponse.redirect(new URL("/admin", config.origin), { status: 303, headers: privateHeaders });
  } catch {
    return fail(403, "Verification unavailable. Sign in again or contact your operator.");
  }
}
