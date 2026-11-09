import Link from "next/link";
import { adminPageSession } from "@/lib/admin/data";
import {
  PageHeading,
  Status,
  ProductIdentity,
  EmptyState,
} from "@/components/admin/shared";
import {
  Package,
  FilePenLine,
  ClipboardCheck,
  Globe,
  ArrowUpRight,
  Plus,
  ShieldCheck,
} from "lucide-react";
import type { AdminProduct } from "@/lib/admin/data";
export default async function Overview() {
  const { client, actor } = await adminPageSession();
  const states = ["draft", "ready_for_review", "published"] as const;
  const [all, ...counts] = await Promise.all([
    client
      .from("products")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null),
    ...states.map((status) =>
      client
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("publication_status", status)
        .is("archived_at", null),
    ),
  ]);
  const recent = await client
    .from("products")
    .select("id,name,sku,model,publication_status,updated_at")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(5);
  if ([all, ...counts, recent].some((r) => r.error))
    throw new Error("Dashboard unavailable");
  const cards = [
    {
      label: "Total products",
      value: all.count,
      icon: Package,
      note: "In your active catalog",
    },
    {
      label: "Draft products",
      value: counts[0].count,
      icon: FilePenLine,
      note: "Private, ready to develop",
    },
    {
      label: "Ready for review",
      value: counts[1].count,
      icon: ClipboardCheck,
      note: "Awaiting explicit approval",
    },
    {
      label: "Published",
      value: counts[2].count,
      icon: Globe,
      note: "Visibility reviewed & approved",
    },
  ];
  return (
    <>
      <PageHeading
        title="Store overview"
        description="A clear view of your catalog. Every product, ready when you are."
      >
        {actor.role === "admin" ? (
          <Link className="admin-button" href="/admin/products/new">
            <Plus size={17} />
            Add product
          </Link>
        ) : null}
      </PageHeading>
      <div className="admin-welcome">
        <div>
          <p className="admin-eyebrow">BUILT ON TRUST. PREPARED FOR GROWTH.</p>
          <h2>
            Your next chapter starts
            <br />
            with a well-kept catalog.
          </h2>
          <p>
            Add the structure today. Publish genuine product details when
            they’re ready.
          </p>
          <Link href="/admin/products">
            Manage your products <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="admin-welcome-art" aria-hidden="true">
          <div className="admin-art-grid" />
          <span className="admin-art-box art-one" />
          <span className="admin-art-box art-two" />
          <span className="admin-art-box art-three" />
          <ShieldCheck size={58} />
        </div>
      </div>
      <div className="admin-stats">
        {cards.map(({ label, value, icon: Icon, note }) => (
          <div className="admin-stat" key={label}>
            <span>
              <Icon size={19} />
            </span>
            <p>{label}</p>
            <strong>{value ?? 0}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Recently updated</h2>
              <p>The latest work in your product catalog.</p>
            </div>
            <Link href="/admin/products">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>
          {recent.data?.length ? (
            <div className="admin-recent">
              {recent.data.map((row) => (
                <Link href={`/admin/products/${row.id}`} key={row.id}>
                  <ProductIdentity product={row as AdminProduct} />
                  <Status value={row.publication_status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your catalog starts here"
              description="Create a Draft without an image or price."
              create={actor.role === "admin"}
            />
          )}
        </section>
        <section className="admin-card admin-publishing-guide">
          <span className="admin-small-icon">
            <ShieldCheck size={21} />
          </span>
          <h2>Publish with confidence</h2>
          <p>A clear path from an idea to an approved product.</p>
          <ol>
            <li>
              <strong>01</strong>
              <span>
                <b>Build a Draft</b>Add genuine information at your pace.
              </span>
            </li>
            <li>
              <strong>02</strong>
              <span>
                <b>Review the details</b>Verify identity, content and any
                claims.
              </span>
            </li>
            <li>
              <strong>03</strong>
              <span>
                <b>Approve publication</b>Decide visibility and indexing
                separately.
              </span>
            </li>
          </ol>
          <small>
            Drafts stay private. Missing images and prices are welcome during
            development.
          </small>
        </section>
      </div>
    </>
  );
}
