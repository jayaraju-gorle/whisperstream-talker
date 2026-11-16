import { parseWhatsAppMode, WHATSAPP_MODE_SETTING_KEY } from "../whatsapp-mode";
import { DEMO_BUSINESS_SETTING_KEY, parseDemoBusinessId } from "../demo-business";
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export async function loadWhatsAppMode(db: Db) {
  const { data, error } = await db.from("app_settings").select("key,value")
    .in("key", [WHATSAPP_MODE_SETTING_KEY, DEMO_BUSINESS_SETTING_KEY]);
  if (error) throw new Error(`WhatsApp mode lookup failed: ${error.message}`);
  const saved = data?.find(row => row.key === WHATSAPP_MODE_SETTING_KEY);
  if (saved) return parseWhatsAppMode(saved.value);
  // Preserve the existing all-channel demo switch until WhatsApp gets its own explicit setting.
  const id = parseDemoBusinessId(data?.find(row => row.key === DEMO_BUSINESS_SETTING_KEY)?.value);
  return parseWhatsAppMode(id ? { mode: "business", clinic_id: id } : { mode: "mira" });
}