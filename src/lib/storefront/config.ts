// Separate anonymous storefront configuration. Never inherit an administrator's
// session, privileged key, or the legacy production Supabase environment.
export const productionReleaseApproved = false;
export function storefrontConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.BUSINESS_SITE_MODE === "empty-catalog") return null;
  if (env.CATALOG_ENABLED !== "true") return null;
  const environment = env.CATALOG_ENVIRONMENT;
  if (!["local", "staging", "production"].includes(environment || ""))
    throw new Error("Explicit catalog environment required");
  const url = new URL(env.CATALOG_SUPABASE_URL || "invalid");
  const origin = new URL(env.CATALOG_SITE_ORIGIN || "invalid");
  for (const value of [url, origin]) {
    if (
      !["https:", "http:"].includes(value.protocol) ||
      value.username ||
      value.password ||
      value.pathname !== "/" ||
      value.search ||
      value.hash
    )
      throw new Error("Invalid catalog origin");
    if (
      environment === "local"
        ? !["127.0.0.1", "localhost", "[::1]"].includes(value.hostname)
        : value.protocol !== "https:"
    )
      throw new Error("Catalog transport does not match environment");
  }
  const key = env.CATALOG_SUPABASE_PUBLISHABLE_KEY || "";
  if (!key || key.startsWith("sb_secret_"))
    throw new Error("Anonymous publishable key required");
  if (key.split(".").length === 3) {
    let role: unknown;
    try {
      role = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString(),
      ).role;
    } catch {
      throw new Error("Invalid catalog key");
    }
    if (role !== "anon") throw new Error("Privileged catalog key forbidden");
  }
  const production = environment === "production";
  return {
    url: url.origin,
    key,
    origin: origin.origin,
    environment,
    production,
    // The production release is Catalog + WhatsApp only. Local/staging shopping
    // remains available for the already-built future commerce modules.
    shoppingEnabled: !production && env.CATALOG_SHOPPING_ENABLED !== "false",
    mediaEnabled:
      env.CATALOG_MEDIA_ENABLED === "true" &&
      (!production || productionReleaseApproved),
    indexingEnabled:
      production &&
      productionReleaseApproved &&
      env.CATALOG_INDEXING_ENABLED === "true",
  };
}
export const publicHeaders = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
