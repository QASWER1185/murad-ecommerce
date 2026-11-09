import { Suspense } from 'react';
import { AnalyticsSetup } from '@/components/analytics/Setup';
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  referrer: "no-referrer",
  title: "M. Murad Sons | Sanitary, Ceramics & Electric Store",
  description: "M Murad Sons Building Material Store, Adda Plot, Al Kabir Town, Raiwind Road, Lahore.",
  robots: { index: false, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<Suspense fallback={null}><AnalyticsSetup/></Suspense></body>
    </html>
  );
}
