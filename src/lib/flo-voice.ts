import type { UIMessage } from "ai";

export const FLO_VOICE_PATH = "/api/public/assistant/voice";
export function validFloVisitor(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[A-Za-z0-9_-]{16,64}$/.test(id) &&
    !id.startsWith("whatsapp_") &&
    !id.startsWith("bolna_")
  );
}

export type VoiceFragment = {
  role: "user" | "assistant";
  text: string;
  start_ms: number;
  end_ms: number;
};

const URL_RE = /https?:\/\/[^\s<>()]+/gi;

/** Extracts clean URLs from assistant replies (stripping trailing punctuation). */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_RE) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of matches) {
    const clean = raw.replace(/[.,;:!?)'"]+$/, "");
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

/** Replaces raw URLs with natural spoken phrasing so voice models don't read query params aloud. */
export function stripUrlsForSpeech(text: string): string {
  if (!URL_RE.test(text)) return text;
  URL_RE.lastIndex = 0;
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, "$1")
    .replace(URL_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Formats shared URLs as clean clickable markdown links for the chat bubble. */
export function formatSharedLinksMarkdown(urls: string[]): string {
  return urls
    .map((url) => {
      const isMaps = /(?:google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(url);
      return isMaps ? `[Open in Google Maps](${url})` : `[Open link](${url})`;
    })
    .join(" · ");
}

export function voiceMessages(fragments: VoiceFragment[], prefix: string): UIMessage[] {
  const rows: Array<{ role: "user" | "assistant"; text: string }> = [];
  for (const fragment of fragments) {
    const last = rows.at(-1);
    if (last?.role === fragment.role) last.text += fragment.text;
    else rows.push({ role: fragment.role, text: fragment.text });
  }
  return rows.map((row, index) => ({
    id: `${prefix}-${index}`,
    role: row.role,
    parts: [{ type: "text", text: row.text }],
  }));
}

export const WHATSAPP_ASSISTANT_URL = "https://wa.me/916302392274?text=TRY%20AURA";
export const PHONE_ASSISTANT_NUMBER = "7965481796";
export const PHONE_ASSISTANT_DISPLAY = "+91 7965481796";
export const PHONE_ASSISTANT_URL = `tel:+91${PHONE_ASSISTANT_NUMBER}`;
