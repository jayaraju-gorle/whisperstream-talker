import { describe, expect, it } from "vitest";
import { computeCost } from "./catalog";
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
