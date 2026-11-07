import { adminPageSession, taxonomies } from "@/lib/admin/data";
import { PageHeading, Status } from "@/components/admin/shared";
export default async function Catalog() {
  const { client } = await adminPageSession();
  const data = await taxonomies(client);
  return (
    <>
      <PageHeading
        title="Brands & categories"
        description="The shared catalog taxonomy. Existing records are preserved without automatic publication."
      />
      <div className="admin-overview-grid">
        {(["categories", "brands"] as const).map((kind) => (
          <section className="admin-card" key={kind}>
            <div className="admin-card-heading">
              <h2>{kind === "brands" ? "Brands" : "Categories"}</h2>
              <span>{data[kind].length} records</span>
            </div>
            <div className="admin-taxonomy-list">
              {data[kind].map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      /{kind === "brands" ? "brand" : "category"}/{item.slug}
                    </small>
                  </span>
                  <Status value={item.publication_status} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="admin-notice">
        Taxonomy authoring, brand logo uploads and taxonomy publication
        interfaces are prepared for a subsequent approved phase. Product editors
        can select existing records now.
      </div>
    </>
  );
}
