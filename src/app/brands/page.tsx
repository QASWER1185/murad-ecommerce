import { Directory } from "@/components/catalog/Directory";
export const metadata = {
  title: "Browse brands | M Murad Sons Lahore",
  robots: { index: false, follow: true },
};
export default function Page() {
  return <Directory kind="brand" />;
}
