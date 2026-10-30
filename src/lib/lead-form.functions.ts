import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const LeadFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  businessType: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
  website: z.string().max(0).optional().default(""), // honeypot: must stay empty
});

/** Public homepage form: saves a setup lead and alerts the team. */
export const submitLeadForm = createServerFn({ method: "POST" })
  .validator((input: unknown) => LeadFormSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { notifyNewLead } = await import("@/lib/server/flo.server");
    const lead = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.businessType,
      interest: data.message || `Custom front desk for: ${data.businessType}`,
    };
    const { error } = await supabaseAdmin.from("leads").insert(lead);
    if (error) {
      console.error("lead form insert failed", error);
      throw new Error("Could not save your details. Please try again.");
    }
    await notifyNewLead({ ...lead, channel: "Website form" }).catch((e: unknown) => console.error("lead alert failed", e));
    return { ok: true };
  });
