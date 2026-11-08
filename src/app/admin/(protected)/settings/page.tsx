import { adminPageSession } from "@/lib/admin/data";
import { PageHeading, CsrfField, Notice } from "@/components/admin/shared";
import { MutationForm } from "@/components/admin/MutationForm";
export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { client, actor } = await adminPageSession();
  const result = await client.from("site_settings").select("*").maybeSingle();
  if (result.error) throw new Error("Settings unavailable");
  const settings = result.data;
  const query = await searchParams;
  return (
    <>
      <PageHeading
        title="Store settings"
        description="Verified business identity and WhatsApp contact information, managed centrally."
      />
      <Notice
        message={
          query.notice === "saved"
            ? "Verified contact settings saved."
            : undefined
        }
      />
      <MutationForm action="/admin/manage/settings">
        <CsrfField />
        <input name="version" type="hidden" value={settings?.version || ""} />
        <input name="country_code" type="hidden" value="PK" />
        <fieldset
          disabled={actor.role !== "admin"}
          className="admin-editor-fields"
        >
          <section className="admin-card admin-form-card">
            <div className="admin-form-grid">
              <label className="admin-span-two">
                Business name
                <input
                  name="business_name"
                  required
                  maxLength={180}
                  defaultValue={
                    settings?.business_name ||
                    "M Murad Sons Building Material Store"
                  }
                />
              </label>
              <label className="admin-span-two">
                Street address
                <input
                  name="street_address"
                  required
                  maxLength={500}
                  defaultValue={
                    settings?.street_address ||
                    "Adda Plot, Al Kabir Town, Raiwind Road"
                  }
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  required
                  maxLength={100}
                  defaultValue={settings?.city || "Lahore"}
                />
              </label>
              <label>
                Main WhatsApp
                <input
                  name="main_whatsapp"
                  required
                  defaultValue={settings?.main_whatsapp || "0321-7165000"}
                />
              </label>
              <label>
                Secondary WhatsApp
                <input
                  name="secondary_whatsapp"
                  required
                  defaultValue={settings?.secondary_whatsapp || "0308-6235608"}
                />
              </label>
            </div>
            <p className="admin-help">
              Initial values above are the store owner’s supplied details.
              Numbers are saved in international +92 format.
            </p>
            <label className="admin-checkbox">
              <input
                name="approve_public"
                type="checkbox"
                defaultChecked={false}
              />
              <span>
                I verified these business details and explicitly approve public
                display. Leave unchecked to retain them privately.
              </span>
            </label>
            {actor.role === "admin" ? (
              <button className="admin-button">Save verified settings</button>
            ) : null}
          </section>
        </fieldset>
      </MutationForm>
      <div className="admin-notice">
        Account roles still require a separately authorized trusted operator. No
        registration or administrator self-assignment is enabled. Storefront
        settings integration remains a coordinated Phase 5 release task.
      </div>
    </>
  );
}
