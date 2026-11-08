# ERP isolation — NOT VERIFIED

**ERP ISOLATION NOT VERIFIED — PRODUCTION CHANGES BLOCKED.**

Muraderp ai and all of its infrastructure are out of scope. No ERP project,
Supabase/hosting/Auth/Storage/repository/domain/credential/integration/job was
listed, fetched, queried, probed or changed. We did not try to identify its real
slug by inspecting other accounts/projects.

Authorized e-commerce metadata shows one specific Supabase ref with three ordinary
public catalog tables, standard service schemas, no public custom function or
app_private schema, and no bucket rows. Catalog FKs point only to brands/categories.
No explicit ERP-named schema/bucket/link was observed in this narrow metadata.
These are limited observations, not proof that no ERP client uses this project's
Auth/API/credentials, quotas, integrations or storage resources.

Vercel owning-team metadata is unavailable. Environment names/values, Git link,
aliases/integration connections and external dependencies were not inspected.
No conclusion about shared hosting or keys can be drawn. Different display names
or a dedicated Supabase project reference alone are insufficient.

Before Gate 2 or any production action, obtain owner-supplied non-secret isolation
evidence/attestation mapping e-commerce-only DB/Auth/Storage/hosting/integrations,
backup source scope and shared-resource boundaries. This can compare ERP identity
references supplied by the owner **without accessing ERP resources**. Do not
request credentials. If shared use is possible or unresolved, stop the affected
backup/cutover; do not follow the dependency into ERP under Gate 1.
