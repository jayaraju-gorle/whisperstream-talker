import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ stream: vi.fn(), from: vi.fn(), notice: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => ({ responses: () => "test-model" }) }));
vi.mock("ai", () => ({ createUIMessageStream: (options: unknown) => { mocks.notice(options); return {}; }, createUIMessageStreamResponse: () => new Response("notice"), convertToModelMessages: async () => [], isStepCount: () => 4, tool: (options: unknown) => options, streamText: mocks.stream }));
vi.mock("@/lib/server/run-id", () => ({ createLovableAiGatewayRunIdFetch: () => ({}), getLovableAiGatewayRunId: () => undefined, withLovableAiGatewayRunIdHeader: (response: Response) => response }));
import { Route } from "@/routes/api/public/assistant";
import { handleAssistantGet, handleAssistantPost } from "./assistant-handler.server";
const handler = (Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("visitor contact updates", () => {
  it.each([undefined, "Bolna"] as const)("blocks real clinic lookup for public channel %s", async (channel) => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    const chain = { upsert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "demo" } }) };
    mocks.from.mockReturnValue(chain);
    await handleAssistantPost({ ...(channel ? { channel } : {}), request: new Request("https://example.com", { method: "POST", body: JSON.stringify({ visitorId: channel ? "bolna_1234567890123456" : "visitor_secret_123456", messages: [{ role: "user", parts: [{ type: "text", text: "TRY IVY" }] }] }) }) });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("assistant_conversations");
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(mocks.notice).toHaveBeenCalledTimes(1);
  });
  it("does not expose Bolna conversations to the public browser history reader", async () => {
    const response = await handleAssistantGet({ request: new Request("https://example.com/api/public/assistant?visitorId=bolna_1234567890123456") });
    expect(await response.json()).toEqual({ messages: [] });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects browser writes to the Bolna conversation namespace", async () => {
    const response = await handleAssistantPost({ request: new Request("https://example.com/api/public/assistant", {
      method: "POST", body: JSON.stringify({ visitorId: "bolna_1234567890123456", messages: [{ role: "user", parts: [{ type: "text", text: "Hello" }] }] }),
    }) });
    expect(response.status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("updates the existing lead only within the server-resolved conversation", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    const update = vi.fn();
    const eq = vi.fn();
    const chain = {
      upsert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: { id: "visitor-conversation" }, error: null })),
      eq, order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: { id: "existing-lead" }, error: null })),
      update, insert: vi.fn(), error: null,
    };
    update.mockReturnValue(chain); eq.mockReturnValue(chain);
    mocks.from.mockReturnValue(chain);
    mocks.stream.mockReturnValue({ toUIMessageStreamResponse: () => new Response("ok") });
    await handler({ request: new Request("http://localhost/api/public/assistant", {
      method: "POST", body: JSON.stringify({ visitorId: "visitor_secret_123456", messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "Update my phone" }] }] }),
    }) });
    const call = mocks.stream.mock.calls[0];
    if (!call) throw new Error("Assistant stream was not started");
    expect(Object.keys(call[0].tools)).toEqual(["save_lead"]);
    const execute = call[0].tools.save_lead.execute;
    const result = await execute({ name: "Ram", email: "ram@example.com", phone: "+91 9876543210", company: null, interest: null });
    expect(result).toEqual({ saved: true, updated: true });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ phone: "+91 9876543210" }));
    expect(eq).toHaveBeenCalledWith("conversation_id", "visitor-conversation");
    expect(eq).toHaveBeenCalledWith("id", "existing-lead");
    expect(chain.insert).not.toHaveBeenCalled();
  });
});