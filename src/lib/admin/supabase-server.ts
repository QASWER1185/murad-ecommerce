import "server-only";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readAdminConfig, type AdminConfig } from "./config";
export function adminClient(
  config: AdminConfig,
  cookieMethods: CookieMethodsServer,
) {
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: cookieMethods.getAll,
      // SSR 0.12 forces its default maxAge after cookieOptions. Enforce the
      // application boundary on the actual writes, including refresh chunks.
      setAll: (values, headers) =>
        cookieMethods.setAll?.(
          values.map((cookie) => ({
            ...cookie,
            options: {
              ...cookie.options,
              path: "/admin",
              httpOnly: true,
              sameSite: "strict",
              secure: config.secure,
              maxAge: cookie.value
                ? Math.min(cookie.options.maxAge ?? 28800, 28800)
                : 0,
            },
          })),
          headers,
        ),
    },
    cookieOptions: {
      name: "murad-admin-session",
      path: "/admin",
      httpOnly: true,
      sameSite: "strict",
      secure: config.secure,
      maxAge: 8 * 60 * 60,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
export async function requestAdminClient(writable = false) {
  const config = readAdminConfig();
  if (!config) throw new Error("Admin is not configured");
  const jar = await cookies();
  return adminClient(config, {
    getAll: () => jar.getAll(),
    setAll: (values) => {
      if (writable)
        for (const { name, value, options } of values)
          jar.set(name, value, options);
      // Read-only rendering relies on proxy.ts for persisted token refresh.
    },
  });
}
