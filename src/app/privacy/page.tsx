import Link from "next/link";
import { Suspense } from "react";
import { WhatsAppContact } from "@/components/catalog/WhatsApp";
import { connection } from "next/server";
import { AnalyticsConsent } from "@/components/analytics/Analytics";
import { analyticsConfig } from "@/lib/analytics/config";
export const metadata = {
  title: "Privacy & analytics choices | M Murad Sons",
  robots: { index: false, follow: false },
};
async function Content() {
  await connection();
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "auto",
        padding: "50px 24px",
        color: "#002747",
        lineHeight: 1.8,
      }}
    >
      <Link prefetch={false} href="/">
        ← M Murad Sons
      </Link>
      <h1 style={{ fontSize: 30, fontWeight: 700 }}>
        Privacy &amp; analytics choices
      </h1>
      <h2>Order and quotation requests</h2>
      <p>
        We ask for your name and a contact number so the store can reply to your
        product selection or quotation request. An optional note can explain
        your request. Do not include payment details or other sensitive
        information. No address is required at this stage.
      </p>
      <p>
        Only authorized store administrators can review contact information and
        request history. A submitted request does not confirm an order, payment,
        delivery charge or stock reservation. Ask the store about correcting or
        removing your contact information.
      </p>
      <p>
        Cart and wishlist storage contains product IDs and quantities. A pending
        request key may be retained in this browser tab to recover a receipt
        after interruption; contact details are not stored in browser storage.
      </p>
      <AnalyticsConsent configured={!!analyticsConfig()} />
      <p>
        Opening WhatsApp takes you to that provider. It does not record a
        purchase.
      </p>
      <a href="https://wa.me/923217165000">Contact the store about privacy</a>
      <WhatsAppContact />
    </main>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p>Loading privacy choices…</p>}>
      <Content />
    </Suspense>
  );
}
