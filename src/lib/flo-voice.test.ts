import { describe, expect, it } from "vitest";
import { validFloVisitor, voiceMessages, WHATSAPP_ASSISTANT_URL } from "./flo-voice";

describe("Flo voice identity and conversation", () => {
  it("allows browser conversations but never reserved WhatsApp identities", () => {
    expect(validFloVisitor("a1234567890123456789012345678901")).toBe(true);
    expect(validFloVisitor("whatsapp_916302392274")).toBe(false);
    expect(validFloVisitor("bolna_1234567890123456")).toBe(false);
    expect(validFloVisitor("short")).toBe(false);
  });
  it("preserves spaces and combines speech fragments into caller commands", () => {
    const rows = voiceMessages([
      { role: "user", text: "TRY ", start_ms: 0, end_ms: 1 },
      { role: "user", text: "SSK", start_ms: 1, end_ms: 2 },
      { role: "assistant", text: "How can I help?", start_ms: 2, end_ms: 3 },
      { role: "user", text: "EXIT", start_ms: 3, end_ms: 4 },
    ], "call");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.parts).toEqual([{ type: "text", text: "TRY SSK" }]);
    expect(rows[2]?.parts).toEqual([{ type: "text", text: "EXIT" }]);
  });
  it("opens the existing WhatsApp assistant number", () => {
    expect(new URL(WHATSAPP_ASSISTANT_URL).pathname).toBe("/916302392274");
  });
});