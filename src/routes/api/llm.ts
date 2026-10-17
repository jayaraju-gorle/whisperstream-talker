import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { findLlm } from "@/lib/catalog";
import { streamPlaygroundGateway } from "@/lib/server/playground-llm.server";
import {
  GATEWAY,
  gatewayHeaders,
  json,
  providerKey,
  readSse,
  upstreamError,
  verifyRequest,
} from "@/lib/server/auth.server";

const Body = z.object({
  llmId: z.string(),
  system: z.string().max(50000),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) }))
    .max(80),
});

// Streams newline-delimited JSON events:
// {"t":"d","v":"text delta"} | {"t":"u","in":n,"out":n} | {"t":"e","error":"..."}
export const Route = createFileRoute("/api/llm")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await verifyRequest(request);
        if (auth instanceof Response) return auth;
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid request" }, 400);
        const { llmId, system, messages } = parsed.data;
        const m = findLlm(llmId);
        if (!m) return json({ error: "Unknown model" }, 400);
        if (m.connection === "lovable" && (m.provider === "anthropic" || m.model === "google/gemini-4-argon")) {
          return streamPlaygroundGateway(request, m, system, messages);
        }

        let upstream: Response;
        let kind: "responses" | "chat" | "anthropic";
        try {
          if (m.connection === "lovable" && m.model.startsWith("openai/")) {
            kind = "responses";
            const reasoning = m.model !== "openai/chat-latest";
            upstream = await fetch(`${GATEWAY}/responses`, {
              method: "POST",
              signal: request.signal,
              headers: gatewayHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify({
                model: m.model,
                instructions: system,
                input: messages.map((x) => ({ role: x.role, content: x.content })),
                stream: true,
                store: false,
                ...(reasoning
                  ? { reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"] }
                  : {}),
              }),
            });
          } else if (m.provider === "anthropic") {
            kind = "anthropic";
            const key = providerKey("ANTHROPIC_API_KEY");
            if (!key) return json({ error: "Anthropic needs an API key" }, 400);
            upstream = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              signal: request.signal,
              headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
              body: JSON.stringify({ model: m.model, system, messages, max_tokens: 1024, stream: true }),
            });
          } else {
            kind = "chat";
            let url: string;
            let headers: Record<string, string>;
            if (m.connection === "lovable") {
              url = `${GATEWAY}/chat/completions`;
              headers = gatewayHeaders({ "Content-Type": "application/json" });
            } else {
              const key = providerKey(
                m.provider === "openai" ? "OPENAI_API_KEY" : m.provider === "sarvam" ? "SARVAM_API_KEY" : m.provider === "xai" ? "XAI_API_KEY" : "GROQ_API_KEY",
              );
              if (!key) return json({ error: `${m.label} needs an API key` }, 400);
              url =
                m.provider === "openai"
                  ? "https://api.openai.com/v1/chat/completions"
                  : m.provider === "sarvam"
                    ? "https://api.sarvam.ai/v1/chat/completions"
                    : m.provider === "xai"
                      ? "https://api.x.ai/v1/chat/completions"
                      : "https://api.groq.com/openai/v1/chat/completions";
              headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
            }
            upstream = await fetch(url, {
              method: "POST",
              signal: request.signal,
              headers,
              body: JSON.stringify({
                model: m.model,
                stream: true,
                stream_options: { include_usage: true },
                messages: [{ role: "system", content: system }, ...messages],
              }),
            });
          }
        } catch (e) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          return json({ error: e instanceof Error ? e.message : "Model request failed" }, 502);
        }
        if (!upstream.ok || !upstream.body) return upstreamError(upstream, "Model");

        const body = upstream.body;
        const enc = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
            let inputTokens = 0;
            let outputTokens = 0;
            try {
              for await (const ev of readSse(body)) {
                if (kind === "responses") {
                  if (ev.type === "response.output_text.delta" && ev.delta) send({ t: "d", v: ev.delta });
                  else if (ev.type === "response.completed") {
                    const u = ev.response?.usage;
                    if (u) send({ t: "u", in: u.input_tokens ?? 0, out: u.output_tokens ?? 0 });
                  } else if (ev.type === "response.failed" || ev.type === "error") {
                    send({ t: "e", error: ev.response?.error?.message ?? ev.error?.message ?? ev.message ?? "Model error" });
                  }
                } else if (kind === "anthropic") {
                  if (ev.type === "message_start") {
                    inputTokens = ev.message?.usage?.input_tokens ?? 0;
                    outputTokens = ev.message?.usage?.output_tokens ?? 0;
                  } else if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
                    if (ev.delta.text) send({ t: "d", v: ev.delta.text });
                  } else if (ev.type === "message_delta") {
                    outputTokens = ev.usage?.output_tokens ?? outputTokens;
                    if (ev.delta?.stop_reason === "refusal") {
                      send({ t: "e", error: "Anthropic declined this request." });
                      break;
                    }
                  } else if (ev.type === "message_stop") {
                    send({ t: "u", in: inputTokens, out: outputTokens });
                    break;
                  } else if (ev.type === "error") {
                    send({ t: "e", error: ev.error?.message ?? "Anthropic request failed" });
                    break;
                  }
                } else {
                  const d = ev.choices?.[0]?.delta?.content;
                  if (d) send({ t: "d", v: d });
                  if (ev.usage) send({ t: "u", in: ev.usage.prompt_tokens ?? 0, out: ev.usage.completion_tokens ?? 0 });
                  if (ev.error) send({ t: "e", error: ev.error.message ?? "Model error" });
                }
              }
            } catch (e) {
              if (!request.signal.aborted) send({ t: "e", error: e instanceof Error ? e.message : "Stream failed" });
            } finally {
              controller.close();
            }
          },
        });
        const headers = new Headers({ "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" });
        upstream.headers.forEach((v, k) => {
          if (k.toLowerCase().startsWith("x-lovable-aig-")) headers.set(k, v);
        });
        return new Response(stream, { headers });
      },
    },
  },
});
