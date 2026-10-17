import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canManageBusinessPhone } from "@/lib/business-phone";

export const getBusinessPhoneSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ businessId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: business, error } = await context.supabase.from("clinics").select("id,owner_id,call_settings").eq("id", data.businessId).single();
    if (error || !canManageBusinessPhone(business?.owner_id, context.userId)) throw new Error("Only the business owner can manage its phone number.");
    const key = process.env["TWILIO_API_KEY"];
    const appKey = process.env["LOVABLE_API_KEY"];
    if (!key || !appKey) return { connected: false, numbers: [] as { sid: string; number: string; name: string }[] };
    const response = await fetch("https://connector-gateway.lovable.dev/twilio/IncomingPhoneNumbers.json?PageSize=1000", {
      headers: { Authorization: `Bearer ${appKey}`, "X-Connection-Api-Key": key },
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Twilio number lookup failed [${response.status}]: ${body}`);
      throw new Error(`Twilio number lookup failed [${response.status}]: ${body}`);
    }
    const payload = z.object({ incoming_phone_numbers: z.array(z.object({ sid: z.string(), phone_number: z.string(), friendly_name: z.string(), capabilities: z.object({ voice: z.boolean() }) })) }).parse(await response.json());
    return { connected: true, numbers: payload.incoming_phone_numbers.filter(n => n.capabilities.voice).map(n => ({ sid: n.sid, number: n.phone_number, name: n.friendly_name })) };
  });