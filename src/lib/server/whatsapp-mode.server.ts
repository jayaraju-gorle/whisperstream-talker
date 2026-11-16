import { parseWhatsAppMode } from "../whatsapp-mode";
import { DEMO_BUSINESS_SETTING_KEY, parseDemoBusinessId } from "../demo-business";
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

export async function loadWhatsAppMode(db: Db) {
  const { data, error } = await db.from("app_settings").select("key,value")
    .in("key", [DEMO_BUSINESS_SETTING_KEY]);
  if (error) throw new Error(`WhatsApp mode lookup failed: ${error.message}`);
  // Businesses owns the default for every channel; retired WhatsApp overrides are ignored.
  const id = parseDemoBusinessId(data?.find(row => row.key === DEMO_BUSINESS_SETTING_KEY)?.value);
  return parseWhatsAppMode(id ? { mode: "business", clinic_id: id } : { mode: "mira" });
}