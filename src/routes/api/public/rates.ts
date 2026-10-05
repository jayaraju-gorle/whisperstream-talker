import { createFileRoute } from "@tanstack/react-router";
import { CURRENCIES, currencyForCountry } from "@/lib/currency";

// Public, read-only: daily USD exchange rates plus a suggested currency from the
// visitor's country (edge geolocation header). No user data is returned.
let cache: { at: number; rates: Record<string, number> } | null = null;
const DAY = 24 * 60 * 60 * 1000;

async function loadRates() {
  if (cache && Date.now() - cache.at < DAY / 2) return cache.rates;
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("rates unavailable");
  const j = (await res.json()) as { rates?: Record<string, number> };
  const rates: Record<string, number> = {};
  for (const c of CURRENCIES) if (typeof j.rates?.[c.code] === "number") rates[c.code] = j.rates[c.code]!;
  cache = { at: Date.now(), rates };
  return rates;
}

export const Route = createFileRoute("/api/public/rates")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const country = request.headers.get("cf-ipcountry");
        let rates: Record<string, number> = { USD: 1 };
        try {
          rates = await loadRates();
        } catch {
          /* fall back to USD only */
        }
        return new Response(
          JSON.stringify({ rates, suggested: currencyForCountry(country && country !== "XX" ? country : null) }),
          { headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=3600" } },
        );
      },
    },
  },
});
