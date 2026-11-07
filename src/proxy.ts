import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { readAdminConfig } from "./lib/admin/config";
import { adminClient } from "./lib/admin/supabase-server";
import { csrfCookie, privateHeaders, validOrigin } from "./lib/admin/security";

export async function proxy(request: NextRequest) {
  let config;
  try {
    config = readAdminConfig();
  } catch {
    return new NextResponse("Admin configuration is incomplete", {
      status: 503,
      headers: privateHeaders,
    });
  }
  if (
    config &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !validOrigin(request.headers, config.origin)
  )
    return new NextResponse("Request origin rejected", {
      status: 403,
      headers: privateHeaders,
    });
  const pending: {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];
  let token = request.cookies.get(csrfCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    request.cookies.set(csrfCookie, token);
    pending.push({
      name: csrfCookie,
      value: token,
      options: {
        httpOnly: true,
        sameSite: "strict",
        secure: config?.secure || false,
        path: "/admin",
        maxAge: 3600,
      },
    });
  }
  if (
    config &&
    request.cookies
      .getAll()
      .some((c) => c.name.startsWith("murad-admin-session"))
  ) {
    const client = adminClient(config, {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const c of values) {
          request.cookies.set(c.name, c.value);
          pending.push(c);
        }
      },
    });
    try {
      await client.auth.getUser();
    } catch {
      return new NextResponse("Authentication service unavailable", {
        status: 503,
        headers: privateHeaders,
      });
    }
  }
  const response = NextResponse.next({ request: { headers: request.headers } });
  for (const { name, value, options } of pending)
    response.cookies.set(name, value, options);
  for (const [key, value] of Object.entries(privateHeaders))
    response.headers.set(key, value);
  return response;
}
export const config = { matcher: ["/admin/:path*"] };
