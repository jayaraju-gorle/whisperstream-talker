import { createFileRoute } from "@tanstack/react-router";
import { findStt } from "@/lib/catalog";
import {
  GATEWAY,
  gatewayHeaders,
  json,
  providerKey,
  readSse,
  upstreamError,
  verifyRequest,
} from "@/lib/server/auth.server";

// Accepts multipart: file (audio/wav), sttId, language. Returns { text }.
export const Route = createFileRoute("/api/stt")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await verifyRequest(request);
        if (auth instanceof Response) return auth;
        const form = await request.formData();
        const file = form.get("file");
        const m = findStt(String(form.get("sttId") ?? ""));
        const language = String(form.get("language") ?? "auto");
        if (!(file instanceof Blob) || !m) return json({ error: "Missing audio or model" }, 400);
        if (file.size > 14 * 1024 * 1024) return json({ error: "Recording too long" }, 413);
        const lang = language !== "auto" ? language : undefined;

        try {
          if (m.provider === "lovable") {
            const fd = new FormData();
            fd.append("file", new Blob([await file.arrayBuffer()], { type: "audio/wav" }), "speech.wav");
            fd.append("model", m.model);
            fd.append("stream", "true");
            if (lang) fd.append("language", lang);
            const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
              method: "POST",
              headers: gatewayHeaders(),
              body: fd,
              signal: request.signal,
            });
            if (!res.ok || !res.body) return upstreamError(res, "Transcription");
            let text = "";
            let done = false;
            for await (const ev of readSse(res.body)) {
              if (ev.type === "transcript.text.delta") text += ev.delta ?? "";
              else if (ev.type === "transcript.text.done") {
                text = ev.text ?? text;
                done = true;
              } else if (ev.type === "error" || ev.error) {
                return json({ error: ev.error?.message ?? ev.message ?? "Transcription failed" }, 502);
              }
            }
            if (!done && !text) return json({ error: "Transcription ended without a result" }, 502);
            return json({ text: text.trim() });
          }

          if (m.provider === "openai" || m.provider === "groq") {
            const key = providerKey(m.provider === "openai" ? "OPENAI_API_KEY" : "GROQ_API_KEY");
            if (!key) return json({ error: `${m.label} needs an API key` }, 400);
            const base = m.provider === "openai" ? "https://api.openai.com/v1" : "https://api.groq.com/openai/v1";
            const fd = new FormData();
            fd.append("file", new Blob([await file.arrayBuffer()], { type: "audio/wav" }), "speech.wav");
            fd.append("model", m.model);
            if (lang) fd.append("language", lang);
            const res = await fetch(`${base}/audio/transcriptions`, {
              method: "POST",
              headers: { Authorization: `Bearer ${key}` },
              body: fd,
              signal: request.signal,
            });
            if (!res.ok) return upstreamError(res, "Transcription");
            const j = (await res.json()) as { text?: string };
            return json({ text: (j.text ?? "").trim() });
          }

          if (m.provider === "deepgram") {
            const key = providerKey("DEEPGRAM_API_KEY");
            if (!key) return json({ error: `${m.label} needs an API key` }, 400);
            const qs = new URLSearchParams({ model: m.model, smart_format: "true" });
            if (lang) qs.set("language", lang);
            else qs.set("detect_language", "true");
            const res = await fetch(`https://api.deepgram.com/v1/listen?${qs}`, {
              method: "POST",
              headers: { Authorization: `Token ${key}`, "Content-Type": "audio/wav" },
              body: await file.arrayBuffer(),
              signal: request.signal,
            });
            if (!res.ok) return upstreamError(res, "Transcription");
            const j = (await res.json()) as any;
            return json({ text: (j?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "").trim() });
          }
          return json({ error: "Unsupported provider" }, 400);
        } catch (e) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          return json({ error: e instanceof Error ? e.message : "Transcription failed" }, 500);
        }
      },
    },
  },
});
