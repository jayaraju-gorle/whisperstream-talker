import { describe, expect, it } from "vitest";
import { DEFAULT_TIMEZONE, formatTimestamp, validTimezone } from "./timezone";
describe("Assistant timezone", () => {
  it("defaults to IST and converts UTC timestamps by five hours thirty minutes", () => {
    expect(DEFAULT_TIMEZONE).toBe("Asia/Kolkata");
    expect(formatTimestamp("2026-10-31T01:00:00Z")).toContain("06:30:00 am IST");
  });
  it("allows UTC as an alternative without changing the stored instant", () => {
    expect(validTimezone("UTC")).toBe(true);
    expect(formatTimestamp("2026-10-31T01:00:00Z", "UTC")).toContain("01:00:00 am UTC");
    expect(validTimezone("invalid")).toBe(false);
  });
});
import { resolvePreferredTime as rpt } from "./timezone";
describe("resolvePreferredTime", () => {
  it("turns tomorrow into the date after the IST received day", () => {
    expect(rpt("Tomorrow at 12:00 PM", "2026-11-13T19:29:17Z")).toBe("Sun, 15 Nov 2026, 12:00 PM");
  });
  it("leaves explicit times untouched", () => {
    expect(rpt("20 Nov, 4 PM", "2026-11-13T10:00:00Z")).toBe("20 Nov, 4 PM");
  });
});
