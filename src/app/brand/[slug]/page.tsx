import {
  StorePage,
  pageMetadata,
  type PageProps,
} from "@/lib/storefront/pages";
export const generateMetadata = (props: PageProps) =>
  pageMetadata("brand", props);
export default function Page(props: PageProps) {
  return <StorePage kind="brand" props={props} />;
}
