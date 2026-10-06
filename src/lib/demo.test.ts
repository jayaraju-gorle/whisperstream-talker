import { describe, expect, it } from "vitest";
import { DEFAULT_AGENT_A } from "./catalog";
import { demoMetrics, demoReply } from "./demo";
import { builtInKnowledge } from "./library";

describe("Guest sample interactions", () => {
  it("uses only attached or session-selected knowledge", () => {
    const cfg = { ...DEFAULT_AGENT_A, scenario: "general" };
    const kb = { id: "local", name: "Demo policy", content: "Special delivery fee is 37 credits." };
    expect(demoReply(cfg, "delivery fee", 0, [], [kb], [])).not.toContain("37 credits");
    expect(demoReply(cfg, "delivery fee", 0, [], [kb], ["local"])).toContain("37 credits");
  });
  it("does not claim a real booking was made", () => {
    expect(demoReply({ ...DEFAULT_AGENT_A, scenario: "hospital" }, "Yes, please book whichever slot is closest and confirm it.", 3, [], builtInKnowledge, [])).toContain("No real booking");
  });
  it("has no transcription or synthesis usage for silent text samples", () => {
    const metrics = demoMetrics(DEFAULT_AGENT_A, 0, false, "Hi", "Hello", false);
    expect(metrics.audioSeconds).toBe(0);
    expect(metrics.ttsChars).toBe(0);
    expect(metrics.cost.stt).toBe(0);
    expect(metrics.cost.tts).toBe(0);
  });
});