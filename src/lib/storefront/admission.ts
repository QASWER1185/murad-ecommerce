import { parseQuery, type SearchValues } from "./query";
import { createClient } from "@supabase/supabase-js";
import { storefrontConfig } from "./config";
export async function admitCatalogPath(
  path: string,
  values: SearchValues = {},
) {
  const match = path.match(/^\/(product|category|brand)\/([^/]+)$/);
  if (!match) return { status: 200 };
  const config = storefrontConfig();
  if (
    !config ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(match[2]) ||
    match[2].length > 180
  )
    return { status: 404 };
  const client = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const route = await client
    .from("catalog_routes_public")
    .select("id")
    .eq("kind", match[1])
    .eq("slug", match[2])
    .maybeSingle();
  if (route.error) return { status: 503 };
  if (route.data) {
    if (values.page) {
      const raw = Array.isArray(values.page) ? values.page[0] : values.page;
      if (!/^[1-9]\d{0,4}$/.test(raw)) return { status: 404 };
      const query = parseQuery(values);
      const snapshot = await client.rpc("catalog_storefront", {
        p_kind: match[1],
        p_slug: match[2],
        p_query: query,
      });
      if (snapshot.error) return { status: 503 };
      if (Number(raw) > snapshot.data.pages) return { status: 404 };
    }
    return { status: 200 };
  }
  const redirect = await client
    .from("catalog_redirects_public")
    .select("destination_path")
    .eq("source_path", path)
    .maybeSingle();
  if (redirect.error) return { status: 503 };
  const destination = redirect.data?.destination_path;
  return destination &&
    /^\/(product|category|brand)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(destination)
    ? { status: 308, destination }
    : { status: 404 };
}
