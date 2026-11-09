import type { Media as MediaRecord } from "@/lib/storefront/types";
export function Media({
  image,
  enabled,
  sizes = "(max-width: 650px) 45vw, 250px",
  eager = false,
  className,
}: {
  image?: MediaRecord | null;
  enabled: boolean;
  sizes?: string;
  eager?: boolean;
  className?: string;
}) {
  if (!enabled || !image)
    return (
      <span
        className={className}
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          height: "100%",
          minHeight: 80,
          color: "#67788b",
          fontSize: 11,
        }}
      >
        Product image not available
      </span>
    );
  // Direct authenticated-public derivatives recheck eligibility on every request.
  // The shared Next.js optimizer is intentionally excluded for managed media.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`/media/catalog/${image.media_id}/640`}
      srcSet={["320", "640", "1280"]
        .map(
          (size) =>
            `/media/catalog/${image.media_id}/${size} ${Math.min(Number(size), image.width)}w`,
        )
        .filter(
          (item, i, all) =>
            all.findIndex((v) => v.split(" ")[1] === item.split(" ")[1]) === i,
        )
        .join(", ")}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt_text}
      loading={eager ? "eager" : "lazy"}
      style={{ objectFit: "contain", width: "100%", height: "100%" }}
    />
  );
}
