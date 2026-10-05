import { describe, expect, it } from "vitest";
import { currencyForCountry, formatMoney } from "./currency";
import { SCENARIOS } from "./catalog";

describe("currency", () => {
  it("defaults to USD when no location is known", () => {
    expect(currencyForCountry(null)).toBe("USD");
    expect(currencyForCountry("ZZ")).toBe("USD");
  });
  it("picks the local currency from the visitor's country", () => {
    expect(currencyForCountry("IN")).toBe("INR");
    expect(currencyForCountry("de")).toBe("EUR");
  });
  it("converts USD amounts with the given rate", () => {
    expect(formatMoney(1, "INR", { INR: 88 })).toBe("₹88.0000");
  });
  it("falls back to USD when a rate is missing", () => {
    expect(formatMoney(1, "EUR", {})).toBe("$1.0000");
  });
});

describe("scenarios", () => {
  it("every scenario has a sample conversation to simulate", () => {
    for (const s of SCENARIOS) expect(s.sample.length).toBeGreaterThan(0);
  });
});
