import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { readAdminConfig } from "./lib/admin/config";
import { adminClient } from "./lib/admin/supabase-server";
import { csrfCookie, privateHeaders, validOrigin } from "./lib/admin/security";

import { admitCatalogPath } from "./lib/storefront/admission";
import { publicHeaders, storefrontConfig } from "./lib/storefront/config";
export async function proxy(request: NextRequest) {
  if (
    !request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/_next/image"
  ) {
    const headers: Record<string, string> = {
      ...publicHeaders,
      "X-Robots-Tag": "noindex, follow",
    };
    try {
      if (storefrontConfig()?.indexingEnabled) delete headers["X-Robots-Tag"];
      const decision = await admitCatalogPath(
        request.nextUrl.pathname,
        Object.fromEntries(
          Array.from(request.nextUrl.searchParams.keys(), (key) => [
            key,
            request.nextUrl.searchParams.getAll(key),
          ]),
        ),
      );
      if (decision.status === 308 && decision.destination) {
        const destination = request.nextUrl.clone();
        destination.pathname = decision.destination;
        destination.search = "";
        const response = NextResponse.redirect(destination, 308);
        for (const [key, value] of Object.entries(headers))
          response.headers.set(key, value);
        return response;
      }
      if (decision.status !== 200)
        return new NextResponse(
          decision.status === 404
            ? '<!doctype html><html lang="en"><head><title>Page not found | M Murad Sons</title><meta name="robots" content="noindex"></head><body><main><h1>Page not found</h1><p>This collection or product is not available.</p><a href="/">Return to M Murad Sons</a></main></body></html>'
            : "Published catalog temporarily unavailable",
          {
            status: decision.status,
            headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
          },
        );
      return NextResponse.next({ headers });
    } catch {
      return new NextResponse("Published catalog temporarily unavailable", {
        status: 503,
        headers,
      });
    }
  }
  if (request.nextUrl.pathname === "/_next/image") {
    try {
      let source = request.nextUrl.searchParams.get("url") || "";
      for (let i = 0; i < 2; i++) source = decodeURIComponent(source);
      const path = new URL(source, "http://local").pathname;
      if (
        path.startsWith("/admin/media/") ||
        path.startsWith("/media/catalog/")
      )
        return new NextResponse(
          "Protected media must use direct responsive variants",
          { status: 403, headers: privateHeaders },
        );
    } catch {
      return new NextResponse(null, { status: 400, headers: privateHeaders });
    }
    return NextResponse.next();
  }
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
export const config = {
  matcher: [
    "/admin/:path*",
    "/_next/image",
    "/",
    "/category/:path*",
    "/brand/:path*",
    "/product/:path*",
    "/search",
    "/categories",
    "/brands",
    "/sitemap.xml",
    "/robots.txt",
    "/api/catalog/:path*",
  ],
};
