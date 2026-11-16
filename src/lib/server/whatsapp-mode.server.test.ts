import { describe, expect, it, vi, afterEach } from "vitest";
import { parseWhatsAppMode } from "../whatsapp-mode";
import { loadWhatsAppMode } from "./whatsapp-mode.server";
import { drainWhatsApp, handleMessages } from "./whatsapp.server";
import { resolveTrial } from "./clinic-mode.server";

afterEach(() => vi.unstubAllGlobals());
const id = "ddba5e0f-a003-4d8b-9af6-339712f5564e";
function storage(mode: unknown = { mode: "manual" }) {
  const saved: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const tables: string[] = [];
  const db = { from: vi.fn((table: string) => {
    tables.push(table);
    let response: { data: unknown; error: null } = { data: [], error: null };
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "lte", "order", "limit", "in"]) chain[method] = vi.fn(() => {
      if (table === "app_settings") response = { data: [{ key: "whatsapp_mode", value: mode }], error: null };
      return chain;
    });
    chain["upsert"] = vi.fn((row: Record<string, unknown>) => { saved.push(row); return chain; });
    chain["update"] = vi.fn((row: Record<string, unknown>) => { updates.push(row); return chain; });
    chain["then"] = (resolve: (result: unknown) => void) => resolve(response);
    return chain;
  }) } as unknown as Parameters<typeof drainWhatsApp>[0];
  if (!db) throw new Error("Missing test storage");
  return { db, saved, updates, tables };
}
describe("WhatsApp modes", () => {
  it("validates all three modes and fails closed on corrupt business settings", () => {
    expect(parseWhatsAppMode({ mode: "manual" })).toEqual({ mode: "manual", clinic_id: null });
    expect(parseWhatsAppMode({ mode: "mira" })).toEqual({ mode: "mira", clinic_id: null });
    expect(parseWhatsAppMode({ mode: "business", clinic_id: id })).toEqual({ mode: "business", clinic_id: id });
    expect(parseWhatsAppMode({ mode: "business", clinic_id: "missing" }).mode).toBe("manual");
  });
  it.each(["text", "audio"])("records manual %s input with terminal reply state and its media id", async type => {
    const { db, saved } = storage();
    await handleMessages(db, { entry: [{ changes: [{ value: { messages: [{ id: `incoming-${type}`, from: "919999999999", type, timestamp: "1794794400", text: { body: "Hours?" }, audio: { id: "media123", mime_type: "audio/ogg" } }] } }] }] });
    expect(saved).toHaveLength(1);
    expect(saved[0]?.reply_state).toBe("manual");
    expect(saved[0]?.media_id).toBe(type === "audio" ? "media123" : null);
  });
  it("manual recovery skips AI, transcription, typing, outbound writes and automatic queue reads", async () => {
    const { db, tables, updates } = storage();
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await drainWhatsApp(db);
    expect(fetch).not.toHaveBeenCalled();
    expect(tables).not.toContain("assistant_conversations");
    expect(updates.map(row => row.reply_state)).toEqual(["manual", "unknown"]);
    expect(tables.filter(table => table === "whatsapp_messages")).toHaveLength(2);
  });
  it("automatic Mira mode queues new text for the existing reply path", async () => {
    const { db, saved } = storage({ mode: "mira" });
    await handleMessages(db, { entry: [{ changes: [{ value: { messages: [{ id: "incoming", from: "919999999999", type: "text", text: { body: "Hours?" } }] } }] }] });
    expect(saved[0]?.reply_state).toBe("pending");
  });
  it("mode lookup errors stop processing rather than enabling paid replies", async () => {
    const db = { from: () => ({ select: () => ({ in: () => Promise.resolve({ error: { message: "Unavailable" } }) }) }) } as unknown as Parameters<typeof loadWhatsAppMode>[0];
    await expect(loadWhatsAppMode(db)).rejects.toThrow("WhatsApp mode lookup failed");
  });
  it("explicit Mira stays with Aura despite the all-channel business switch", async () => {
    const { db, tables } = storage({ mode: "mira" });
    const trial = await resolveTrial(db, [{ id: "question", role: "user", parts: [{ type: "text", text: "Hours?" }] }], "WhatsApp", null);
    expect(trial.session).toBeNull();
    expect(tables).toEqual([]);
  });
});