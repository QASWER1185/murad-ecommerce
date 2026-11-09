"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { analyticsPath, privateSignal, track } from "@/lib/analytics/events";
const consentKey = "murad-analytics-consent-v1";
export function AnalyticsRuntime({
  config,
}: {
  config: { measurementId: string } | null;
}) {
  const pathname = usePathname();
  useEffect(() => {
    function apply() {
      const enabled =
        !!config &&
        !!analyticsPath(pathname) &&
        !privateSignal() &&
        localStorage.getItem(consentKey) === "granted";
      window.__muradAnalyticsAllowed = enabled;
      if (!config) return;
      (window as unknown as Record<string, unknown>)[
        "ga-disable-" + config.measurementId
      ] = !enabled;
      if (!enabled) return;
      if (!window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args: unknown[]) => {
          window.dataLayer!.push(args);
        };
        window.gtag("consent", "default", {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
        window.gtag("js", new Date());
        window.gtag("config", config.measurementId, {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          page_location:
            window.location.origin + (analyticsPath(pathname) || "/"),
          page_referrer: "",
          page_title: "M Murad Sons Storefront",
        });
      }
      if (!document.getElementById("murad-ga4")) {
        const script = document.createElement("script");
        script.id = "murad-ga4";
        script.async = true;
        script.referrerPolicy = "no-referrer";
        script.src = `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`;
        document.head.appendChild(script);
      }
      window.dispatchEvent(new Event("murad-analytics-ready"));
    }
    try {
      apply();
    } catch {
      window.__muradAnalyticsAllowed = false;
    }
    window.addEventListener("murad-analytics-consent", apply);
    return () => {
      window.removeEventListener("murad-analytics-consent", apply);
      window.__muradAnalyticsAllowed = false;
    };
  }, [config, pathname]);
  useEffect(() => {
    function click(event: MouseEvent) {
      const anchor = (event.target as Element)?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      try {
        const url = new URL(href, window.location.origin);
        if (url.hostname === "wa.me") {
          if (event.defaultPrevented) return;
          const contact =
            url.pathname === "/923217165000"
              ? "main"
              : url.pathname === "/923086235608"
                ? "secondary"
                : "other";
          track("whatsapp_click", { contact });
        } else if (
          url.origin === window.location.origin &&
          url.pathname.startsWith("/product/")
        ) {
          const product = anchor.getAttribute("data-product-id");
          if (product) track("select_item", { product_id: product });
        }
      } catch {}
    }
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
export function AnalyticsConsent({ configured }: { configured: boolean }) {
  const [value, setValue] = useState("Not selected");
  function set(consent: "granted" | "denied") {
    try {
      localStorage.setItem(consentKey, consent);
      window.dispatchEvent(new Event("murad-analytics-consent"));
      setValue(consent === "granted" ? "Allowed" : "Declined");
    } catch {
      setValue("Browser storage unavailable");
    }
  }
  return (
    <section>
      <h2>Optional analytics</h2>
      <p>
        Analytics are off until you choose Allow. Customer names, contact
        numbers, notes, request references and search text are not sent as
        analytics parameters. We respect browser Do Not Track and Global Privacy
        Control signals.
      </p>
      {configured ? (
        <>
          <button onClick={() => set("granted")}>
            Allow optional analytics
          </button>{" "}
          <button onClick={() => set("denied")}>
            Decline / withdraw analytics
          </button>
          <p role="status">Preference: {value}</p>
        </>
      ) : (
        <p>Optional analytics are not configured.</p>
      )}
    </section>
  );
}
export function ProductView({ id }: { id: string }) {
  const sent = useRef("");
  useEffect(() => {
    const send = () => {
      if (sent.current !== id && track("view_item", { product_id: id }))
        sent.current = id;
    };
    send();
    window.addEventListener("murad-analytics-ready", send);
    return () => window.removeEventListener("murad-analytics-ready", send);
  }, [id]);
  return null;
}
export function SearchEvent({
  count,
  length,
}: {
  count: number;
  length: number;
}) {
  const sent = useRef(false);
  useEffect(() => {
    const send = () => {
      if (
        !sent.current &&
        track("search", {
          result_count: count,
          query_length_bucket:
            length === 0
              ? "empty"
              : length <= 20
                ? "short"
                : length <= 60
                  ? "medium"
                  : "long",
        })
      )
        sent.current = true;
    };
    send();
    window.addEventListener("murad-analytics-ready", send);
    return () => window.removeEventListener("murad-analytics-ready", send);
  }, [count, length]);
  return null;
}
