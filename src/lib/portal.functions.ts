// Token-based clinic receptionist portal: the secret link token is the only credential, so every
// handler validates its format and resolves the clinic from it before touching any request rows.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const token = z.string().regex(/^[a-f0-9]{64}$/);

async function clinicFor(t: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("clinics").select("id,name,phone").eq("portal_token", t).maybeSingle();
  if (!data) throw new Error("This portal link is invalid or has been replaced.");
  return { db: supabaseAdmin, clinic: data };
}

export const getPortal = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token }).parse(d))
  .handler(async ({ data }) => {
    const { db, clinic } = await clinicFor(data.token);
    const { data: requests, error } = await db.from("clinic_appointment_requests")
      .select("id,channel,patient_name,phone,doctor,preferred_time,reason,status,created_at")
      .eq("clinic_id", clinic.id).order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error("Couldn't load requests.");
    return { clinic: { name: clinic.name }, requests: requests ?? [] };
  });

export const setPortalStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token, id: z.string().uuid(), status: z.enum(["new", "confirmed", "cancelled"]) }).parse(d))
  .handler(async ({ data }) => {
    const { db, clinic } = await clinicFor(data.token);
    const { error } = await db.from("clinic_appointment_requests").update({ status: data.status })
      .eq("id", data.id).eq("clinic_id", clinic.id);
    if (error) throw new Error("Couldn't update the request.");
    return { ok: true };
  });
