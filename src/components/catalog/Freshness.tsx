"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
export function Freshness({ generation }: { generation: string }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    let disposed = false,
      checking = false;
    const refresh = async () => {
      if (document.hidden || checking) return;
      checking = true;
      try {
        const r = await fetch("/api/catalog/generation", { cache: "no-store" });
        if (r.ok && !disposed && (await r.json()).generation !== generation)
          router.refresh();
      } finally {
        checking = false;
      }
    };
    const check = () => {
      void refresh().catch(() => {});
    };
    const restored = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", restored);
    const timer = setInterval(check, 15000);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", restored);
    };
  }, [generation, router, pathname]);
  return null;
}
