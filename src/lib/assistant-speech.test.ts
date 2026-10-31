import { describe, expect, it } from "vitest";
import { assistantClock } from "./assistant-speech";

describe("natural assistant clock times", () => {
  it.each([
    ["13:00", "1:00 PM"], ["17:00", "5:00 PM"],
    ["10:30", "10:30 AM"], ["20:00", "8:00 PM"],
    ["00:00", "12:00 AM"], ["12:00", "12:00 PM"],
  ])("converts %s to %s", (time, expected) => {
    expect(assistantClock(time)).toBe(expected);
  });
  it("does not invent a time for invalid input", () => {
    expect(assistantClock("25:99")).toBe("25:99");
  });
});