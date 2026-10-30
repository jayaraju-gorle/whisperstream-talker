import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getClinicPresets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !allowed) throw new Error("Only signed-in admins can access business presets.");
    const { IVY_PRESET, IYASHI_PRESET, SSK_PRESET } = await import("@/lib/clinic-presets");
    return [IVY_PRESET, IYASHI_PRESET, SSK_PRESET].map(preset => ({ preset, label: preset.name }));
  });