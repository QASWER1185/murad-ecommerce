import { adminPageSession } from "@/lib/admin/data";
import { PageHeading, EmptyState, Status } from "@/components/admin/shared";
import { FileSpreadsheet } from "lucide-react";
export default async function Imports() {
  const { client } = await adminPageSession();
  const result = await client
    .from("import_jobs")
    .select("id,file_name,format,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (result.error) throw new Error("Import history unavailable");
  return (
    <>
      <PageHeading
        title="Bulk product import"
        description="Prepare thousands of products with careful validation and explicit review."
      />
      <section className="admin-card admin-import-intro">
        <FileSpreadsheet size={38} />
        <div>
          <span className="admin-phase">PHASE 4 · EXECUTION NOT ACTIVE</span>
          <h2>From spreadsheet to reviewed catalog</h2>
          <p>
            CSV / XLSX → Column mapping → Validation preview → Duplicate checks
            → Draft import
          </p>
          <p className="admin-help">
            Imported Drafts will never publish or become indexable
            automatically.
          </p>
        </div>
        <button className="admin-button admin-button-secondary" disabled>
          Choose file · Phase 4
        </button>
      </section>
      <section className="admin-card">
        <div className="admin-card-heading">
          <h2>Import history</h2>
          <span>Latest 50 jobs</span>
        </div>
        {result.data.length ? (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((job) => (
                  <tr key={job.id}>
                    <td>{job.file_name}</td>
                    <td>{job.format}</td>
                    <td>
                      <Status value={job.status} />
                    </td>
                    <td>
                      {new Date(job.created_at).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No imports yet"
            description="Import execution, template download, column mapping, row validation and price updates will be enabled in Phase 4."
          />
        )}
      </section>
    </>
  );
}
