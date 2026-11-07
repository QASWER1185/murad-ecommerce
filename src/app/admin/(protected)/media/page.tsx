import { adminPageSession } from "@/lib/admin/data";
import { PageHeading } from "@/components/admin/shared";
import { Image as ImageIcon, Images, PanelTop } from "lucide-react";
export default async function Media() {
  await adminPageSession();
  return (
    <>
      <PageHeading
        title="Media & banners"
        description="Original imagery, managed centrally. Private by default and verified before public use."
      />
      <div className="admin-preparation-grid">
        {[
          {
            icon: Images,
            title: "Product galleries",
            text: "Original manufacturer images, immutable replacements, alt text and an ordered gallery.",
          },
          {
            icon: ImageIcon,
            title: "Brand logos",
            text: "Verified brand assets for Porta, Faisal Sanitary, Dell Ceramics, NASGAS and other collections.",
          },
          {
            icon: PanelTop,
            title: "Homepage banners",
            text: "Central banner assets and content, ready for integration without changing approved layouts.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <section className="admin-card admin-preparation" key={title}>
            <span className="admin-small-icon">
              <Icon size={27} />
            </span>
            <span className="admin-phase">PHASE 4 · NOT ACTIVE</span>
            <h2>{title}</h2>
            <p>{text}</p>
            <button className="admin-button admin-button-secondary" disabled>
              Upload & manage · Phase 4
            </button>
          </section>
        ))}
      </div>
      <div className="admin-notice">
        Binary uploads, file inspection, private preview delivery and public
        eligibility checks are pending Phase 4. Existing gallery alt text can be
        edited on Draft products now. No upload control is represented as
        operational.
      </div>
    </>
  );
}
