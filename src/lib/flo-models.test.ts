import { describe, expect, it } from "vitest";
import { resolveFloModel } from "./flo-models";
describe("resolveFloModel", () => {
  it("uses the stored model", () => expect(resolveFloModel({ model: "anthropic/claude-sonnet-5" }).id).toBe("anthropic/claude-sonnet-5"));
  it("falls back to gpt-6-astra when unset or unknown", () => {
    expect(resolveFloModel(undefined).id).toBe("openai/gpt-6-astra");
    expect(resolveFloModel({ model: "evil/model" }).id).toBe("openai/gpt-6-astra");
  });
});
