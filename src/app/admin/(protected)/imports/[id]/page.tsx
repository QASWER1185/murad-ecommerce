import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { adminPageSession } from "@/lib/admin/data";
import { idSchema } from "@/lib/admin/validation";
import { csrfCookie } from "@/lib/admin/security";
import { ImportWorkspace } from "@/components/admin/ImportWorkspace";
import { PageHeading } from "@/components/admin/shared";
import Link from "next/link";
export default async function ImportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, actor } = await adminPageSession();
  if (!idSchema.safeParse(id).success) notFound();
  const result = await client.rpc("catalog_import_workspace", { p_id: id });
  if (result.error) throw new Error("Import details unavailable");
  if (!result.data?.job) notFound();
  const csrf = (await cookies()).get(csrfCookie)?.value || "";
  return (
    <>
      <Link href="/admin/imports" className="admin-back">
        ← Import history
      </Link>
      <PageHeading
        title="Import review & progress"
        description="Map the source, review every proposed change and approve Draft updates separately."
      />
      <ImportWorkspace
        initial={result.data}
        csrf={csrf}
        editable={actor.role === "admin"}
      />
    </>
  );
}
