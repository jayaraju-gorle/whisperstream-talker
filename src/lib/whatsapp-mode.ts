export const WHATSAPP_MODE_SETTING_KEY = "whatsapp_mode";
export type WhatsAppMode = { mode: "manual" | "mira" | "business"; clinic_id: string | null };

/** Invalid saved settings fail closed; a missing setting is handled by the legacy default loader. */
export function parseWhatsAppMode(value: unknown): WhatsAppMode {
  if (!value || typeof value !== "object") return { mode: "manual", clinic_id: null };
  const setting = value as { mode?: unknown; clinic_id?: unknown };
  if (setting.mode === "mira" || setting.mode === "manual") return { mode: setting.mode, clinic_id: null };
  if (setting.mode === "business" && typeof setting.clinic_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(setting.clinic_id)) {
    return { mode: "business", clinic_id: setting.clinic_id };
  }
  return { mode: "manual", clinic_id: null };
}