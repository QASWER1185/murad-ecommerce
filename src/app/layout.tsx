import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "M. Murad Sons | Sanitary, Ceramics & Electric Store",
  description: "M Murad Sons Building Material Store, Adda Plot, Al Kabir Town, Raiwind Road, Lahore.",
  robots: { index: false, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
