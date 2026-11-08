"use client";
import { useEffect, useState } from "react";
export function InvalidationProcessor({ csrf }: { csrf: string }) {
  const [status, setStatus] = useState(
    "Catalog updates are checked while this workspace is open.",
  );
  useEffect(() => {
    let disposed = false,
      busy = false;
    const drain = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        let count = 0;
        for (let batch = 0; batch < 4; batch++) {
          const r = await fetch("/admin/invalidations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrf,
            },
            body: "{}",
            cache: "no-store",
          });
          if (!r.ok) throw Error();
          const state = await r.json();
          count += state.processed;
          if (state.failed) throw Error();
          if (!state.more) break;
        }
        if (!disposed)
          setStatus(
            count
              ? `${count} catalog update events processed.`
              : "Catalog updates checked. Public reads always recheck publication.",
          );
      } catch {
        if (!disposed)
          setStatus(
            "Update processing will retry. Events remain saved; public reads still recheck publication.",
          );
      } finally {
        busy = false;
      }
    };
    void drain();
    const timer = setInterval(() => void drain(), 15000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [csrf]);
  return (
    <p
      style={{ fontSize: 11, color: "#64748b", margin: "12px 0" }}
      role="status"
    >
      {status}
    </p>
  );
}
