import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("@/lib/server/auth.server", async (original) => ({
  ...await original<typeof import("@/lib/server/auth.server")>(),
  verifyRequest: vi.fn(async () => ({ userId: "test-user" })),
  providerKey: vi.fn((name: string) => name === "XAI_API_KEY" ? "test-xai-key" : name === "ANTHROPIC_API_KEY" ? "test-anthropic-key" : undefined),
}));

import { Route } from "../../routes/api/llm";

const handler = (Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
function request(llmId: string) {
  return new Request("http://localhost/api/llm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ llmId, system: "Sample", messages: [{ role: "user", content: "Hello" }] }) });
}
afterEach(() => vi.unstubAllGlobals());

describe("LLM provider routing", () => {
  it.each([
    ["an-claude-sonnet-5", "claude-sonnet-5"],
    ["an-claude-haiku-4.5", "claude-haiku-4-5-20251001"],
  ])("streams %s through native Anthropic Messages", async (id, model) => {
    const fetchMock = vi.fn(async () => new Response([
      { type: "message_start", message: { usage: { input_tokens: 12, output_tokens: 1 } } },
      { type: "ping" },
      { type: "content_block_delta", delta: { type: "thinking_delta", thinking: "hidden" } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } },
      { type: "message_delta", usage: { output_tokens: 3 } },
      { type: "message_stop" },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handler({ request: request(id) });
    expect(fetchMock).toHaveBeenCalledWith("https://api.anthropic.com/v1/messages", expect.objectContaining({
      headers: { "x-api-key": "test-anthropic-key", "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, system: "Sample", messages: [{ role: "user", content: "Hello" }], max_tokens: 1024, stream: true }),
    }));
    expect((await response.text()).trim().split("\n").map((line) => JSON.parse(line))).toEqual([{ t: "d", v: "Hello" }, { t: "u", in: 12, out: 3 }]);
  });

  it("preserves Anthropic access denials without retrying", async () => {
    const fetchMock = vi.fn(async () => new Response('{"error":{"message":"Access denied"}}', { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handler({ request: request("an-claude-sonnet-5") });
    expect(response.status).toBe(403);
    expect(await response.text()).toContain("Access denied");
    expect(fetchMock).toHaveBeenCalledTimes(1);
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