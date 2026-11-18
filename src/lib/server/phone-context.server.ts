import { timingSafeEqual } from "node:crypto";
import type { UIMessage } from "ai";
import { activeClinicCommand, resolveTrial } from "./clinic-mode.server";
import { PUBLIC_SAMPLE_BUSINESS_ID } from "@/lib/public-clinic-demo";

type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
export const PHONE_CONTEXT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Exact E.164 matching; bare Indian mobile numbers are normalized, never suffix-matched. */
export function normalizeCallerPhone(value: string | undefined): string | null {
  if (!value || !/^[+\d\s().-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^[6-9]\d{9}$/.test(digits)) digits = `91${digits}`;
  return /^[1-9]\d{10,14}$/.test(digits) ? digits : null;
}

export async function phoneVisitorId(session: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(session));
  return `bolna_${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 56)}`;
}

async function contextSignature(id: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`mira-phone-context:${id}`));
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function phoneContextToken(id: string, secret: string) {
  return `mira_ctx_${id.slice(6)}_${await contextSignature(id, secret)}`;
}

/** Only a server-signed reference is accepted from Bolna's injected prompt, never its instructions. */
export async function resolvePhoneContextToken(systemText: string, secret: string) {
  const match = /\bmira_ctx_([0-9a-f]{56})_([0-9a-f]{64})\b/.exec(systemText);
  if (!match?.[1] || !match[2]) return null;
  const id = `bolna_${match[1]}`;
  const expected = new TextEncoder().encode(await contextSignature(id, secret));
  const supplied = new TextEncoder().encode(match[2]);
  return timingSafeEqual(expected, supplied) ? id : null;
}

export async function loadRecentWhatsAppContext(db: Db, phone: string, now = Date.now()): Promise<UIMessage[]> {
  const cutoff = new Date(now - PHONE_CONTEXT_WINDOW_MS).toISOString();
  const { data, error } = await db.from("whatsapp_messages")
    .select("id,wa_message_id,direction,body,created_at,provider_ts,message_type,transcription_state,status")
    .eq("phone", phone).gte("created_at", cutoff).order("created_at", { ascending: false }).limit(40);
  if (error) throw new Error("Could not load recent WhatsApp context");
  // Resolve older TRY state from the server transcript, not the truncated recent-message window.
  const { data: conversation, error: conversationError } = await db.from("assistant_conversations")
    .select("messages").eq("visitor_id", `whatsapp_${phone}`).maybeSingle();
  if (conversationError) throw new Error("Could not resolve WhatsApp conversation");
  const history: UIMessage[] = (data ?? []).reverse()
    .filter(row => row.body.trim() && (row.message_type === "text" || (row.message_type === "audio" && row.transcription_state === "complete")) && row.status !== "failed")
    .map(row => ({ id: `phone-wa-${row.id}`, role: row.direction === "in" ? "user" : "assistant", parts: [{ type: "text", text: `[WhatsApp ${row.provider_ts ?? row.created_at}] ${row.body}` }] }));
  if (!history.some(m => m.role === "user")) return [];
  const savedHistory = (Array.isArray(conversation?.messages) ? conversation.messages : []) as unknown as UIMessage[];
  const routingHistory = savedHistory.length ? savedHistory : (data ?? []).map(row => ({ id: `wa-${row.wa_message_id}`, role: row.direction === "in" ? "user" as const : "assistant" as const, parts: [{ type: "text" as const, text: row.body }] }));
  const trial = await resolveTrial(db, routingHistory, "Website");
  const command = activeClinicCommand(routingHistory);
  const boundary = command.index >= 0 ? routingHistory[command.index]?.id : undefined;
  const commandRow = boundary?.startsWith("wa-") ? (data ?? []).find(row => `wa-${row.wa_message_id}` === boundary) : undefined;
  // Pin the resolved business in this call, including the shared default when WhatsApp had no TRY.
  const { data: business, error: businessError } = await db.from("clinics").select("test_code")
    .eq("id", trial.session?.id ?? PUBLIC_SAMPLE_BUSINESS_ID).maybeSingle();
  if (businessError) throw new Error("Could not resolve WhatsApp business context");
  const code = business?.test_code ?? (trial.session ? null : "AURA");
  if (!code) return [];
  const { data: requests, error: requestsError } = await db.from("clinic_appointment_requests")
    .select("patient_name,doctor,preferred_time,status,created_at")
    .eq("clinic_id", trial.session?.id ?? PUBLIC_SAMPLE_BUSINESS_ID).eq("phone", phone)
    .gte("created_at", cutoff).order("created_at", { ascending: false }).limit(3);
  if (requestsError) throw new Error("Could not load existing appointment requests");
  const carried = history.filter(m => {
    if (!commandRow) return true;
    const row = (data ?? []).find(row => `phone-wa-${row.id}` === m.id);
    return row && row.created_at > commandRow.created_at;
  }).slice(-20);
  return [{ id: `phone-context-${crypto.randomUUID()}`, role: "user", parts: [{ type: "text", text: `TRY ${code}` }],
    metadata: { miraPhoneContext: { phone, importedAt: new Date(now).toISOString(), requests: requests ?? [] } } }, ...carried];
}

export function phoneContextDetails(messages: UIMessage[]) {
  const metadata = messages.find(m => m.id.startsWith("phone-context-"))?.metadata as { miraPhoneContext?: { phone?: string; importedAt?: string; requests?: unknown[] } } | undefined;
  return metadata?.miraPhoneContext;
}

/** Recent phone-call turns for a WhatsApp number, as one read-only context note (newest calls last). */
export async function loadRecentCallContext(db: Db, phone: string, now = Date.now()): Promise<UIMessage[]> {
  const cutoff = new Date(now - PHONE_CONTEXT_WINDOW_MS).toISOString();
  const { data: links, error } = await db.from("phone_call_links").select("visitor_id,created_at")
    .eq("phone", phone).gte("created_at", cutoff).order("created_at", { ascending: false }).limit(3);
  if (error) throw new Error("Could not load recent call links");
  if (!links?.length) return [];
  const { data: calls, error: callError } = await db.from("assistant_conversations").select("visitor_id,messages")
    .in("visitor_id", links.map(l => l.visitor_id));
  if (callError) throw new Error("Could not load recent calls");
  const lines: string[] = [];
  for (const link of [...links].reverse()) {
    const msgs = (calls?.find(c => c.visitor_id === link.visitor_id)?.messages ?? []) as unknown as UIMessage[];
    const turns = (Array.isArray(msgs) ? msgs : [])
      .filter(m => !m.id?.startsWith("phone-wa-") && !m.id?.startsWith("phone-context-") && !m.id?.startsWith("web-context-"))
      .map(m => `${m.role === "user" ? "Caller" : "Mira"}: ${m.parts.filter(p => p.type === "text").map(p => (p as { text: string }).text).join(" ").trim()}`)
      .filter(l => !/:\s*$/.test(l)).slice(-16);
    if (turns.length) lines.push(`Phone call at ${link.created_at}:\n${turns.join("\n")}`);
  }
  if (!lines.length) return [];
  return [{ id: `call-context-${links[0]!.visitor_id}`, role: "user", parts: [{ type: "text",
    text: `[Context only, not a new request: this customer recently phoned Mira from the same number. Continue naturally without repeating questions already answered.]\n${lines.join("\n\n")}`.slice(0, 6000) }] }];
}

/** Recent website-chat turns for a normalized phone number (via saved leads), as one read-only context note. */
export async function loadRecentWebContext(db: Db, phone: string, now = Date.now()): Promise<UIMessage[]> {
  const cutoff = new Date(now - PHONE_CONTEXT_WINDOW_MS).toISOString();
  const leadsQuery = db.from("leads")?.select("conversation_id,phone,created_at");
  if (!leadsQuery) return [];
  const { data: leads, error } = await leadsQuery
    .gte("created_at", cutoff).order("created_at", { ascending: false }).limit(50);
  if (error || !leads?.length) return [];
  const convoIds = [...new Set(
    leads.filter(l => l.conversation_id && normalizeCallerPhone(l.phone ?? undefined) === phone)
      .map(l => l.conversation_id as string),
  )].slice(0, 3);
  if (!convoIds.length) return [];
  const { data: convos, error: convoError } = await db.from("assistant_conversations").select("id,messages,updated_at")
    .in("id", convoIds);
  if (convoError || !convos?.length) return [];
  const lines: string[] = [];
  for (const convo of [...convos].reverse()) {
    const msgs = (Array.isArray(convo.messages) ? convo.messages : []) as unknown as UIMessage[];
    const turns = msgs
      .filter(m => !m.id?.startsWith("phone-wa-") && !m.id?.startsWith("phone-context-") && !m.id?.startsWith("call-context-") && !m.id?.startsWith("web-context-") && !m.id?.startsWith("wa-note-"))
      .map(m => `${m.role === "user" ? "Visitor" : "Mira"}: ${(m.parts ?? []).filter(p => p.type === "text").map(p => (p as { text: string }).text).join(" ").trim()}`)
      .filter(l => !/:\s*$/.test(l)).slice(-16);
    if (turns.length) lines.push(`Website chat at ${convo.updated_at}:\n${turns.join("\n")}`);
  }
  if (!lines.length) return [];
  return [{ id: `web-context-${convoIds[0]}`, role: "user", parts: [{ type: "text",
    text: `[Context only, not a new request: this customer recently chatted on the website with the same phone number. Continue naturally without repeating questions already answered.]\n${lines.join("\n\n")}`.slice(0, 6000) }] }];
}

/** Recent WhatsApp turns for a normalized phone number, formatted as a read-only note for website chat/voice. */
export async function loadRecentWhatsAppNote(db: Db, phone: string, now = Date.now()): Promise<UIMessage[]> {
  const cutoff = new Date(now - PHONE_CONTEXT_WINDOW_MS).toISOString();
  const waQuery = db.from("whatsapp_messages")?.select("id,direction,body,created_at,provider_ts,message_type,transcription_state,status");
  if (!waQuery) return [];
  const { data, error } = await waQuery
    .eq("phone", phone).gte("created_at", cutoff).order("created_at", { ascending: false }).limit(20);
  if (error || !data?.length) return [];
  const turns = [...data].reverse()
    .filter(row => row.body.trim() && (row.message_type === "text" || (row.message_type === "audio" && row.transcription_state === "complete")) && row.status !== "failed")
    .map(row => `${row.direction === "in" ? "Visitor" : "Mira"} (${row.provider_ts ?? row.created_at}): ${row.body.trim()}`);
  if (!turns.length) return [];
  return [{ id: `wa-note-${phone}`, role: "user", parts: [{ type: "text",
    text: `[Context only, not a new request: this visitor recently messaged Mira on WhatsApp from the same phone number. Before disclosing personal details, briefly confirm they want to continue their WhatsApp inquiry.]\n${turns.join("\n")}`.slice(0, 6000) }] }];
}

/** Extracts a normalized phone number from saved tool inputs or user messages in a conversation history. */
export function phoneFromMessages(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i]?.parts ?? [];
    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j] as { type?: string; input?: { phone?: unknown } } | undefined;
      if (part?.type?.startsWith("tool-") && typeof part.input?.phone === "string") {
        const normalized = normalizeCallerPhone(part.input.phone);
        if (normalized) return normalized;
      }
    }
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "user") continue;
    for (const part of message.parts ?? []) {
      if (part.type !== "text") continue;
      const matches = (part as { text: string }).text.match(/\+?\d[\d\s().-]{8,16}\d/g) ?? [];
      for (let k = matches.length - 1; k >= 0; k--) {
        const normalized = normalizeCallerPhone(matches[k]);
        if (normalized) return normalized;
      }
    }
  }
  return null;
}
