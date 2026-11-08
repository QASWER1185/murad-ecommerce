"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Shapes,
  Image as ImageIcon,
  Upload,
  Settings,
  ClipboardList,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Order requests", icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/catalog", label: "Brands & categories", icon: Shapes },
  { href: "/admin/media", label: "Media & banners", icon: ImageIcon },
  { href: "/admin/imports", label: "Bulk import", icon: Upload },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
];
export function Navigation() {
  const path = usePathname();
  return (
    <>
      <nav className="admin-navigation" aria-label="Admin navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            prefetch={false}
            key={href}
            href={href}
            aria-current={
              (href === "/admin" ? path === href : path.startsWith(href))
                ? "page"
                : undefined
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {href === "/admin/imports" ? (
              <small>CSV / XLSX</small>
            ) : (
              <ChevronRight className="admin-nav-chevron" size={14} />
            )}
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-bottom">
        <span className="admin-secure-dot" />
        Private workspace
        <Link href="/" prefetch={false}>
          View storefront
          <ExternalLink size={14} />
        </Link>
      </div>
    </>
  );
}
