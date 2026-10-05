// Display currency for cost metrics. All prices are stored in USD and converted
// at display time using daily rates from /api/public/rates.

export const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "INR", label: "Indian Rupee" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "MXN", label: "Mexican Peso" },
  { code: "ZAR", label: "South African Rand" },
  { code: "KRW", label: "South Korean Won" },
  { code: "IDR", label: "Indonesian Rupiah" },
  { code: "NGN", label: "Nigerian Naira" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const isCurrency = (v: unknown): v is CurrencyCode =>
  typeof v === "string" && CURRENCIES.some((c) => c.code === v);

const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD", IN: "INR", GB: "GBP", JP: "JPY", CN: "CNY", AU: "AUD", CA: "CAD", SG: "SGD",
  AE: "AED", SA: "SAR", CH: "CHF", BR: "BRL", MX: "MXN", ZA: "ZAR", KR: "KRW", ID: "IDR", NG: "NGN",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", PT: "EUR",
  FI: "EUR", GR: "EUR", LU: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", MT: "EUR", CY: "EUR", HR: "EUR",
};

/** Currency for a two-letter country code; USD when unknown. */
export function currencyForCountry(country: string | null | undefined): CurrencyCode {
  return (country && COUNTRY_CURRENCY[country.toUpperCase()]) || "USD";
}

/** Formats a USD amount in the chosen currency. Falls back to USD when no rate is known. */
export function formatMoney(usd: number, code: CurrencyCode, rates: Record<string, number>): string {
  const rate = code === "USD" ? 1 : rates[code];
  const cur = rate ? code : "USD";
  const v = usd * (rate ?? 1);
  if (v === 0) return new Intl.NumberFormat("en", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(0);
  const digits = Math.abs(v) < 0.01 ? 5 : 4;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}
