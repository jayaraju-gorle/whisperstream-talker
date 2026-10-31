import { describe, expect, it } from "vitest";
import { isLikelyTestLead } from "./lead-filters";

describe("likely test leads", () => {
  it("matches example.com addresses case-insensitively, not lookalike domains", () => {
    expect(isLikelyTestLead({ name: "Visitor", email: "owner@EXAMPLE.COM" })).toBe(true);
    expect(isLikelyTestLead({ name: "Visitor", email: "owner@notexample.com" })).toBe(false);
  });
  it("matches Playwright in submitted details", () => {
    expect(isLikelyTestLead({ name: "Playwright Visitor", email: "owner@clinic.in" })).toBe(true);
  });
  it("matches explicit test indicators in names, email handles and submitted details", () => {
    for (const lead of [
      { name: "Test Lead", email: "owner@clinic.in" },
      { name: "Visitor", email: "test123@clinic.in" },
      { name: "Visitor", email: "owner@clinic.in", interest: "E2E submission" },
      { name: "Visitor", email: "owner@clinic.in", company: "QA Clinic" },
    ]) expect(isLikelyTestLead(lead)).toBe(true);
  });
  it("keeps genuine words containing test and genuine clinic-demo interest", () => {
    expect(isLikelyTestLead({ name: "Latest Health", email: "contest@clinic.in", interest: "Interested in the Aura demo" })).toBe(false);
  });
});