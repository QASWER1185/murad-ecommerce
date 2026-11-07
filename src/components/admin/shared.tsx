import Link from "next/link";
import { cookies } from "next/headers";
import { csrfCookie } from "@/lib/admin/security";
import type { AdminProduct } from "@/lib/admin/data";
export async function CsrfField() {
  const token = (await cookies()).get(csrfCookie)?.value || "";
  return <input type="hidden" name="csrf" value={token} />;
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`admin-status status-${value}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-page-heading">
      <div>
        <p className="admin-eyebrow">{eyebrow || "STORE MANAGEMENT"}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function ProductIdentity({
  product,
}: {
  product: Pick<AdminProduct, "name" | "sku" | "model">;
}) {
  return (
    <div className="admin-product-identity">
      <span className="admin-product-initial" aria-hidden="true">
        {product.name.slice(0, 1)}
      </span>
      <span>
        <strong>{product.name}</strong>
        <small>
          {product.sku || "SKU not added"}
          {product.model ? ` · ${product.model}` : ""}
        </small>
      </span>
    </div>
  );
}
export function Notice({
  message,
  error = false,
}: {
  message?: string;
  error?: boolean;
}) {
  return message ? (
    <div
      role={error ? "alert" : "status"}
      className={`admin-notice ${error ? "admin-notice-error" : ""}`}
    >
      {message}
    </div>
  ) : null;
}
export function EmptyState({
  title,
  description,
  create = false,
}: {
  title: string;
  description: string;
  create?: boolean;
}) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-mark" aria-hidden="true">
        ＋
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {create ? (
        <Link className="admin-button" href="/admin/products/new">
          Add your first product
        </Link>
      ) : null}
    </div>
  );
}
export const notices: Record<string, string> = {
  saved: "Draft saved. Previous verification has been cleared.",
  submitted: "Submitted for explicit administrator review.",
  reviewed:
    "Review recorded for this version. Publication is a separate action.",
  published: "Product published with your selected indexing decision.",
  draft: "Product returned to Draft and withdrawn from public views.",
  archived: "Product archived and withdrawn from public views.",
  renamed: "Permanent URL updated. Redirect history retained.",
  alt: "Image alt text saved. Review must be completed again.",
};
