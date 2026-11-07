import { adminPageSession } from "@/lib/admin/data";
import { PageHeading } from "@/components/admin/shared";
export default async function Settings() {
  const { client } = await adminPageSession();
  const settings = await client
    .from("site_settings")
    .select(
      "business_name,street_address,city,main_whatsapp,secondary_whatsapp",
    )
    .maybeSingle();
  if (settings.error) throw new Error("Settings unavailable");
  return (
    <>
      <PageHeading
        title="Store settings"
        description="Verified business details and the boundaries of this private workspace."
      />
      <section className="admin-card admin-form-card">
        <h2>M Murad Sons Building Material Store</h2>
        <dl className="admin-specs">
          <div>
            <dt>Address</dt>
            <dd>
              {settings.data?.street_address ||
                "Adda Plot, Al Kabir Town, Raiwind Road"}
              , {settings.data?.city || "Lahore"}, Pakistan
            </dd>
          </div>
          <div>
            <dt>Main WhatsApp</dt>
            <dd>{settings.data?.main_whatsapp || "0321-7165000"}</dd>
          </div>
          <div>
            <dt>Secondary WhatsApp</dt>
            <dd>{settings.data?.secondary_whatsapp || "0308-6235608"}</dd>
          </div>
          <div>
            <dt>Account provisioning</dt>
            <dd>
              Trusted operator only. No self-registration or role assignment.
            </dd>
          </div>
          <div>
            <dt>Access levels</dt>
            <dd>
              Administrator: Draft management, review and publication. Editor:
              read and private preview.
            </dd>
          </div>
        </dl>
        <p className="admin-help">
          Fallback contact details above are the owner-provided business
          information. Database settings editing is not active in Phase 3.
        </p>
      </section>
      <div className="admin-notice">
        Production release remains blocked until legacy storefront queries use
        the approved public catalog views and cache/media withdrawal is
        implemented. No production migration or deployment is included.
      </div>
    </>
  );
}
