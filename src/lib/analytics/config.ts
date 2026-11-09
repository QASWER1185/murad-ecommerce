import { storefrontConfig } from "../storefront/config";
export function analyticsConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.ANALYTICS_ENABLED !== "true" ||
    env.GA4_MANUAL_EVENTS_ONLY_CONFIRMED !== "true"
  )
    return null;
  const catalog = storefrontConfig(env);
  if (!catalog || catalog.production) return null;
  const measurementId = env.GA4_MEASUREMENT_ID || "";
  return /^G-[A-Z0-9]{6,20}$/.test(measurementId) ? { measurementId } : null;
}
