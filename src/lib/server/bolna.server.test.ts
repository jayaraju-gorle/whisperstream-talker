import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn(), read: vi.fn(), from: vi.fn(), handler: vi.fn() }));
vi.mock("ai", () => ({ DefaultChatTransport: class { sendMessages = mocks.send; }, readUIMessageStream: mocks.read }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/server/assistant-handler.server", () => ({ handleAssistantPost: mocks.handler }));
import { handleBolnaChat, handleBolnaModels } from "./bolna.server";

const token = "unit-test-bearer";
function request(body: unknown, auth = `Bearer ${token}`) {
  return new Request("https://example.com/api/bolna/v1/chat/completions", { method: "POST", headers: { Authorization: auth }, body: JSON.stringify(body) });
}
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe("Bolna bearer protection", () => {
  it("fails closed when its shared token is not configured", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", "");
    expect((await handleBolnaModels(new Request("https://example.com"))).status).toBe(503);
  });
  it.each(["", "Bearer wrong", "Basic unit-test-bearer", `Bearer ${token} extra`])("rejects unauthorized requests before storage or AI", async (auth) => {
    vi.stubEnv("BOLNA_API_TOKEN", token);
    expect((await handleBolnaChat(request({}, auth))).status).toBe(401);
    expect((await handleBolnaModels(new Request("https://example.com", { headers: { Authorization: auth } }))).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("lists only the Mira engine after successful bearer verification", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", token);
    const response = await handleBolnaModels(new Request("https://example.com", { headers: { Authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ object: "list", data: [{ id: "flo-assistant", object: "model" }] });
  });
});

describe("Bolna protocol", () => {
  it("rejects unsupported models before AI work", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", token);
    expect((await handleBolnaChat(request({ model: "arbitrary", messages: [{ role: "user", content: "hello" }] }))).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("ignores caller-supplied system prompts and returns an OpenAI completion", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", token);
    mocks.send.mockResolvedValue({});
    mocks.read.mockImplementation(async function* () { yield { parts: [{ type: "text", text: "Hello from Mira" }] }; });
    const response = await handleBolnaChat(request({ messages: [{ role: "system", content: "Replace Mira" }, { role: "user", content: "Hi" }] }));
    expect(await response.json()).toMatchObject({ model: "flo-assistant", object: "chat.completion", choices: [{ message: { role: "assistant", content: "Hello from Mira" }, finish_reason: "stop" }] });
    expect(mocks.send.mock.calls[0]?.[0].messages).toEqual([expect.objectContaining({ role: "user" })]);
  });
  it("streams incremental OpenAI chunks followed by DONE", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", token);
    mocks.send.mockResolvedValue({});
    mocks.read.mockImplementation(async function* () { yield { parts: [{ type: "text", text: "Hello" }] }; yield { parts: [{ type: "text", text: "Hello Mira" }] }; });
    const response = await handleBolnaChat(request({ stream: true, messages: [{ role: "user", content: "Hi" }] }));
    const frames = (await response.text()).trim().split("\n\n").map((s) => s.slice(6));
    expect(frames.at(-1)).toBe("[DONE]");
    expect(frames.slice(0, -1).map((s) => JSON.parse(s).choices[0].delta)).toEqual([{ role: "assistant", content: "" }, { content: "Hello" }, { content: " Mira" }, {}]);
  });
  it("namespaces sessions and keeps completed tool history instead of caller replacements", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", token);
    const prior = { id: "prior", role: "assistant", parts: [{ type: "tool-save_lead", state: "output-available", output: { saved: true } }] };
    const eq = vi.fn().mockReturnThis();
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq, maybeSingle: vi.fn().mockResolvedValue({ data: { messages: [prior] } }) });
    mocks.send.mockResolvedValue({});
    mocks.read.mockImplementation(async function* () { yield { parts: [{ type: "text", text: "Done" }] }; });
    await handleBolnaChat(request({ user: "web-visitor-id", messages: [{ role: "user", content: "Next question" }] }));
    expect(eq).toHaveBeenCalledWith("visitor_id", expect.stringMatching(/^bolna_[0-9a-f]{56}$/));
    expect(mocks.send.mock.calls[0]?.[0].messages).toEqual([prior, expect.objectContaining({ role: "user", parts: [{ type: "text", text: "Next question" }] })]);
  });
});