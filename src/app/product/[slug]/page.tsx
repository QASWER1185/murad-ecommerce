import {
  StorePage,
  pageMetadata,
  type PageProps,
} from "@/lib/storefront/pages";
export const generateMetadata = (props: PageProps) =>
  pageMetadata("product", props);
export default function Page(props: PageProps) {
  return <StorePage kind="product" props={props} />;
}
