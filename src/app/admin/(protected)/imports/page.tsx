import { cookies } from "next/headers";
import Link from "next/link";
import { adminPageSession } from "@/lib/admin/data";
import { PageHeading, EmptyState, Status } from "@/components/admin/shared";
import { ImportUploader } from "@/components/admin/ImportUploader";
import { csrfCookie } from "@/lib/admin/security";
export default async function Imports() {
  const { client, actor } = await adminPageSession();
  const result = await client
    .from("import_jobs")
    .select("id,file_name,format,status,total_rows,processed_rows,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (result.error) throw new Error("Import history unavailable");
  return (
    <>
      <PageHeading
        title="Bulk product import"
        description="CSV and Excel catalogs, reviewed carefully and applied only to Draft products."
      />
      {actor.role === "admin" ? (
        <ImportUploader csrf={(await cookies()).get(csrfCookie)?.value || ""} />
      ) : null}
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
                  <th>Rows</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link
                        className="admin-text-link"
                        href={`/admin/imports/${job.id}`}
                      >
                        {job.file_name} →
                      </Link>
                    </td>
                    <td>{job.format}</td>
                    <td>
                      <Status value={job.status} />
                    </td>
                    <td>
                      {job.processed_rows} / {job.total_rows}
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
            description="Download a template, add your actual catalog information and upload it for review. Images and prices may remain empty."
          />
        )}
      </section>
    </>
  );
}
