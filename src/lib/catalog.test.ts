import { describe, expect, it } from "vitest";
import { computeCost, findLlm, findStt, modelAvailable } from "./catalog";
import { SentenceChunker } from "./sentence-chunker";

describe("computeCost", () => {
  it("charges STT per minute of audio", () => {
    const c = computeCost({ sttId: "dg-nova-3", llmId: "x", ttsId: "x" }, { audioSeconds: 60 });
    expect(c.stt).toBeCloseTo(0.0043, 6);
  });

  it("charges LLM per million input and output tokens", () => {
    const c = computeCost(
      { sttId: "x", llmId: "groq-llama-3.3-70b", ttsId: "x" },
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
    );
    expect(c.llm).toBeCloseTo(0.59 + 0.79, 6);
  });

  it("charges TTS per thousand characters and sums the total", () => {
    const c = computeCost(
      { sttId: "dg-nova-3", llmId: "x", ttsId: "dg-aura-2" },
      { audioSeconds: 30, ttsChars: 2000 },
    );
    expect(c.tts).toBeCloseTo(0.06, 6);
    expect(c.total).toBeCloseTo(0.06 + 0.00215, 6);
  });
});

describe("SentenceChunker", () => {
  it("emits a sentence as soon as it ends, before the stream finishes", () => {
    const ch = new SentenceChunker();
    expect(ch.push("Hello there, how are")).toEqual([]);
    expect(ch.push(" you today? I am")).toEqual(["Hello there, how are you today?"]);
    expect(ch.flush()).toEqual(["I am"]);
  });

  it("does not split very short fragments like 'Hi.'", () => {
    const ch = new SentenceChunker({ minChars: 12 });
    expect(ch.push("Hi. Welcome to the clinic. ")).toEqual(["Hi. Welcome to the clinic."]);
  });
});

describe("provider model access and pricing", () => {
  it("attributes built-in OpenAI speech to OpenAI without requiring a direct OpenAI key", () => {
    const model = findStt("lv-4o-mini-transcribe");
    expect(model?.provider).toBe("openai");
    if (!model) throw new Error("Missing built-in model");
    expect(modelAvailable(model, { lovable: true, openai: false })).toBe(true);
    expect(modelAvailable(model, { lovable: false, openai: true })).toBe(false);
  });

  it.each([
    ["an-claude-sonnet-5", "claude-sonnet-5", 2, 10],
    ["an-claude-haiku-4.5", "claude-haiku-4-5-20251001", 1, 5],
  ])("uses live Anthropic access and pricing for %s", (id, apiModel, input, output) => {
    const model = findLlm(String(id));
    if (!model) throw new Error("Missing Claude model");
    expect(model.model).toBe(apiModel);
    expect(modelAvailable(model, { anthropic: true, groq: false })).toBe(true);
    expect(modelAvailable(model, { anthropic: false, groq: true })).toBe(false);
    const cost = computeCost({ sttId: "x", llmId: String(id), ttsId: "x" }, { inputTokens: 1000000, outputTokens: 1000000 });
    expect(cost.llm).toBe(Number(input) + Number(output));
  });

  it("requires the xAI connection for Grok, independently of Groq", () => {
    const model = findLlm("xai-grok-4.7");
    if (!model) throw new Error("Missing Grok");
    expect(modelAvailable(model, { xai: false, groq: true })).toBe(false);
    expect(modelAvailable(model, { xai: true, groq: false })).toBe(true);
  });

  it("charges Grok standard token rates below the long-context threshold", () => {
    const cost = computeCost({ sttId: "x", llmId: "xai-grok-4.7", ttsId: "x" }, { inputTokens: 199999, outputTokens: 1000000 });
    expect(cost.llm).toBeCloseTo(199999 * 2 / 1000000 + 6, 6);
  });

  it("charges Grok long-context rates from 200000 input tokens onward", () => {
    const cost = computeCost({ sttId: "x", llmId: "xai-grok-4.7", ttsId: "x" }, { inputTokens: 200000, outputTokens: 1000000 });
    expect(cost.llm).toBeCloseTo(0.8 + 12, 6);
  });
});
