import type { UIMessage } from "ai";

export const FLO_VOICE_PATH = "/api/public/assistant/voice";
export function validFloVisitor(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(id) && !id.startsWith("whatsapp_") && !id.startsWith("bolna_");
}

export type VoiceFragment = { role: "user" | "assistant"; text: string; start_ms: number; end_ms: number };
export function voiceMessages(fragments: VoiceFragment[], prefix: string): UIMessage[] {
  const rows: Array<{ role: "user" | "assistant"; text: string }> = [];
  for (const fragment of fragments) {
    const last = rows.at(-1);
    if (last?.role === fragment.role) last.text += fragment.text;
    else rows.push({ role: fragment.role, text: fragment.text });
  }
  return rows.map((row, index) => ({ id: `${prefix}-${index}`, role: row.role, parts: [{ type: "text", text: row.text }] }));
}

export const WHATSAPP_ASSISTANT_URL = "https://wa.me/916302392274?text=TRY%20AURA";
export const PHONE_ASSISTANT_NUMBER = "7965481796";
export const PHONE_ASSISTANT_URL = `tel:+91${PHONE_ASSISTANT_NUMBER}`;