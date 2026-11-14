import { GatewayError, transcribeAudio } from "@lovable.dev/ai-gateway";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/whatsapp";
export const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
const formats: Record<string, string> = {
  "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a",
  "audio/aac": "aac", "audio/amr": "amr", "audio/wav": "wav",
  "audio/x-wav": "wav", "audio/webm": "webm",
};
export class UnsupportedVoiceNote extends Error {}

/** Fetch fresh, private media through the connected account; never expose or store its URL. */
export async function downloadWhatsAppAudio(mediaId: string): Promise<File> {
  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(mediaId)) throw new UnsupportedVoiceNote("Invalid media id");
  const lovable = process.env["LOVABLE_API_KEY"];
  const wa = process.env["WHATSAPP_API_KEY"];
  if (!lovable || !wa) throw new Error("WhatsApp is not configured");
  const headers = { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": wa };
  const metadata = await fetch(`${GATEWAY}/media/${mediaId}`, { headers });
  if (!metadata.ok) throw new Error(`WhatsApp media lookup failed [${metadata.status}]: ${(await metadata.text()).slice(0, 500)}`);
  const parsed = z.object({ url: z.string().url(), mime_type: z.string(), file_size: z.number().int().nonnegative() }).parse(await metadata.json());
  const mime = parsed.mime_type.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = formats[mime];
  if (!extension || parsed.file_size > MAX_AUDIO_BYTES) throw new UnsupportedVoiceNote("Unsupported or oversized voice note");
  if (new URL(parsed.url).protocol !== "https:") throw new Error("Invalid media URL");
  const response = await fetch(`${GATEWAY}/media_download`, { headers: { ...headers, "X-WhatsApp-Media-URL": parsed.url } });
  if (!response.ok) throw new Error(`WhatsApp media download failed [${response.status}]: ${(await response.text()).slice(0, 500)}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty media download");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AUDIO_BYTES) {
        await reader.cancel();
        throw new UnsupportedVoiceNote("Voice note is too large");
      }
      chunks.push(new Uint8Array(value));
    }
  } finally { reader.releaseLock(); }
  if (!size) throw new UnsupportedVoiceNote("Empty voice note");
  return new File(chunks, `voice-note.${extension}`, { type: mime });
}

export async function transcribeWhatsAppAudio(file: File): Promise<string> {
  try {
    const result = await transcribeAudio({ model: "openai/gpt-transcribe", file });
    const text = (typeof result === "string" ? result : result.text).trim();
    if (!text) throw new UnsupportedVoiceNote("No speech recognized");
    return text.slice(0, 4000);
  } catch (error) {
    if (error instanceof GatewayError) {
      console.error("WhatsApp transcription failed", { code: error.code, outcome: error.outcome, recovery: error.recovery, ids: error.ids });
    }
    throw error;
  }
}