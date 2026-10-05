import { describe, expect, it } from "vitest";
import { verifyRequest } from "./auth.server";

describe("Live AI authorization", () => {
  it("rejects guests without a sign-in token", async () => {
    const result = await verifyRequest(new Request("http://localhost/api/llm", { method: "POST" }));
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) expect(result.status).toBe(401);
  });
});