import { describe, expect, it } from "vitest";
import { buildSystemPrompt, scenarioSample, KB_CHAR_BUDGET, type CustomScenario, type KnowledgeBase } from "./library";

const custom: CustomScenario[] = [
  { id: "s1", label: "Clinic", prompt: "You are the clinic desk.", sample: ["Hi", " ", "Bye"], kb_ids: ["k1"] },
];
const kbs: KnowledgeBase[] = [
  { id: "k1", name: "Hours", content: "Open 9 to 5." },
  { id: "k2", name: "Prices", content: "Consult costs 500." },
];

describe("scenario library", () => {
  it("uses a custom scenario's caller lines, skipping blanks", () => {
    expect(scenarioSample("custom:s1", custom)).toEqual(["Hi", "Bye"]);
  });
  it("includes the scenario's attached knowledge base", () => {
    const p = buildSystemPrompt("custom:s1", custom, kbs, []);
    expect(p).toContain("You are the clinic desk.");
    expect(p).toContain("Open 9 to 5.");
    expect(p).not.toContain("Consult costs 500.");
  });
  it("adds knowledge picked for the session to a built-in scenario", () => {
    const p = buildSystemPrompt("hospital", custom, kbs, ["k2"]);
    expect(p).toContain("City Care Hospital");
    expect(p).toContain("Consult costs 500.");
  });
  it("caps knowledge text at the budget", () => {
    const big = [{ id: "k1", name: "Big", content: "x".repeat(KB_CHAR_BUDGET + 5000) }];
    const p = buildSystemPrompt("custom:s1", custom, big, []);
    expect(p.length).toBeLessThan(KB_CHAR_BUDGET + 1000);
  });
});
