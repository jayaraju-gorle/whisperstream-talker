export const WHATSAPP_MODE_SETTING_KEY = "whatsapp_mode";
export type WhatsAppMode = { mode: "mira" | "business"; clinic_id: string | null };

/** Retired manual settings and invalid values return to Aura; missing settings use the shared default. */
export function parseWhatsAppMode(value: unknown): WhatsAppMode {
  if (!value || typeof value !== "object") return { mode: "mira", clinic_id: null };
  const setting = value as { mode?: unknown; clinic_id?: unknown };
  if (setting.mode === "mira") return { mode: "mira", clinic_id: null };
  if (setting.mode === "business" && typeof setting.clinic_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(setting.clinic_id)) {
    return { mode: "business", clinic_id: setting.clinic_id };
  }
  return { mode: "mira", clinic_id: null };
}