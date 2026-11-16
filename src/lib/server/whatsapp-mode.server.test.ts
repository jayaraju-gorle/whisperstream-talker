import { describe, expect, it, vi, afterEach } from "vitest";
import { parseWhatsAppMode } from "../whatsapp-mode";
import { loadWhatsAppMode } from "./whatsapp-mode.server";
import { drainWhatsApp, handleMessages } from "./whatsapp.server";
import { resolveTrial } from "./clinic-mode.server";

afterEach(() => vi.unstubAllGlobals());
const id = "ddba5e0f-a003-4d8b-9af6-339712f5564e";
function storage(mode: unknown = { mode: "mira" }) {
  const saved: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const tables: string[] = [];
  const db = { from: vi.fn((table: string) => {
    tables.push(table);
    let response: { data: unknown; error: null } = { data: [], error: null };
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "lt", "lte", "order", "limit", "in"]) chain[method] = vi.fn(() => {
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
  it("keeps Aura as an automatic assistant option", () => {
    expect(parseWhatsAppMode({ mode: "mira" })).toEqual({ mode: "mira", clinic_id: null });
  });
  it("keeps a configured business as the other assistant option", () => {
    expect(parseWhatsAppMode({ mode: "business", clinic_id: id })).toEqual({ mode: "business", clinic_id: id });
  });
  it("returns retired manual settings to Aura", async () => {
    const { db } = storage({ mode: "manual" });
    expect(await loadWhatsAppMode(db)).toEqual({ mode: "mira", clinic_id: null });
  });
  it("returns invalid business settings to Aura", () => {
    expect(parseWhatsAppMode({ mode: "business", clinic_id: "missing" })).toEqual({ mode: "mira", clinic_id: null });
  });
  it.each(["mira", "business", "manual"])("queues new text and audio even with saved %s settings", async mode => {
    const { db, saved } = storage({ mode, clinic_id: id });
    for (const type of ["text", "audio"]) {
    await handleMessages(db, { entry: [{ changes: [{ value: { messages: [{ id: `incoming-${type}`, from: "919999999999", type, timestamp: "1794794400", text: { body: "Hours?" }, audio: { id: "media123", mime_type: "audio/ogg" } }] } }] }] });
    }
    expect(saved.map(row => row["reply_state"])).toEqual(["pending", "pending"]);
    expect(saved.map(row => row["media_id"])).toEqual([null, "media123"]);
  });
  it("retired manual settings no longer suppress the automatic queue", async () => {
    const { db, tables, updates } = storage({ mode: "manual" });
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await drainWhatsApp(db);
    expect(fetch).not.toHaveBeenCalled();
    expect(tables).not.toContain("assistant_conversations");
    expect(updates.map(row => row["reply_state"])).toEqual(["expired"]);
    expect(tables.filter(table => table === "whatsapp_messages")).toHaveLength(3);
  });
  it("automatic Mira mode queues new text for the existing reply path", async () => {
    const { db, saved } = storage({ mode: "mira" });
    await handleMessages(db, { entry: [{ changes: [{ value: { messages: [{ id: "incoming", from: "919999999999", type: "text", text: { body: "Hours?" } }] } }] }] });
    expect(saved[0]?.["reply_state"]).toBe("pending");
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