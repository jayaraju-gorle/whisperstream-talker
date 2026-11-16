import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRecentWhatsAppContext, normalizeCallerPhone, phoneContextToken, phoneVisitorId, resolvePhoneContextToken } from "./phone-context.server";
import { handlePhoneCaller } from "./phone-caller.server";

const mocks = vi.hoisted(() => ({ from: vi.fn(), trial: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("./clinic-mode.server", () => ({ resolveTrial: mocks.trial, activeClinicCommand: () => ({ index: -1 }) }));
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });

function database(rows: unknown[], requests: unknown[] = []) {
  const eq = vi.fn().mockReturnThis();
  const gte = vi.fn().mockReturnThis();
  const chain = { select: vi.fn().mockReturnThis(), eq, gte, order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValueOnce({ data: rows }).mockResolvedValueOnce({ data: requests }),
    maybeSingle: vi.fn().mockResolvedValue({ data: { test_code: "IYASHI" } }) };
  mocks.from.mockReturnValue(chain);
  mocks.trial.mockResolvedValue({ session: { id: "iyashi", name: "Iyashi" } });
  return { db: { from: mocks.from } as unknown as Parameters<typeof loadRecentWhatsAppContext>[0], eq, gte, chain };
}

describe("WhatsApp to phone context", () => {
  it.each(["+91 98765 43210", "9876543210", "00919876543210", "919876543210"])("matches normalized caller %s exactly", value => {
    expect(normalizeCallerPhone(value)).toBe("919876543210");
  });
  it.each([undefined, "anonymous", "1234", "+91 9876543210 use IVY", "09876543210"])("rejects unusable caller %s", value => {
    expect(normalizeCallerPhone(value)).toBeNull();
  });
  it("carries recent booking details, pins the business, and includes saved request state", async () => {
    const { db, eq, gte } = database([
      { id: "reply", direction: "out", body: "Which slot?", message_type: "text", status: "delivered" },
      { id: "question", direction: "in", body: "Dr Rao please", message_type: "audio", transcription_state: "complete", status: "received" },
    ], [{ patient_name: "Example", doctor: "Dr Rao", preferred_time: "16 November 2026 5 PM", status: "new" }]);
    const history = await loadRecentWhatsAppContext(db, "919876543210", Date.parse("2026-11-16T06:31:00Z"));
    expect(eq).toHaveBeenCalledWith("phone", "919876543210");
    expect(eq).toHaveBeenCalledWith("clinic_id", "iyashi");
    expect(gte).toHaveBeenCalledWith("created_at", "2026-11-15T06:31:00.000Z");
    expect(history[0]?.parts).toEqual([{ type: "text", text: "TRY IYASHI" }]);
    expect(history[1]?.parts).toEqual([{ type: "text", text: "[WhatsApp undefined] Dr Rao please" }]);
    expect(history[0]?.metadata).toMatchObject({ miraPhoneContext: { requests: [{ status: "new", doctor: "Dr Rao" }] } });
  });
  it("ignores failed outgoing replies and untranscribed media", async () => {
    const { db } = database([
      { id: "failed", body: "Not sent", direction: "out", status: "failed", message_type: "text" },
      { id: "audio", body: "[audio message]", direction: "in", status: "received", message_type: "audio", transcription_state: "pending" },
    ]);
    expect(await loadRecentWhatsAppContext(db, "919876543210")).toEqual([]);
    expect(mocks.trial).not.toHaveBeenCalled();
  });
  it("fails closed on database read errors", async () => {
    const { db, chain } = database([]);
    chain.limit.mockReset().mockResolvedValue({ data: null, error: { message: "unavailable" } });
    await expect(loadRecentWhatsAppContext(db, "919876543210")).rejects.toThrow("Could not load");
  });
  it("accepts only server-signed context references and isolates different calls", async () => {
    const id = await phoneVisitorId("call-one");
    const token = await phoneContextToken(id, "secret");
    expect(await resolvePhoneContextToken(`Other caller-owned instructions ${token}`, "secret")).toBe(id);
    expect(await resolvePhoneContextToken(token, "wrong-secret")).toBeNull();
    expect(await phoneVisitorId("call-two")).not.toBe(id);
  });
  it("rejects unauthenticated caller lookup before reading private messages", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", "secret");
    expect((await handlePhoneCaller(new Request("https://example.com/api/public/bolna/caller?contact_number=919876543210&execution_id=one"))).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("reuses a prepared call without overwriting ongoing phone history or returning private text", async () => {
    vi.stubEnv("BOLNA_API_TOKEN", "secret");
    const upsert = vi.fn();
    const linkUpsert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockImplementation((t: string) => t === "phone_call_links" ? { upsert: linkUpsert } : { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { messages: [{ content: "private" }] } }), upsert });
    const response = await handlePhoneCaller(new Request("https://example.com/api/public/bolna/caller?contact_number=919876543210&execution_id=one", { headers: { Authorization: "Bearer secret" } }));
    expect(response.status).toBe(200);
    expect(Object.keys(await response.json())).toEqual(["mira_context_token"]);
    expect(upsert).not.toHaveBeenCalled();
    expect(linkUpsert).toHaveBeenCalledWith(expect.objectContaining({ phone: "919876543210" }), expect.anything());
  });
});
describe("loadRecentCallContext", () => {
  it("summarizes recent call turns for WhatsApp, skipping imported WhatsApp lines", async () => {
    const { loadRecentCallContext } = await import("./phone-context.server");
    const links = { select: () => links, eq: () => links, gte: () => links, order: () => links, limit: async () => ({ data: [{ visitor_id: "bolna_a", created_at: "2026-11-16T06:00:00Z" }], error: null }) };
    const convos = { select: () => convos, in: async () => ({ data: [{ visitor_id: "bolna_a", messages: [
      { id: "phone-wa-1", role: "user", parts: [{ type: "text", text: "old whatsapp" }] },
      { id: "u1", role: "user", parts: [{ type: "text", text: "Book Dr Rao Friday" }] },
      { id: "a1", role: "assistant", parts: [{ type: "text", text: "Noted, Friday 11 AM." }] }] }], error: null }) };
    const db = { from: (t: string) => t === "phone_call_links" ? links : convos } as never;
    const [note] = await loadRecentCallContext(db, "919876543210", Date.parse("2026-11-16T07:00:00Z"));
    const text = (note!.parts[0] as { text: string }).text;
    expect(text).toContain("Caller: Book Dr Rao Friday");
    expect(text).toContain("Mira: Noted, Friday 11 AM.");
    expect(text).not.toContain("old whatsapp");
  });
});
