import { DAYS, type DayHours } from "@/lib/clinic";

export type BusinessCallSettings = {
  enabled: boolean;
  forwarding_number: string;
  voice_greeting: string;
  use_business_hours: boolean;
  timezone: string;
  hours: DayHours[];
};

export function toCallSettings(value: unknown, businessHours: DayHours[]): BusinessCallSettings {
  const v = value && typeof value === "object" ? value as Partial<BusinessCallSettings> : {};
  return {
    enabled: v.enabled === true,
    forwarding_number: typeof v.forwarding_number === "string" ? v.forwarding_number : "",
    voice_greeting: typeof v.voice_greeting === "string" ? v.voice_greeting : "",
    use_business_hours: v.use_business_hours !== false,
    timezone: typeof v.timezone === "string" ? v.timezone : "Asia/Kolkata",
    hours: Array.isArray(v.hours) && v.hours.length === 7 ? v.hours : businessHours.map(h => ({ ...h, slots: h.slots.map(s => ({ ...s })) })),
  };
}

export function callSettingsError(s: BusinessCallSettings): string | null {
  if (s.forwarding_number.trim() && !/^\+[1-9]\d{6,14}$/.test(s.forwarding_number.replace(/[\s()-]/g, ""))) return "Add a valid forwarding number including its country code.";
  if (s.voice_greeting.length > 1000) return "Keep the voice greeting within 1,000 characters.";
  try { new Intl.DateTimeFormat("en", { timeZone: s.timezone }); } catch { return "Choose a valid time zone."; }
  if (!s.use_business_hours) {
    if (!s.hours.some(h => h.open)) return "Choose at least one working day.";
    for (const [i, h] of s.hours.entries()) {
      if (!h.open) continue;
      if (!h.slots.length || h.slots.some(slot => !/^\d{2}:\d{2}$/.test(slot.from) || !/^\d{2}:\d{2}$/.test(slot.to) || slot.from >= slot.to)) return `${DAYS[i]}: closing time must be after opening time.`;
      const sorted = [...h.slots].sort((a, b) => a.from.localeCompare(b.from));
      if (sorted.some((slot, k) => k > 0 && slot.from < (sorted[k - 1]?.to ?? ""))) return `${DAYS[i]}: time slots overlap.`;
    }
  }
  return null;
}