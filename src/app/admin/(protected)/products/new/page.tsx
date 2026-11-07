import { redirect } from "next/navigation";
import { adminPageSession, taxonomies } from "@/lib/admin/data";
import { PageHeading } from "@/components/admin/shared";
import { ProductEditor } from "@/components/admin/ProductEditor";
import Link from "next/link";
export default async function NewProduct() {
  const { client, actor } = await adminPageSession();
  if (actor.role !== "admin") redirect("/admin/products");
  const options = await taxonomies(client);
  return (
    <>
      <Link href="/admin/products" className="admin-back">
        ← All products
      </Link>
      <PageHeading
        title="Add product"
        description="Start with a private Draft. Add real images, pricing and specifications when available."
      />
      <div className="admin-new-product">
        <ProductEditor {...options} />
        <aside className="admin-card admin-side-card">
          <span className="admin-phase">DRAFT BY DEFAULT</span>
          <h2>Build the foundation first</h2>
          <p>A product name and permanent slug are enough to begin.</p>
          <ul className="admin-check-list">
            <li>Images and prices are optional</li>
            <li>Unknown stock stays unknown</li>
            <li>No automatic publication</li>
            <li>No automatic Google indexing</li>
          </ul>
          <p className="admin-help">
            Verification, review and publication are separate explicit steps
            after saving.
          </p>
        </aside>
      </div>
    </>
  );
}
