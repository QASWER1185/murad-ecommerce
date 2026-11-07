import type { Metadata } from "next";
import { Suspense } from "react";
import "./admin.css";
export const metadata: Metadata = {
  title: {
    default: "Admin | M Murad Sons",
    template: "%s | M Murad Sons Admin",
  },
  robots: { index: false, follow: false, noarchive: true },
  referrer: "same-origin",
};
export const instant = false;
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-app">
      <Suspense
        fallback={
          <div className="admin-loading" role="status">
            Opening secure workspace…
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
