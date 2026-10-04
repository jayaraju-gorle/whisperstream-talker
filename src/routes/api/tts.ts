import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { findTts } from "@/lib/catalog";
import {
  GATEWAY,
  gatewayHeaders,
  json,
  providerKey,
  readSse,
  upstreamError,
  verifyRequest,
} from "@/lib/server/auth.server";

const Body = z.object({ ttsId: z.string(), voice: z.string(), text: z.string().min(1).max(4000) });

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Always streams raw PCM: 24 kHz, signed 16-bit little-endian, mono.
export const Route = createFileRoute("/api/tts")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await verifyRequest(request);
        if (auth instanceof Response) return auth;
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid request" }, 400);
        const { ttsId, voice, text } = parsed.data;
        const m = findTts(ttsId);
        if (!m) return json({ error: "Unknown voice model" }, 400);
        const pcmHeaders = { "Content-Type": "audio/L16; rate=24000; channels=1", "Cache-Control": "no-cache" };

        try {
          if (m.provider === "lovable") {
            const isGemini = m.model.startsWith("google/");
            const res = await fetch(`${GATEWAY}/audio/speech`, {
              method: "POST",
              signal: request.signal,
              headers: gatewayHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify(
                isGemini
                  ? {
                      model: m.model,
                      contents: [{ role: "user", parts: [{ text }] }],
                      generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                      },
                      stream_format: "sse",
                    }
                  : { model: m.model, input: text, voice, stream_format: "sse", response_format: "pcm" },
              ),
            });
            if (!res.ok || !res.body) return upstreamError(res, "Speech");
            const body = res.body;
            const stream = new ReadableStream<Uint8Array>({
              async start(controller) {
                let done = false;
                try {
                  for await (const ev of readSse(body)) {
                    if (ev.type === "speech.audio.delta" && ev.audio) controller.enqueue(b64ToBytes(ev.audio));
                    else if (ev.type === "speech.audio.done") done = true;
                    else if (ev.type === "error" || String(ev.type ?? "").endsWith("error") || ev.error) {
                      controller.error(new Error(ev.error?.message ?? "Speech failed"));
                      return;
                    }
                  }
                  if (!done && !request.signal.aborted) {
                    controller.error(new Error("Speech stream ended early"));
                    return;
                  }
                  controller.close();
                } catch (e) {
                  controller.error(e);
                }
              },
            });
            return new Response(stream, { headers: pcmHeaders });
          }

          if (m.provider === "openai") {
            const key = providerKey("OPENAI_API_KEY");
            if (!key) return json({ error: `${m.label} needs an API key` }, 400);
            const res = await fetch("https://api.openai.com/v1/audio/speech", {
              method: "POST",
              signal: request.signal,
              headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model: m.model, input: text, voice, response_format: "pcm" }),
            });
            if (!res.ok || !res.body) return upstreamError(res, "Speech");
            return new Response(res.body, { headers: pcmHeaders });
          }

          if (m.provider === "deepgram") {
            const key = providerKey("DEEPGRAM_API_KEY");
            if (!key) return json({ error: `${m.label} needs an API key` }, 400);
            const qs = new URLSearchParams({ model: voice, encoding: "linear16", sample_rate: "24000", container: "none" });
            const res = await fetch(`https://api.deepgram.com/v1/speak?${qs}`, {
              method: "POST",
              signal: request.signal,
              headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
            if (!res.ok || !res.body) return upstreamError(res, "Speech");
            return new Response(res.body, { headers: pcmHeaders });
          }

          if (m.provider === "elevenlabs") {
            const key = providerKey("ELEVENLABS_API_KEY");
            if (!key) return json({ error: `${m.label} needs an API key` }, 400);
            const res = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/stream?output_format=pcm_24000`,
              {
                method: "POST",
                signal: request.signal,
                headers: { "xi-api-key": key, "Content-Type": "application/json" },
                body: JSON.stringify({ text, model_id: m.model }),
              },
            );
            if (!res.ok || !res.body) return upstreamError(res, "Speech");
            return new Response(res.body, { headers: pcmHeaders });
          }
          return json({ error: "Unsupported provider" }, 400);
        } catch (e) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          return json({ error: e instanceof Error ? e.message : "Speech failed" }, 502);
        }
      },
    },
  },
});
