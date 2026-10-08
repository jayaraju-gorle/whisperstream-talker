import { tool, type UIMessage } from "ai";
import { z } from "zod";
import { clinicKnowledge, clinicPrompt, parseClinicCommand, toClinicInput } from "@/lib/clinic";

// Shared clinic test-receptionist mode for Flo on WhatsApp and the website chat.
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
export type ClinicChannel = "WhatsApp" | "Website";
export type ClinicSession = { id: string; name: string; instructions: string };

const CHANNEL_RULES: Record<ClinicChannel, string> = {
  WhatsApp: `CHANNEL: WHATSAPP
- Keep replies short and use WhatsApp formatting only (*bold*, plain lists).
- The patient's WhatsApp number is known; use it as their phone unless they give another.
- When you have the patient's name and preferred time, call request_appointment once, then confirm.
- This is a test conversation; the patient can send EXIT to stop.`,
  Website: `CHANNEL: WEBSITE CHAT
- Keep replies short; light markdown is fine. Write links in full.
- Ask for the patient's phone number before saving the request.
- When you have the patient's name, phone and preferred time, call request_appointment once, then confirm.
- This is a test conversation; the patient can type EXIT to go back to Flo.`,
};

export async function loadClinicSession(db: Db, id: string, channel: ClinicChannel): Promise<ClinicSession | null> {
  const { data } = await db.from("clinics")
    .select("id,name,phone,emergency_phone,email,address,map_url,hours,doctors,insurance,notes").eq("id", id).maybeSingle();
  if (!data) return null;
  const c = toClinicInput(data);
  return {
    id: data.id, name: c.name,
    instructions: `${clinicPrompt(c.name)}\n\nCLINIC INFORMATION\n${clinicKnowledge(c)}\n\n${CHANNEL_RULES[channel]}`,
  };
}

export function clinicAppointmentTools(db: Db, clinicId: string, channel: ClinicChannel, fallbackPhone = "") {
  return {
    request_appointment: tool({
      description: "Save a patient's appointment request for the clinic team to confirm.",
      inputSchema: z.object({
        patient_name: z.string().min(1).max(120),
        phone: z.string().max(40).optional(),
        doctor: z.string().max(120).optional(),
        preferred_time: z.string().max(120).optional(),
        reason: z.string().max(500).optional(),
      }),
      execute: async (i) => {
        const { error } = await db.from("clinic_appointment_requests").insert({
          clinic_id: clinicId, channel: channel === "Website" ? "Browser" : "WhatsApp",
          patient_name: i.patient_name, phone: i.phone || fallbackPhone,
          doctor: i.doctor ?? "", preferred_time: i.preferred_time ?? "", reason: i.reason ?? "",
        });
        return error ? { ok: false, error: "Could not save the request" } : { ok: true };
      },
    }),
  };
}

export function messageText(m: UIMessage) {
  return (m.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("").trim();
}

/** Finds the latest TEST/EXIT command in the user's messages. Returns the active test code (or null)
 *  and the index of that command, so clinic mode only sees messages sent after it. */
export function activeClinicCommand(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== "user") continue;
    const cmd = parseClinicCommand(messageText(m));
    if (cmd?.kind === "test") return { code: cmd.code, index: i };
    if (cmd?.kind === "exit") return { code: null, index: i };
  }
  return { code: null, index: -1 };
}
