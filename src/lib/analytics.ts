// Google Analytics 4 (gtag.js) — browser-only, initialized from the root layout's useEffect.

// Fallback keeps tracking working even if the env var isn't injected at build time.
const measurementId =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as string | undefined) ||
  "G-XESZQ4XLEL";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // gtag.js only processes the Arguments object — pushing a plain array is silently ignored.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("set", "developer_id.dZjgwMW", true);
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

export function trackPageView(path: string): void {
  if (!initialized || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path });
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!initialized || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
