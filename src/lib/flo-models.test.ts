import { describe, expect, it } from "vitest";
import { resolveFloModel } from "./flo-models";
describe("resolveFloModel", () => {
  it("uses the stored model", () => expect(resolveFloModel({ model: "anthropic/claude-sonnet-5" }).id).toBe("anthropic/claude-sonnet-5"));
  it("falls back to gpt-6-astra when unset or unknown", () => {
    expect(resolveFloModel(undefined).id).toBe("openai/gpt-6-astra");
    expect(resolveFloModel({ model: "evil/model" }).id).toBe("openai/gpt-6-astra");
  });
});

import { floTurnCostUsd as cost } from "./flo-models";
describe("floTurnCostUsd", () => {
  it("prices GPT-6 Astra at $5 in / $20 out per million tokens", () => {
    expect(cost("openai/gpt-6-astra", 1_000_000, 1_000_000)).toBe(25);
  });
  it("returns null without token counts", () => {
    expect(cost("openai/gpt-6-astra", null, 10)).toBeNull();
  });
});
