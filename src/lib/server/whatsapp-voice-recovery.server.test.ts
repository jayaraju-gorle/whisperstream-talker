import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./whatsapp-audio.server", () => ({
  downloadWhatsAppAudio: vi.fn(), transcribeWhatsAppAudio: vi.fn(), UnsupportedVoiceNote: class extends Error {},
}));
import { downloadWhatsAppAudio, transcribeWhatsAppAudio } from "./whatsapp-audio.server";
import { prepareVoiceNote } from "./whatsapp.server";

afterEach(() => vi.clearAllMocks());
function storage() {
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  return { db: { from: vi.fn().mockReturnValue({ update }) } as unknown as Parameters<typeof prepareVoiceNote>[0], update };
}
const message = { id: "incoming", body: "[audio message]", media_id: "12345", transcription_state: "pending" };

describe("durable voice-note recovery", () => {
  it("stores recognized speech before the shared reply path consumes it", async () => {
    const { db, update } = storage();
    vi.mocked(downloadWhatsAppAudio).mockResolvedValue(new File(["audio"], "note.ogg"));
    vi.mocked(transcribeWhatsAppAudio).mockResolvedValue("What are Aura's opening hours?");
    expect(await prepareVoiceNote(db, message)).toEqual({ body: "What are Aura's opening hours?" });
    expect(update.mock.calls.map(call => call[0].transcription_state)).toEqual(["transcribing", "complete"]);
    expect(update.mock.calls[1]?.[0].body).toBe("What are Aura's opening hours?");
  });
  it("reuses a saved transcript on reply retries without another paid request", async () => {
    const { db } = storage();
    expect(await prepareVoiceNote(db, { ...message, body: "TRY IVY", transcription_state: "complete" })).toEqual({ body: "TRY IVY" });
    expect(downloadWhatsAppAudio).not.toHaveBeenCalled();
    expect(transcribeWhatsAppAudio).not.toHaveBeenCalled();
  });
  it.each(["transcribing", "unknown", "failed"])("does not replay %s transcription", async transcription_state => {
    const { db } = storage();
    expect((await prepareVoiceNote(db, { ...message, transcription_state })).fallback).toBeTruthy();
    expect(transcribeWhatsAppAudio).not.toHaveBeenCalled();
  });
  it("keeps read-only download failures pending for recovery", async () => {
    const { db, update } = storage();
    vi.mocked(downloadWhatsAppAudio).mockRejectedValue(new Error("Media unavailable"));
    await expect(prepareVoiceNote(db, message)).rejects.toThrow("Media unavailable");
    expect(update.mock.calls[0]?.[0].transcription_state).toBe("pending");
    expect(transcribeWhatsAppAudio).not.toHaveBeenCalled();
  });
  it("preserves an ambiguous inference failure instead of automatically resending", async () => {
    const { db, update } = storage();
    vi.mocked(downloadWhatsAppAudio).mockResolvedValue(new File(["audio"], "note.ogg"));
    vi.mocked(transcribeWhatsAppAudio).mockRejectedValue(new Error("Unknown outcome"));
    expect((await prepareVoiceNote(db, message)).fallback).toBeTruthy();
    expect(update.mock.calls[1]?.[0].transcription_state).toBe("unknown");
  });
});