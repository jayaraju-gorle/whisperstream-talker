import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("@/lib/server/auth.server", async (original) => ({
  ...await original<typeof import("@/lib/server/auth.server")>(),
  verifyRequest: vi.fn(async () => ({ userId: "test-user" })),
  providerKey: vi.fn((name: string) => name === "XAI_API_KEY" ? "test-xai-key" : undefined),
}));

import { Route } from "../../routes/api/llm";

const handler = (Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
function request(llmId: string) {
  return new Request("http://localhost/api/llm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ llmId, system: "Sample", messages: [{ role: "user", content: "Hello" }] }) });
}
afterEach(() => vi.unstubAllGlobals());

describe("LLM provider routing", () => {
  it.each(["an-claude-3.5-sonnet", "an-claude-3.5-haiku"])("rejects retired %s without making a paid request", async (id) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await handler({ request: request(id) });
    expect(response.status).toBe(410);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends Grok to xAI and converts streamed text and token usage", async () => {
    const fetchMock = vi.fn(async () => new Response('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: {"usage":{"prompt_tokens":12,"completion_tokens":3}}\n\ndata: [DONE]\n\n'));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handler({ request: request("xai-grok-4.7") });
    expect(fetchMock).toHaveBeenCalledWith("https://api.x.ai/v1/chat/completions", expect.objectContaining({ headers: { Authorization: "Bearer test-xai-key", "Content-Type": "application/json" }, body: expect.stringContaining('"model":"grok-4.7"') }));
    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
    expect(events).toEqual([{ t: "d", v: "Hello" }, { t: "u", in: 12, out: 3 }]);
  });
});