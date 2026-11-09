import { StorePage } from "@/lib/storefront/pages";
import type { SearchValues } from "@/lib/storefront/query";
export const metadata = {
  title: "Search products | M Murad Sons Lahore",
  robots: { index: false, follow: true },
};
export default function Page({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  return (
    <StorePage
      kind="search"
      props={{ params: Promise.resolve({ slug: "" }), searchParams }}
    />
  );
}
