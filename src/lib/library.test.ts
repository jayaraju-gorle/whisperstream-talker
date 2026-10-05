import { describe, expect, it } from "vitest";
import { buildSystemPrompt, retrievalQuery, scenarioSample, KB_CHAR_BUDGET, type CustomScenario, type KnowledgeBase } from "./library";

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

describe("passage retrieval", () => {
  const kb: KnowledgeBase[] = [
    {
      id: "k1",
      name: "Clinic",
      content: [
        "Opening hours: Monday to Friday 9 am to 5 pm. Closed on Sundays.",
        "Cardiology consultation fee is 800 rupees. Dr. Mehta sees cardiology patients on Thursdays.",
        "Parking is free in the basement for patients.",
        "x ".repeat(3000),
      ].join("\n\n"),
    },
  ];
  it("sends only the matching excerpt, not the whole knowledge text", () => {
    const p = buildSystemPrompt("custom:s1", custom, kb, [], "How much is a cardiology consultation?");
    expect(p).toContain("800 rupees");
    expect(p).not.toContain("Parking is free");
    expect(p.length).toBeLessThan(2000);
  });
  it("says nothing matched when the question is unrelated", () => {
    const p = buildSystemPrompt("custom:s1", custom, kb, [], "zebra quantum");
    expect(p).not.toContain("Opening hours");
    expect(p).toContain("nothing in it matches");
  });
  it("uses the previous caller message for follow-ups", () => {
    expect(retrievalQuery([
      { role: "user", content: "Which day is cardiology?" },
      { role: "assistant", content: "Thursday." },
      { role: "user", content: "And the fee?" },
    ])).toBe("Which day is cardiology? And the fee?");
  });
});
