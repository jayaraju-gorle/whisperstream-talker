import { describe, expect, it } from "vitest";
import { DEFAULT_COMPARE } from "./studio-defaults";
describe("Studio entry defaults", () => {
  it("starts with two-agent comparison enabled", () => {
    expect(DEFAULT_COMPARE).toBe(true);
  });
});
