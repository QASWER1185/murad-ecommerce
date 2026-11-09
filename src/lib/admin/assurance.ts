import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSessionAccess } from "./session-policy";
export class MfaRequired extends Error {}
// getUser validates the session with Auth; the database reads signed gateway
// claims and operator-owned roles. No decoded browser JWT is trusted here.
export async function catalogSessionAccess(client: SupabaseClient) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Authentication required");
  const access = await client.rpc("catalog_session_access");
  if (access.error)
    throw new Error("Catalog permission denied");
  return { user, ...parseSessionAccess(access.data) };
}
