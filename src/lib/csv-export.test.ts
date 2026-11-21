import { describe, expect, it } from "vitest";
import { buildCsv, escapeCsvCell } from "./csv-export";

describe("csv-export", () => {
  it("escapes commas, quotes, and newlines per RFC 4180", () => {
    expect(escapeCsvCell("plain")).toBe("plain");
    expect(escapeCsvCell('Hello, "World"')).toBe('"Hello, ""World"""');
    expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    expect(escapeCsvCell(null)).toBe("");
  });

  it("builds UTF-8 BOM CSV output with headers and rows", () => {
    const out = buildCsv(
      ["Name", "Business", "Notes"],
      [["Arun", "Hanvi's Dental", "Tomorrow, 11 AM"]],
    );
    expect(out).toBe('\uFEFFName,Business,Notes\r\nArun,Hanvi\'s Dental,"Tomorrow, 11 AM"');
  });
});
