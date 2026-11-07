export interface AdminConfig {
  url: string;
  key: string;
  origin: string;
  secure: boolean;
  rateSecret: string;
}
// Deliberately no fallback to existing storefront/production environment values.
export function readAdminConfig(
  env: Record<string, string | undefined> = process.env,
): AdminConfig | null {
  if (env.ADMIN_ENABLED !== "true") return null;
  const url = new URL(env.ADMIN_SUPABASE_URL || "invalid");
  const origin = new URL(env.ADMIN_SITE_ORIGIN || "invalid");
  const local = env.ADMIN_ENVIRONMENT === "local";
  if (
    ![url.protocol, origin.protocol].every((p) =>
      ["http:", "https:"].includes(p),
    )
  )
    throw new Error("Admin services require HTTP or HTTPS");
  if (
    !["local", "staging"].includes(env.ADMIN_ENVIRONMENT || "") ||
    (!local && (url.protocol !== "https:" || origin.protocol !== "https:"))
  )
    throw new Error("Admin environment must be explicitly configured");
  if (
    local &&
    ![url.hostname, origin.hostname].every((h) =>
      ["127.0.0.1", "localhost", "[::1]"].includes(h),
    )
  )
    throw new Error("Local admin requires loopback services");
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error("Invalid admin origins");
  const key = env.ADMIN_SUPABASE_PUBLISHABLE_KEY || "";
  if (!key || key.startsWith("sb_secret_"))
    throw new Error("A publishable Supabase key is required");
  if (key.split(".").length === 3) {
    let role: unknown;
    try {
      role = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString(),
      ).role;
    } catch {
      throw new Error("Invalid publishable key");
    }
    if (role !== "anon")
      throw new Error("Privileged Supabase keys are forbidden");
  }
  const rateSecret = env.ADMIN_RATE_LIMIT_SECRET || "";
  if (rateSecret.length < 32)
    throw new Error("Configure a private login rate-limit secret");
  return {
    url: url.origin,
    key,
    origin: origin.origin,
    secure: origin.protocol === "https:",
    rateSecret,
  };
}
