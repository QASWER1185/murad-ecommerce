import Link from "next/link";
import { adminPageSession, taxonomies } from "@/lib/admin/data";
import { PageHeading, Status } from "@/components/admin/shared";
export default async function Catalog() {
  const { client, actor } = await adminPageSession();
  const data = await taxonomies(client);
  return (
    <>
      <PageHeading
        title="Brands & categories"
        description="Edit genuine catalog information, SEO fields and original brand assets. Publication remains a separate review."
      />
      <div className="admin-overview-grid">
        {(["categories", "brands"] as const).map((table) => {
          const kind = table === "brands" ? "brand" : "category";
          return (
            <section className="admin-card" key={table}>
              <div className="admin-card-heading">
                <h2>{table === "brands" ? "Brands" : "Categories"}</h2>
                {actor.role === "admin" ? (
                  <Link href={`/admin/catalog/${kind}/new`}>Add {kind} ＋</Link>
                ) : null}
              </div>
              <div className="admin-taxonomy-list">
                {data[table].map((item) => (
                  <div key={item.id}>
                    <Link href={`/admin/catalog/${kind}/${item.id}`}>
                      <strong>{item.name}</strong>
                      <small>
                        /{kind}/{item.slug} →
                      </small>
                    </Link>
                    <Status value={item.publication_status} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
