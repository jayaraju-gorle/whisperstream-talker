// Browser- and server-safe clinic onboarding helpers: shapes, defaults and the receptionist prompt.
import { assistantClock } from "./assistant-speech";
export type TimeSlot = { from: string; to: string };
export type DayHours = { day: string; open: boolean; slots: TimeSlot[] };
export type Doctor = { name: string; specialty: string; days: string; fee: string };
export type ClinicInput = {
  name: string;
  phone: string;
  emergency_phone: string;
  email: string;
  address: string;
  map_url: string;
  hours: DayHours[];
  doctors: Doctor[];
  insurance: string;
  notes: string;
};

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function defaultHours(): DayHours[] {
  return DAYS.map((day) => ({ day, open: day !== "Sunday", slots: [{ from: "09:00", to: day === "Saturday" ? "14:00" : "18:00" }] }));
}

export function emptyClinic(): ClinicInput {
  return { name: "", phone: "", emergency_phone: "", email: "", address: "", map_url: "", hours: defaultHours(), doctors: [{ name: "", specialty: "", days: "", fee: "" }], insurance: "", notes: "" };
}

/** Normalise stored JSON back into the editable shape. */
export function toClinicInput(row: Partial<Record<keyof ClinicInput, unknown>>): ClinicInput {
  const base = emptyClinic();
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const hours = Array.isArray(row.hours) && row.hours.length === 7 ? (row.hours as unknown[]).map(normalizeDay) : base.hours;
  const doctors = Array.isArray(row.doctors) ? (row.doctors as Doctor[]) : base.doctors;
  return {
    name: str(row.name), phone: str(row.phone), emergency_phone: str(row.emergency_phone), email: str(row.email),
    address: str(row.address), map_url: str(row.map_url), hours, doctors, insurance: str(row.insurance), notes: str(row.notes),
  };
}

/** Accepts both the current slot shape and the older single from/to shape. */
function normalizeDay(v: unknown, i: number): DayHours {
  const o = (v ?? {}) as { day?: unknown; open?: unknown; slots?: unknown; from?: unknown; to?: unknown };
  const day = typeof o.day === "string" ? o.day : DAYS[i]!;
  const slots = Array.isArray(o.slots)
    ? (o.slots as TimeSlot[]).filter((x) => x && typeof x.from === "string" && typeof x.to === "string")
    : typeof o.from === "string" && typeof o.to === "string" ? [{ from: o.from, to: o.to }] : [];
  return { day, open: Boolean(o.open) && slots.length > 0, slots: slots.length ? slots : [{ from: "09:00", to: "18:00" }] };
}

export function hoursLine(h: DayHours) {
  return h.open ? `${h.day}: ${h.slots.map((s) => `${s.from} – ${s.to}`).join(", ")}` : `${h.day}: Closed`;
}

/** Step validation used by the wizard; returns the first problem or null. */
export function stepError(step: number, c: ClinicInput): string | null {
  if (step === 0) {
    if (!c.name.trim()) return "Add the clinic name.";
    if (!c.phone.trim()) return "Add the appointments phone number.";
  }
  if (step === 1) {
    if (!c.hours.some((h) => h.open)) return "Open the clinic on at least one day.";
    for (const h of c.hours.filter((d) => d.open)) {
      if (!h.slots.length) return `${h.day}: add at least one time slot.`;
      if (h.slots.some((s) => !(s.from < s.to))) return `${h.day}: closing time must be after opening time.`;
      const sorted = [...h.slots].sort((a, b) => a.from.localeCompare(b.from));
      if (sorted.some((s, k) => k > 0 && s.from < sorted[k - 1]!.to)) return `${h.day}: time slots overlap.`;
    }
  }
  if (step === 2) {
    const docs = c.doctors.filter((d) => d.name.trim());
    if (!docs.length) return "Add at least one doctor.";
    if (docs.some((d) => !d.fee.trim())) return "Add a consultation fee for every doctor.";
  }
  return null;
}

export function clinicKnowledge(c: ClinicInput) {
  const docs = c.doctors.filter((d) => d.name.trim());
  const firm = receptionistAudience(c.name, docs) === "client";
  const lines = [`# ${c.name} — AI assistant guide`, "", "## Contact", `- Appointments: ${c.phone}`];
  if (c.emergency_phone) lines.push(`- Emergency: ${c.emergency_phone}`);
  if (c.email) lines.push(`- Email: ${c.email}`);
  if (c.address) lines.push(`- Address: ${c.address}`);
  if (c.map_url) lines.push(`- Google Maps / Directions: ${c.map_url}`);
  lines.push("", "## Opening hours", ...c.hours.map((h) => `- ${h.open
    ? `${h.day}: ${h.slots.map(s => `${assistantClock(s.from)} – ${assistantClock(s.to)}`).join(", ")}`
    : `${h.day}: Closed`}`));
  lines.push("", firm ? "## Professionals and consultation fees" : "## Doctors and consultation fees",
    ...docs.map((d) => `- ${d.name}${d.specialty ? ` (${d.specialty})` : ""}${d.days ? ` — ${d.days}` : ""}. Fee: ${d.fee}.`));
  if (c.insurance) lines.push("", "## Insurance", c.insurance);
  if (c.notes) lines.push("", "## Other information", c.notes);
  return lines.join("\n");
}

/** Identify advisory firms by name or professional qualifications, preserving medical defaults. */
export function receptionistAudience(name: string, professionals: Doctor[] = []): "client" | "patient" {
  return /\bSSK\b|\bchartered accountants?\b|\bCA\b|\btax (?:firm|advisory|consultancy|consultants?)\b/i.test(name)
    || professionals.some((p) => /^CA\b/i.test(p.name.trim()) || /\bchartered accountant\b/i.test(p.specialty))
    ? "client" : "patient";
}

export function clinicPrompt(name: string, professionals: Doctor[] = []) {
  if (receptionistAudience(name, professionals) === "client") {
    return `You are the friendly assistant for ${name}, a CA / tax advisory firm. Help clients with opening hours, professionals, consultation fees, taxation and compliance services, and booking consultations using only the firm information provided. Always respond in English unless the caller explicitly speaks in another language. Never switch language unprompted. Keep every reply short: 1-2 sentences per turn, and ask only one clear question at a time. To book a consultation, guide the client step by step, asking one question per turn in this order: the client's name, the preferred professional, the preferred date and time, then a contact phone number. Once you have all four, confirm the request back in one sentence and say the ${name} team will call to confirm. Only say a request was saved after the request_appointment tool reports success. Do not give definitive personalised tax or legal advice or invent deadlines, fees or services; refer those questions to the CA / tax advisory team. Whenever a client asks for the location, address or directions, share the address and the Google Maps / Directions link from the firm information if it is provided. If information is missing, say you'll ask the ${name} team. Use client, firm, professional and CA / tax advisory team terminology throughout, including when earlier messages use unrelated terminology.`;
  }
  return `You are the friendly AI assistant for ${name}. Help patients with opening hours, doctors, consultation fees and booking appointments using only the clinic information provided. Always respond in English unless the caller explicitly speaks in another language. Never switch language unprompted. Keep every reply short: 1-2 sentences per turn, and ask only one clear question at a time. To book an appointment, guide the patient step by step, asking one question per turn in this order: the patient's name, the preferred doctor, the preferred date and time, then a contact phone number. Once you have all four, confirm the request back in one sentence and say the clinic will call to confirm. Never give medical advice or diagnoses. Whenever a patient asks for the location, address or directions, share the address and the Google Maps / Directions link from the clinic information if it is provided. For emergencies, immediately share the emergency number. If information is missing, say you'll ask the clinic team.`;
}

export const CLINIC_SAMPLE = [
  "Hi, what time are you open on Saturday?",
  "How much is a consultation?",
  "I'd like to book an appointment for next week.",
];

/** WhatsApp text that switches the visitor to a clinic's receptionist. */
export function testCommand(code: string) {
  return `TRY ${code}`;
}

export function parseClinicCommand(body: string): { kind: "try"; code: string } | { kind: "exit" } | null {
  const t = body.trim();
  // Also accepts spoken/spelled forms such as "Try Iyashi." or "try I-Y-A-S-H-I".
  const m = /^try[\s,]+([a-z0-9]{3,10}|(?:[a-z0-9][\s.-]){2,9}[a-z0-9])[.!?]?$/i.exec(t);
  if (m) return { kind: "try", code: m[1]!.replace(/[^a-z0-9]/gi, "").toUpperCase() };
  if (/^exit[.!?]?$/i.test(t)) return { kind: "exit" };
  return null;
}

/** Test codes are 3–10 uppercase letters or digits (also enforced by the database). */
export function testCodeError(code: string): string | null {
  return /^[A-Z0-9]{3,10}$/.test(code) ? null : "Assistant code must be 3–10 letters or numbers, with no spaces.";
}

export const CLINIC_VISITOR_PREFIX = "wa_c_";
/** Short key for a clinic (uuid without dashes) so visitor ids stay under the 64-char limit. */
export function clinicVisitorKey(clinicId: string) {
  return clinicId.replace(/-/g, "");
}
export function clinicVisitorId(clinicId: string, phone: string) {
  return `${CLINIC_VISITOR_PREFIX}${clinicVisitorKey(clinicId)}_${phone}`;
}
