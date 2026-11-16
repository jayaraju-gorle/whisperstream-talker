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