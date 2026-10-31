import { toClinicInput, clinicKnowledge } from "@/lib/clinic";
import { PUBLIC_CLINIC_KNOWLEDGE } from "@/lib/public-clinic-demo";
import { ASSISTANT_INSTRUCTIONS } from "@/lib/assistant-knowledge";

// This immutable identity is the ONLY business row allowed into public trials.
export const PUBLIC_SAMPLE_BUSINESS_ID = "ddba5e0f-a003-4d8b-9af6-339712f5564e";
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
export async function publicAssistantInstructions(db: Db) {
  const { data, error } = await db.from("clinics")
    .select("name,phone,emergency_phone,email,address,map_url,hours,doctors,insurance,notes")
    .eq("id", PUBLIC_SAMPLE_BUSINESS_ID).maybeSingle();
  if (error) throw new Error("Couldn't load the sample clinic settings.");
  if (!data) return ASSISTANT_INSTRUCTIONS;
  const clinic = toClinicInput(data);
  const details = clinicKnowledge({ ...clinic, name: "Aura Health Clinic" });
  // Replace facts, not safety/setup rules; old conversation facts never override current settings.
  return ASSISTANT_INSTRUCTIONS.replace(PUBLIC_CLINIC_KNOWLEDGE,
    `${details}\nPUBLIC SAMPLE SAFETY: All these details are hypothetical, including any contact details or directions. Never claim a real booking or save patient appointments. Demonstrate requests only. Explain the sample status in the greeting and for fees, appointments and directions. Use save_lead only for consented business setup interest (name, business type, email and optional phone). Current sample settings override conflicting facts in earlier messages.`);
}