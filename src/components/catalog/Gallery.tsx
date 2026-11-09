"use client";
import { useState } from "react";
import type { Media as MediaRecord } from "@/lib/storefront/types";
import { Media } from "./Media";
import styles from "@/components/sanitary/SanitaryShop.module.css";
export function Gallery({
  images,
  enabled,
}: {
  images: MediaRecord[];
  enabled: boolean;
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className={styles.detailImage} style={{ aspectRatio: "1.6" }}>
        <Media
          image={images[active]}
          enabled={enabled}
          sizes="(max-width:650px) 90vw, 550px"
          eager
        />
      </div>
      {images.length > 1 && (
        <div
          className="catalog-gallery"
          role="group"
          aria-label="Product gallery"
        >
          {images.map((image, index) => (
            <button
              type="button"
              key={image.media_id}
              aria-label={`View product image ${index + 1}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <Media image={image} enabled={enabled} sizes="90px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
