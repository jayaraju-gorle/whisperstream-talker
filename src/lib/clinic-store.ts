// Browser-side persistence for clinic onboarding: keeps the clinic row, its knowledge base and its
// receptionist scenario in sync so the playground and WhatsApp test use the same information.
import { supabase } from "@/integrations/supabase/client";
import { CLINIC_SAMPLE, clinicKnowledge, clinicPrompt, type ClinicInput } from "@/lib/clinic";

export type ClinicRow = ClinicInput & { id: string; scenario_id: string | null; kb_id: string | null; test_code: string; portal_token?: string; created_at: string };

export const CLINIC_COLUMNS = "id,name,phone,emergency_phone,email,address,map_url,hours,doctors,insurance,notes,scenario_id,kb_id,test_code,portal_token,created_at";

export async function saveClinic(userId: string, input: ClinicInput, existing?: Pick<ClinicRow, "id" | "scenario_id" | "kb_id">) {
  const clean = { ...input, doctors: input.doctors.filter((d) => d.name.trim()) };
  const kb = { user_id: userId, name: `${clean.name} — clinic guide`, content: clinicKnowledge(clean), updated_at: new Date().toISOString() };
  let kbId = existing?.kb_id ?? null;
  if (kbId) {
    const { error } = await supabase.from("knowledge_bases").update(kb).eq("id", kbId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("knowledge_bases").insert(kb).select("id").single();
    if (error) throw error;
    kbId = data.id;
  }
  const scenario = { user_id: userId, label: `${clean.name} receptionist`, prompt: clinicPrompt(clean.name), sample: CLINIC_SAMPLE, kb_ids: [kbId], updated_at: new Date().toISOString() };
  let scenarioId = existing?.scenario_id ?? null;
  if (scenarioId) {
    const { error } = await supabase.from("custom_scenarios").update(scenario).eq("id", scenarioId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("custom_scenarios").insert(scenario).select("id").single();
    if (error) throw error;
    scenarioId = data.id;
  }
  const row = { ...clean, hours: clean.hours as never, doctors: clean.doctors as never, owner_id: userId, kb_id: kbId, scenario_id: scenarioId, updated_at: new Date().toISOString() };
  if (existing) {
    const { error } = await supabase.from("clinics").update(row).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await supabase.from("clinics").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}
