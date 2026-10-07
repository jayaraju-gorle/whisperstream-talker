import { describe, expect, it } from "vitest";
import { matchWhatsAppMetrics, type WhatsAppTurnMetrics } from "./whatsapp-metrics";

const message = (id: string, time: string, conversation_id = "chat") => ({ id, created_at: `2026-10-07T${time}Z`, conversation_id, direction: "out" });
const log = (id: string, time: string, extra: Partial<WhatsAppTurnMetrics> = {}): WhatsAppTurnMetrics => ({
  id, created_at: `2026-10-07T${time}Z`, conversation_id: "chat", channel: "WhatsApp",
  model: "openai/gpt-5.4-mini", first_token_ms: 3300, total_ms: 3400, ok: true, ...extra,
});

describe("WhatsApp reply metrics", () => {
  it("attaches the latest timing to the latest reply, not to an older unlogged reply", () => {
    const metrics = matchWhatsAppMetrics([
      message("old", "09:01:20"), message("yep", "09:33:06"), message("hi", "09:33:12"),
    ], [log("yep-log", "09:33:04"), log("hi-log", "09:33:11")]);
    expect(metrics.has("old")).toBe(false);
    expect(metrics.get("yep")?.id).toBe("yep-log");
    expect(metrics.get("hi")?.id).toBe("hi-log");
    expect(metrics.get("hi")?.model).toBe("openai/gpt-5.4-mini");
    expect(metrics.get("hi")?.first_token_ms).toBe(3300);
    expect(metrics.get("hi")?.total_ms).toBe(3400);
  });
  it("ignores failed attempts, web logs and other conversations", () => {
    const metrics = matchWhatsAppMetrics([message("hi", "09:33:12")], [
      log("correct", "09:33:08"), log("failed", "09:33:09", { ok: false }),
      log("web", "09:33:10", { channel: "Web" }), log("other", "09:33:11", { conversation_id: "other" }),
    ]);
    expect(metrics.get("hi")?.id).toBe("correct");
  });
  it("does not reuse a log or attach future or stale timings", () => {
    const metrics = matchWhatsAppMetrics([message("one", "09:33:12"), message("two", "09:33:13"), message("late", "09:40:00")], [
      log("one-log", "09:33:11"), log("future", "09:41:00"),
    ]);
    expect([...metrics.keys()]).toEqual(["one"]);
  });
});