import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadWhatsAppAudio, MAX_AUDIO_BYTES, transcribeWhatsAppAudio } from "./whatsapp-audio.server";

vi.mock("@lovable.dev/ai-gateway", () => ({ transcribeAudio: vi.fn(), GatewayError: class extends Error {} }));
import { transcribeAudio } from "@lovable.dev/ai-gateway";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

function setup(size = 4, mime = "audio/ogg; codecs=opus") {
  vi.stubEnv("LOVABLE_API_KEY", "fake-gateway");
  vi.stubEnv("WHATSAPP_API_KEY", "fake-connection");
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
    url: "https://media.example.test/private", mime_type: mime, file_size: size,
  }))).mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3, 4])));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

describe("WhatsApp voice notes", () => {
  it("downloads Opus voice notes only through the connected gateway and preserves the file format", async () => {
    const fetcher = setup();
    const file = await downloadWhatsAppAudio("12345");
    expect(file.name).toBe("voice-note.ogg");
    expect(file.type).toBe("audio/ogg");
    expect(file.size).toBe(4);
    expect(fetcher.mock.calls.map(call => call[0])).toEqual([
      "https://connector-gateway.lovable.dev/whatsapp/media/12345",
      "https://connector-gateway.lovable.dev/whatsapp/media_download",
    ]);
    expect(fetcher.mock.calls[1]?.[1].headers["X-WhatsApp-Media-URL"]).toBe("https://media.example.test/private");
  });
  it("rejects oversized metadata before downloading", async () => {
    const fetcher = setup(MAX_AUDIO_BYTES + 1);
    await expect(downloadWhatsAppAudio("12345")).rejects.toThrow("oversized");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("cancels a stream that exceeds the bound even when metadata understates it", async () => {
    const fetcher = setup();
    const cancel = vi.fn();
    fetcher.mockReset().mockResolvedValueOnce(new Response(JSON.stringify({ url: "https://media.example.test/private", mime_type: "audio/ogg", file_size: 1 })))
      .mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_AUDIO_BYTES + 1)); }, cancel })));
    await expect(downloadWhatsAppAudio("12345")).rejects.toThrow("too large");
    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it("passes spoken words to Mira without forcing English or adding instructions", async () => {
    vi.mocked(transcribeAudio).mockResolvedValue({ text: "TRY IYASHI" });
    const file = new File(["audio"], "note.ogg", { type: "audio/ogg" });
    expect(await transcribeWhatsAppAudio(file)).toBe("TRY IYASHI");
    expect(transcribeAudio).toHaveBeenCalledWith({ model: "openai/gpt-transcribe", file });
  });
  it("never turns silence into a fabricated question", async () => {
    vi.mocked(transcribeAudio).mockResolvedValue({ text: " " });
    await expect(transcribeWhatsAppAudio(new File(["audio"], "note.ogg"))).rejects.toThrow("No speech");
  });
});