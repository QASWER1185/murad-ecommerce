import Link from "next/link";
import { WhatsAppContact } from "@/components/catalog/WhatsApp";
export default function NotFound() {
  return (
    <main
      style={{
        padding: "80px 24px",
        maxWidth: 800,
        margin: "auto",
        color: "#002747",
      }}
    >
      <h1>Page not found</h1>
      <p>This product or collection is not publicly available.</p>
      <Link href="/">Return to M Murad Sons</Link>
      <WhatsAppContact />
    </main>
  );
}
