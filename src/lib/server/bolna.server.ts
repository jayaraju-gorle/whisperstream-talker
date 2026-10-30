import { timingSafeEqual } from "node:crypto";
import { DefaultChatTransport, readUIMessageStream, type UIMessage } from "ai";
import { z } from "zod";

export const BOLNA_MODEL = "flo-assistant";
const Message = z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().max(4000) });
const Body = z.object({
  model: z.literal(BOLNA_MODEL).default(BOLNA_MODEL),
  messages: z.array(Message).min(1).max(80),
  stream: z.boolean().default(false),
  user: z.string().min(1).max(200).optional(),
  metadata: z.object({ conversation_id: z.string().min(1).max(200).optional(), call_id: z.string().min(1).max(200).optional() }).optional(),
});

function apiError(message: string, status: number, type = "invalid_request_error") {
  return Response.json({ error: { message, type, param: null, code: null } }, { status });
}

/** Authenticate before parsing input, touching storage, or opening a paid model. */
export function verifyBolnaBearer(request: Request): Response | null {
  const secret = process.env["BOLNA_API_TOKEN"];
  if (!secret) return apiError("Bolna integration is not configured", 503, "server_error");
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get("authorization") ?? "");
  const expected = new TextEncoder().encode(secret);
  const supplied = new TextEncoder().encode(match?.[1] ?? "");
  if (supplied.byteLength !== expected.byteLength || !timingSafeEqual(supplied, expected)) {
    const response = apiError("Invalid bearer token", 401, "authentication_error");
    response.headers.set("WWW-Authenticate", "Bearer");
    return response;
  }
  return null;
}

export async function handleBolnaModels(request: Request): Promise<Response> {
  const denied = verifyBolnaBearer(request);
  if (denied) return denied;
  return Response.json({ object: "list", data: [{ id: BOLNA_MODEL, object: "model", created: 0, owned_by: "flo" }] });
}

export async function handleBolnaChat(request: Request): Promise<Response> {
  const denied = verifyBolnaBearer(request);
  if (denied) return denied;
  // Bound the actual body as well as individual message sizes.
  const reader = request.body?.getReader();
  if (!reader) return apiError("Missing request body", 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 128 * 1024) { await reader.cancel(); return apiError("Request body is too large", 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder().decode(bytes)); } catch { return apiError("Invalid JSON", 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return apiError("Invalid chat request or unsupported model; use flo-assistant", 400);
  const input = parsed.data;
  const last = input.messages.at(-1);
  if (last?.role !== "user" || !last.content.trim()) return apiError("The final message must be a nonempty user message", 400);
  const session = input.metadata?.conversation_id ?? input.metadata?.call_id ?? request.headers.get("x-bolna-call-id") ?? input.user;
  if (session && session.length > 200) return apiError("Invalid conversation identity", 400);
  // Namespacing prevents access to web or WhatsApp conversations even with a known visitor ID.
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(session ?? crypto.randomUUID()));
  const visitorId = `bolna_${Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 56)}`;
  let messages: UIMessage[] = input.messages.filter((m) => m.role !== "system").map((m) => ({
    id: crypto.randomUUID(), role: m.role as "user" | "assistant", parts: [{ type: "text", text: m.content }],
  }));
  if (session) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("assistant_conversations").select("messages").eq("visitor_id", visitorId).maybeSingle();
    if (error) return apiError("Could not load the conversation", 500, "server_error");
    if (Array.isArray(data?.messages) && data.messages.length) {
      // Server history retains completed tool results, consent and TRY/EXIT state.
      messages = [...data.messages as unknown as UIMessage[], { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: last.content }] }];
    }
  }
  const { handleAssistantPost } = await import("@/lib/server/assistant-handler.server");
  const transport = new DefaultChatTransport({
    api: "/api/public/assistant", body: { visitorId },
    fetch: async (_url, init) => handleAssistantPost({ request: new Request("https://assistant.internal/api/public/assistant", {
      ...init, signal: request.signal, headers: { "Content-Type": "application/json" },
    }), voice: true, channel: "Bolna" }),
  });
  let stream: Awaited<ReturnType<typeof transport.sendMessages>>;
  try {
    stream = await transport.sendMessages({ trigger: "submit-message", chatId: visitorId, messageId: undefined, messages, abortSignal: request.signal });
  } catch { return apiError("Flo could not start the reply", 502, "server_error"); }
  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const base = { id, created, model: BOLNA_MODEL };
  if (!input.stream) {
    try {
      let text = "";
      for await (const reply of readUIMessageStream({ stream, terminateOnError: true })) {
        text = reply.parts.map((p) => p.type === "text" ? p.text : "").join("");
      }
      if (!text.trim()) return apiError("Flo returned no reply", 502, "server_error");
      return Response.json({ ...base, object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }] });
    } catch { return apiError("Flo could not finish the reply", 502, "server_error"); }
  }
  const encoder = new TextEncoder();
  const iterator = readUIMessageStream({ stream, terminateOnError: true })[Symbol.asyncIterator]();
  let previous = "";
  let opened = false;
  const output = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const send = (delta: object, finish_reason: string | null = null) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ...base, object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason }] })}\n\n`));
      if (!opened) { opened = true; send({ role: "assistant", content: "" }); return; }
      try {
        while (true) {
          const next = await iterator.next();
          if (next.done) { send({}, "stop"); controller.enqueue(encoder.encode("data: [DONE]\n\n")); controller.close(); return; }
          const text = next.value.parts.map((p) => p.type === "text" ? p.text : "").join("");
          const delta = text.slice(previous.length);
          previous = text;
          if (delta) { send({ content: delta }); return; }
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: "Flo could not finish the reply", type: "server_error" } })}\n\ndata: [DONE]\n\n`));
        controller.close();
      }
    },
    async cancel() { await iterator.return?.(); },
  });
  return new Response(output, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}