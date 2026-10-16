import { convertToModelMessages, isStepCount, streamText, type UIMessage } from "ai";
import { ASSISTANT_INSTRUCTIONS } from "@/lib/assistant-knowledge";
import { floTools } from "@/lib/server/flo.server";
import { floLanguageModel, loadFloModel, logFloTurn } from "@/lib/server/flo-model.server";
import { createLovableAiGatewayRunIdFetch } from "@/lib/server/run-id";
import { clinicVisitorId, parseClinicCommand, receptionistAudience, toClinicInput } from "@/lib/clinic";
import { clinicAppointmentTools, loadClinicSession, type ClinicSession } from "@/lib/server/clinic-mode.server";

// Flo over WhatsApp: durable inbox processing, reply sending and delivery-status reconciliation.
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
type Json = Record<string, unknown>;

const GATEWAY = "https://connector-gateway.lovable.dev/whatsapp";
const MAX_EVENT_ATTEMPTS = 15;
const MAX_REPLY_ATTEMPTS = 3;
const STUCK_SENDING_MS = 90_000;
const HISTORY_LIMIT = 40;
const REPLY_EXPIRY_MS = 15 * 60_000;

const WHATSAPP_INSTRUCTIONS = `${ASSISTANT_INSTRUCTIONS}

CHANNEL: WHATSAPP
- You are chatting on WhatsApp. Use WhatsApp formatting only (*bold*, _italic_, plain lists); never markdown links or headings.
- Write full links, e.g. https://conversationalaistudio.online/demo and https://conversationalaistudio.online/auth.
- The visitor's WhatsApp number is already known to us; don't ask for a phone number. Save it as their phone unless they give another one.`;

export const STATUS_RANK: Record<string, number> = { accepted: 0, sent: 1, delivered: 2, read: 3 };

/** Next stored status given a callback; older callbacks never downgrade delivered/read. */
export function nextStatus(current: string, incoming: string) {
  if (incoming === "failed") return (STATUS_RANK[current] ?? 0) >= 2 ? current : "failed";
  if (current === "failed") return current;
  return (STATUS_RANK[incoming] ?? -1) > (STATUS_RANK[current] ?? 0) ? incoming : current;
}

function keys() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const wa = process.env["WHATSAPP_API_KEY"];
  if (!lovable || !wa) throw new Error("WhatsApp is not configured");
  return { lovable, wa };
}

export async function sendWhatsAppText(to: string, body: string) {
  const { lovable, wa } = keys();
  const res = await fetch(`${GATEWAY}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": wa, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4000), preview_url: true } }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false as const, error: `[${res.status}] ${text.slice(0, 1000)}` };
  const id = (JSON.parse(text) as { messages?: { id?: string }[] }).messages?.[0]?.id;
  return id ? { ok: true as const, id } : { ok: false as const, error: `No message id: ${text.slice(0, 500)}` };
}

/** Marks the inbound message read and shows "typing…" while the reply is generated.
 *  Dismissed when the reply is sent or after 25s. Best-effort: never throws. */
export async function sendTypingIndicator(messageId: string) {
  try {
    const { lovable, wa } = keys();
    const res = await fetch(`${GATEWAY}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": wa, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId, typing_indicator: { type: "text" } }),
    });
    if (!res.ok) console.error("whatsapp typing indicator failed", res.status, (await res.text()).slice(0, 500));
  } catch (e) {
    console.error("whatsapp typing indicator failed", e);
  }
}

function value(payload: Json) {
  const entry = (payload["entry"] as Json[] | undefined)?.[0];
  const change = (entry?.["changes"] as Json[] | undefined)?.[0];
  return (change?.["value"] as Json | undefined) ?? {};
}

class Deferred extends Error {}

async function handleMessages(db: Db, payload: Json) {
  const msgs = (value(payload)["messages"] as Json[] | undefined) ?? [];
  for (const m of msgs) {
    const id = String(m["id"] ?? "");
    const from = String(m["from"] ?? "").replace(/\D/g, "");
    if (!id || !from) continue;
    const type = String(m["type"] ?? "");
    const body = type === "text"
      ? String((m["text"] as Json | undefined)?.["body"] ?? "")
      : type === "button" ? String((m["button"] as Json | undefined)?.["text"] ?? "")
      : `[${type || "unsupported"} message]`;
    const ts = Number(m["timestamp"]);
    const { error } = await db.from("whatsapp_messages").upsert({
      wa_message_id: id, direction: "in", phone: from, body: body.slice(0, 4000), status: "received",
      reply_state: "pending", provider_ts: Number.isFinite(ts) ? new Date(ts * 1000).toISOString() : null,
    }, { onConflict: "wa_message_id", ignoreDuplicates: true }).select("id");
    if (error) throw new Error(`inbound save failed: ${error.message}`);
  }
}

async function handleStatuses(db: Db, payload: Json) {
  const statuses = (value(payload)["statuses"] as Json[] | undefined) ?? [];
  for (const s of statuses) {
    const id = String(s["id"] ?? "");
    const status = String(s["status"] ?? "");
    if (!id || !status) continue;
    const { data: row, error } = await db.from("whatsapp_messages")
      .select("id,status,status_times,errors").eq("wa_message_id", id).eq("direction", "out").maybeSingle();
    if (error) throw new Error(`status lookup failed: ${error.message}`);
    if (!row) throw new Deferred("awaiting outbound message record");
    const times = { ...((row.status_times as Json | null) ?? {}) };
    const ts = Number(s["timestamp"]);
    if (!times[status] && Number.isFinite(ts)) times[status] = new Date(ts * 1000).toISOString();
    const errs = s["errors"] ? [ ...(((row.errors as unknown[]) ?? [])), ...(s["errors"] as unknown[]) ] : row.errors;
    const { error: upErr } = await db.from("whatsapp_messages").update({
      status: nextStatus(row.status, status), status_times: times as never, errors: errs as never, updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    if (upErr) throw new Error(`status update failed: ${upErr.message}`);
  }
}

async function processEvent(db: Db, ev: { id: string; event: string; payload: unknown; attempts: number }) {
  try {
    if (ev.event === "whatsapp.message") await handleMessages(db, ev.payload as Json);
    else if (ev.event === "whatsapp.status") await handleStatuses(db, ev.payload as Json);
    const { error } = await db.from("whatsapp_webhook_events")
      .update({ processed_at: new Date().toISOString(), processing_error: null }).eq("id", ev.id);
    if (error) throw new Error(error.message);
  } catch (e) {
    const attempts = ev.attempts + 1;
    const giveUp = attempts >= MAX_EVENT_ATTEMPTS;
    await db.from("whatsapp_webhook_events").update({
      attempts, processing_error: String((e as Error).message ?? e).slice(0, 1000),
      next_attempt_at: new Date(Date.now() + Math.min(attempts * 30_000, 30 * 60_000)).toISOString(),
      ...(giveUp ? { processed_at: new Date().toISOString() } : {}),
    }).eq("id", ev.id);
    if (!(e instanceof Deferred)) console.error("whatsapp event failed", e);
  }
}

type ClinicCtx = ClinicSession & { phone: string };

async function loadClinic(db: Db, id: string, phone: string): Promise<ClinicCtx | null> {
  const c = await loadClinicSession(db, id, "WhatsApp");
  return c ? { ...c, phone } : null;
}

function clinicTools(db: Db, clinic: ClinicCtx) {
  return clinicAppointmentTools(db, clinic.id, "WhatsApp", `+${clinic.phone}`);
}

/** Handles TRY <code> / EXIT and finds the clinic a phone is currently testing, if any. */
async function routeMessage(db: Db, phone: string, body: string): Promise<{ text?: string; clinic?: ClinicCtx | null }> {
  const cmd = parseClinicCommand(body);
  if (cmd?.kind === "try") {
    const { data } = await db.from("clinics").select("id,name,doctors").eq("test_code", cmd.code).maybeSingle();
    if (!data) return { text: "That receptionist code wasn't found. Check the code and try again." };
    await db.from("clinic_whatsapp_sessions").upsert({ phone, clinic_id: data.id, started_at: new Date().toISOString() });
    return { text: `You're now chatting with the *${data.name}* receptionist. Ask anything a ${receptionistAudience(data.name, toClinicInput(data).doctors)} would. Send EXIT to go back to Flo.` };
  }
  if (cmd?.kind === "exit") {
    const { data } = await db.from("clinic_whatsapp_sessions").delete().eq("phone", phone).select("phone");
    if (data?.length) return { text: "You're back with Flo from Conversational AI Flows Studio. How can I help?" };
  }
  const { data: session } = await db.from("clinic_whatsapp_sessions").select("clinic_id").eq("phone", phone).maybeSingle();
  return { clinic: session ? await loadClinic(db, session.clinic_id, phone) : null };
}

async function generateReply(db: Db, conversationId: string, history: UIMessage[], clinic?: ClinicCtx | null) {
  const { lovable } = keys();
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const choice = await loadFloModel(db);
  const { model, providerOptions } = floLanguageModel(choice, lovable, runIdFetch.fetch);
  const started = Date.now();
  let firstToken: number | null = null;
  const log = { conversation_id: conversationId, channel: clinic ? "WhatsApp clinic test" : "WhatsApp", model: choice.id, started };
  try {
    const result = streamText({
      model,
      instructions: clinic?.instructions ?? WHATSAPP_INSTRUCTIONS,
      messages: await convertToModelMessages(history.slice(-HISTORY_LIMIT)),
      stopWhen: isStepCount(4),
      tools: clinic ? clinicTools(db, clinic) : floTools(db, conversationId, "WhatsApp"),
      providerOptions,
      onChunk: ({ chunk }) => { if (firstToken == null && chunk.type === "text-delta") firstToken = Date.now(); },
    });
    const text = (await result.text).trim();
    const usage = await result.totalUsage;
    await logFloTurn(db, { ...log, firstToken, input_tokens: usage.inputTokens, output_tokens: usage.outputTokens, steps: (await result.steps).length, ok: !!text, ...(text ? {} : { error: "Empty reply" }) });
    return text;
  } catch (e) {
    await logFloTurn(db, { ...log, firstToken, ok: false, error: String((e as Error)?.message ?? e) });
    throw e;
  }
}

async function replyTo(db: Db, msgId: string) {
  const { data: claimed, error: claimErr } = await db.from("whatsapp_messages")
    .update({ reply_state: "sending", reply_claimed_at: new Date().toISOString() })
    .eq("id", msgId).in("reply_state", ["pending", "failed"]).lt("reply_attempts", MAX_REPLY_ATTEMPTS)
    .select("id,phone,body,wa_message_id,reply_attempts").maybeSingle();
  if (claimErr) throw new Error(`claim failed: ${claimErr.message}`);
  if (!claimed) return;
  const fail = async (state: "failed" | "unknown", err: string) => {
    await db.from("whatsapp_messages").update({
      reply_state: state, reply_error: err.slice(0, 1000), reply_attempts: claimed.reply_attempts + 1, updated_at: new Date().toISOString(),
    }).eq("id", claimed.id);
  };
  try {
    const routed = await routeMessage(db, claimed.phone, claimed.body);
    const visitorId = routed.clinic ? clinicVisitorId(routed.clinic.id, claimed.phone) : `whatsapp_${claimed.phone}`;
    const { data: convo, error: cErr } = await db.from("assistant_conversations")
      .upsert({ visitor_id: visitorId, updated_at: new Date().toISOString() }, { onConflict: "visitor_id" })
      .select("id,messages").single();
    if (cErr || !convo) throw new Error(`conversation failed: ${cErr?.message}`);
    const prior = (Array.isArray(convo.messages) ? convo.messages : []) as unknown as UIMessage[];
    const userId = `wa-${claimed.wa_message_id}`;
    const history = prior.some((m) => m.id === userId) ? prior
      : [...prior, { id: userId, role: "user" as const, parts: [{ type: "text" as const, text: claimed.body }] }];
    // Retries refresh the indicator; first attempts already showed it when the message was saved.
    if (claimed.reply_attempts > 0 && claimed.wa_message_id) await sendTypingIndicator(claimed.wa_message_id);
    const text = routed.text ?? await generateReply(db, convo.id, history, routed.clinic);
    if (!text) return await fail("failed", "Empty reply");
    const sent = await sendWhatsAppText(claimed.phone, text);
    if (!sent.ok) return await fail("failed", sent.error);
    const { data: out } = await db.from("whatsapp_messages").insert({
      wa_message_id: sent.id, direction: "out", phone: claimed.phone, body: text, status: "accepted",
      conversation_id: convo.id, in_reply_to: claimed.id,
    }).select("id").single();
    await db.from("whatsapp_messages").update({
      reply_state: "sent", reply_error: null, conversation_id: convo.id, reply_attempts: claimed.reply_attempts + 1, updated_at: new Date().toISOString(),
    }).eq("id", claimed.id);
    const all = [...history, { id: `wa-out-${out?.id ?? sent.id}`, role: "assistant", parts: [{ type: "text", text }] }];
    await db.from("assistant_conversations").update({ messages: all as never, updated_at: new Date().toISOString() }).eq("id", convo.id);
    // Status callbacks that arrived before this id was saved become runnable now.
    await db.from("whatsapp_webhook_events").update({ next_attempt_at: new Date().toISOString() })
      .is("processed_at", null).eq("event", "whatsapp.status");
  } catch (e) {
    console.error("whatsapp reply failed", e);
    await fail("failed", String((e as Error).message ?? e));
  }
}

/** Bounded recovery pass: pending inbox events, then pending replies. Safe to run concurrently. */
export async function drainWhatsApp(db?: Db) {
  db ??= (await import("@/integrations/supabase/client.server")).supabaseAdmin;
  const now = new Date().toISOString();
  const { data: events } = await db.from("whatsapp_webhook_events")
    .select("id,event,payload,attempts").is("processed_at", null).lte("next_attempt_at", now)
    .order("next_attempt_at").limit(10);
  for (const ev of events ?? []) await processEvent(db, ev);

  // Release replies stuck in "sending" (the worker was cut off). Retry when no reply was recorded;
  // only an unrecorded send whose outcome can't be known would risk a duplicate, which is rare.
  const { data: stuck } = await db.from("whatsapp_messages").select("id")
    .eq("direction", "in").eq("reply_state", "sending").lt("reply_claimed_at", new Date(Date.now() - STUCK_SENDING_MS).toISOString());
  for (const m of stuck ?? []) {
    const { data: out } = await db.from("whatsapp_messages").select("id").eq("in_reply_to", m.id).limit(1);
    await db.from("whatsapp_messages").update(out?.length
      ? { reply_state: "sent", reply_error: null }
      : { reply_state: "pending", reply_error: "Released after an interrupted reply" }).eq("id", m.id).eq("reply_state", "sending");
  }

  // A reply to a message that sat unanswered too long would arrive out of context; mark it expired.
  await db.from("whatsapp_messages").update({ reply_state: "expired", reply_error: "Too old to answer", updated_at: new Date().toISOString() })
    .eq("direction", "in").in("reply_state", ["pending", "failed"]).lt("created_at", new Date(Date.now() - REPLY_EXPIRY_MS).toISOString());

  // Newest first, so a fresh message is never queued behind older retries.
  const { data: pending } = await db.from("whatsapp_messages")
    .select("id").eq("direction", "in").in("reply_state", ["pending", "failed"]).lt("reply_attempts", MAX_REPLY_ATTEMPTS)
    .order("created_at", { ascending: false }).limit(3);
  for (const m of pending ?? []) await replyTo(db, m.id);
}

/** Fire the typing indicator for every inbound message in a webhook payload. Never throws. */
export async function typingForPayload(payload: unknown) {
  const msgs = (value((payload ?? {}) as Json)["messages"] as Json[] | undefined) ?? [];
  await Promise.all(msgs.map((m) => (m["id"] ? sendTypingIndicator(String(m["id"])) : undefined)));
}
