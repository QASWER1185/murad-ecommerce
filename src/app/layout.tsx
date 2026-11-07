import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "M. Murad Sons | Sanitary, Ceramics & Electric Store",
  description: "Porta, Faisal Sanitary, Dell Ceramics, Imported China Vanities, Popular/DuraMax Pipes & GM Cables in Lahore.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
