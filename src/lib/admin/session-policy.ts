import { canPreview, type CatalogRole } from "../catalog/publication";
// The server obtains this projection only after Auth.getUser(). A missing or
// malformed MFA flag must never be interpreted as an opt-out from step-up.
export function parseSessionAccess(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Catalog session policy unavailable");
  const data = value as Record<string, unknown>;
  if (!canPreview(data.role) || typeof data.mfa_required !== "boolean" ||
    (data.aal !== "aal1" && data.aal !== "aal2"))
    throw new Error("Catalog session policy unavailable");
  return { role: data.role as CatalogRole, needsMfa: data.mfa_required && data.aal !== "aal2" };
}
