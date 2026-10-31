import { tool, type UIMessage } from "ai";
import { z } from "zod";
import { PUBLIC_CLINIC_CODE, PUBLIC_CLINIC_GREETING, PUBLIC_SAMPLE_BUSINESS_ID } from "@/lib/public-clinic-demo";
import { clinicKnowledge, clinicPrompt, parseClinicCommand, receptionistAudience, toClinicInput } from "@/lib/clinic";

// Shared clinic receptionist mode for Mira on WhatsApp and the website chat.
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
export type ClinicChannel = "WhatsApp" | "Website";
export type ClinicSession = { id: string; name: string; audience: "client" | "patient"; instructions: string };

const CHANNEL_RULES: Record<ClinicChannel, string> = {
  WhatsApp: `CHANNEL: WHATSAPP
- Keep replies short and use WhatsApp formatting only (*bold*, plain lists).
- The contact's WhatsApp number is known; use it as their phone unless they give another.
- When you have the contact's name and preferred time, call request_appointment once, then confirm only after success.
- The visitor can send EXIT to go back to Mira. Never describe yourself or this conversation as a test.`,
  Website: `CHANNEL: WEBSITE CHAT
- Keep replies short; light markdown is fine. Write links in full.
- Ask for the contact's phone number before saving the request.
- When you have the contact's name, phone and preferred time, call request_appointment once, then confirm only after success.
- The visitor can type EXIT to go back to Mira. Never describe yourself or this conversation as a test.`,
};

export async function loadClinicSession(db: Db, id: string, channel: ClinicChannel): Promise<ClinicSession | null> {
  const { data } = await db.from("clinics")
    .select("id,name,phone,emergency_phone,email,address,map_url,hours,doctors,insurance,notes").eq("id", id).maybeSingle();
  if (!data) return null;
  const c = toClinicInput(data);
  const audience = receptionistAudience(c.name, c.doctors);
  return {
    id: data.id, name: c.name, audience,
    instructions: `${clinicPrompt(c.name, c.doctors)}\n\n${audience === "client" ? "FIRM" : "CLINIC"} INFORMATION\n${clinicKnowledge(c)}\n\n${CHANNEL_RULES[channel]}`,
  };
}

export function clinicAppointmentTools(db: Db, clinicId: string, channel: ClinicChannel, fallbackPhone = "") {
  return {
    request_appointment: tool({
      description: "Save a consultation or appointment request for the team to confirm.",
      inputSchema: z.object({
        name: z.string().min(1).max(120),
        phone: z.string().max(40).optional(),
        professional: z.string().max(120).optional(),
        preferred_time: z.string().max(120).optional(),
        reason: z.string().max(500).optional(),
      }),
      execute: async (i) => {
        const { error } = await db.from("clinic_appointment_requests").insert({
          clinic_id: clinicId, channel: channel === "Website" ? "Browser" : "WhatsApp",
          patient_name: i.name, phone: i.phone || fallbackPhone,
          doctor: i.professional ?? "", preferred_time: i.preferred_time ?? "", reason: i.reason ?? "",
        });
        return error ? { ok: false, error: "Could not save the request" } : { ok: true };
      },
    }),
  };
}

export function messageText(m: UIMessage) {
  return (m.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("").trim();
}

/** Finds the latest TRY/EXIT command in the user's messages. Returns the active receptionist code (or null)
 *  and the index of that command, so clinic mode only sees messages sent after it. */
export function activeClinicCommand(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m) continue;
    if (m.role !== "user") continue;
    const cmd = parseClinicCommand(messageText(m));
    if (cmd?.kind === "try") return { code: cmd.code, index: i };
    if (cmd?.kind === "exit") return { code: null, index: i };
  }
  return { code: null, index: -1 };
}

export const EXIT_TEXT = "You're with Mira. Would you like an assistant set up for your own clinic?";

/** Resolves the active TRY/EXIT state from history for every public channel (web chat/voice, phone, WhatsApp).
 *  AURA keeps the public sample; any other saved business code switches to that business's assistant.
 *  Unknown codes are ignored so ordinary phrases like "try again" stay normal Mira messages. */
export async function resolveTrial(db: Db, messages: UIMessage[], channel: ClinicChannel) {
  const cmd = activeClinicCommand(messages);
  const isCommand = cmd.index === messages.length - 1;
  const after = cmd.index >= 0 ? messages.slice(cmd.index + 1) : messages;
  if (!cmd.code) return { notice: isCommand && cmd.index >= 0 ? EXIT_TEXT : null, session: null, history: after };
  if (cmd.code === PUBLIC_CLINIC_CODE) return { notice: isCommand ? PUBLIC_CLINIC_GREETING : null, session: null, history: after };
  const { data } = await db.from("clinics").select("id").eq("test_code", cmd.code).maybeSingle();
  const session = data && data.id !== PUBLIC_SAMPLE_BUSINESS_ID ? await loadClinicSession(db, data.id, channel) : null;
  if (!session) return { notice: null, session: null, history: messages };
  const notice = isCommand ? `Hi, you're now chatting with the assistant for ${session.name}. How can I help you today? Send EXIT anytime to return to Mira.` : null;
  return { notice, session, history: after };
}
