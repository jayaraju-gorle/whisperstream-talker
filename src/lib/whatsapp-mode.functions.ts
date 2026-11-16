import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { WHATSAPP_MODE_SETTING_KEY } from "./whatsapp-mode";

export const saveWhatsAppMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("manual"), clinic_id: z.null() }),
    z.object({ mode: z.literal("mira"), clinic_id: z.null() }),
    z.object({ mode: z.literal("business"), clinic_id: z.string().uuid() }),
  ]))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Admin access required");
    if (data.mode === "business") {
      const { data: business, error } = await context.supabase.from("clinics").select("id").eq("id", data.clinic_id).maybeSingle();
      if (error || !business) throw new Error("Choose an accessible business");
    }
    const { error } = await context.supabase.from("app_settings").upsert({
      key: WHATSAPP_MODE_SETTING_KEY, value: data, updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) throw new Error("Couldn't save WhatsApp mode");
    if (data.mode === "manual") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { suppressPendingReplies } = await import("./server/whatsapp.server");
      await suppressPendingReplies(supabaseAdmin);
    }
    return data;
  });