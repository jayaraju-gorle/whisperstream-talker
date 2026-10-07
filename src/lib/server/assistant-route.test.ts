import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ stream: vi.fn(), from: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => ({ responses: () => "test-model" }) }));
vi.mock("ai", () => ({ convertToModelMessages: async () => [], isStepCount: () => 4, tool: (options: unknown) => options, streamText: mocks.stream }));
vi.mock("@/lib/server/run-id", () => ({ createLovableAiGatewayRunIdFetch: () => ({}), getLovableAiGatewayRunId: () => undefined, withLovableAiGatewayRunIdHeader: (response: Response) => response }));
import { Route } from "@/routes/api/public/assistant";
const handler = (Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("visitor contact updates", () => {
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
    const execute = call[0].tools.save_lead.execute;
    const result = await execute({ name: "Ram", email: "ram@example.com", phone: "+91 9876543210", company: null, interest: null });
    expect(result).toEqual({ saved: true, updated: true });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ phone: "+91 9876543210" }));
    expect(eq).toHaveBeenCalledWith("conversation_id", "visitor-conversation");
    expect(eq).toHaveBeenCalledWith("id", "existing-lead");
    expect(chain.insert).not.toHaveBeenCalled();
  });
});