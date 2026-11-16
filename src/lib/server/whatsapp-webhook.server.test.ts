import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ verify: vi.fn(), from: vi.fn(), inbound: vi.fn(), typing: vi.fn(), drain: vi.fn(), mode: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("@lovable.dev/webhooks-js", () => ({ verifyWebhookRequest: mocks.verify }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/server/whatsapp.server", () => ({ handleMessages: mocks.inbound, typingForPayload: mocks.typing, drainWhatsApp: mocks.drain }));
vi.mock("@/lib/server/whatsapp-mode.server", () => ({ loadWhatsAppMode: mocks.mode }));
import { Route } from "@/routes/api/public/whatsapp/webhook";
const post = (Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });
function setup() {
  vi.stubEnv("WHATSAPP_API_KEY", "test-key");
  const payload = { entry: [{ changes: [{ value: { messages: [{ id: "wamid.test", from: "919999999999", type: "text", text: { body: "Hours?" } }] } }] }] };
  mocks.verify.mockResolvedValue({ payload });
  mocks.from.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: null }) });
  mocks.inbound.mockResolvedValue(undefined);
  mocks.drain.mockResolvedValue(undefined);
  mocks.mode.mockResolvedValue({ mode: "manual", clinic_id: null });
  const request = new Request("http://localhost/api/public/whatsapp/webhook", { method: "POST", headers: { "X-Lovable-Delivery": "delivery-test", "X-Lovable-Event": "whatsapp.message" }, body: JSON.stringify(payload) });
  return { request, payload };
}
describe("manual-mode webhook guard", () => {
  it("durably records a verified inbound message and acknowledges without typing or replies", async () => {
    const { request, payload } = setup();
    expect((await post({ request })).status).toBe(200);
    expect(mocks.from).toHaveBeenCalledWith("whatsapp_webhook_events");
    expect(mocks.inbound).toHaveBeenCalledWith(expect.anything(), payload);
    expect(mocks.typing).not.toHaveBeenCalled();
  });
  it("does not acknowledge failed message storage", async () => {
    const { request } = setup();
    mocks.inbound.mockRejectedValue(new Error("storage unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await post({ request })).status).toBe(500);
    expect(mocks.drain).not.toHaveBeenCalled();
    log.mockRestore();
  });
  it("rejects an unverified callback before recording or processing", async () => {
    const { request } = setup();
    mocks.verify.mockRejectedValue(new Error("invalid signature"));
    expect((await post({ request })).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.inbound).not.toHaveBeenCalled();
  });
});