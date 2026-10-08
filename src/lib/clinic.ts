// Browser- and server-safe clinic onboarding helpers: shapes, defaults and the receptionist prompt.
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
  const lines = [`# ${c.name} — Front desk guide`, "", "## Contact", `- Appointments: ${c.phone}`];
  if (c.emergency_phone) lines.push(`- Emergency: ${c.emergency_phone}`);
  if (c.email) lines.push(`- Email: ${c.email}`);
  if (c.address) lines.push(`- Address: ${c.address}`);
  if (c.map_url) lines.push(`- Google Maps / Directions: ${c.map_url}`);
  lines.push("", "## Opening hours", ...c.hours.map((h) => `- ${hoursLine(h)}`));
  lines.push("", "## Doctors and consultation fees",
    ...docs.map((d) => `- ${d.name}${d.specialty ? ` (${d.specialty})` : ""}${d.days ? ` — ${d.days}` : ""}. Fee: ${d.fee}.`));
  if (c.insurance) lines.push("", "## Insurance", c.insurance);
  if (c.notes) lines.push("", "## Other information", c.notes);
  return lines.join("\n");
}

export function clinicPrompt(name: string) {
  return `You are the friendly front-desk receptionist for ${name}. Help patients with opening hours, doctors, consultation fees and booking appointments using only the clinic information provided. To request an appointment, collect the patient's name, phone number, preferred doctor and preferred day/time, then confirm the request back in one sentence and say the clinic will call to confirm. Never give medical advice or diagnoses. Whenever a patient asks for the location, address or directions, share the address and the Google Maps / Directions link from the clinic information if it is provided. For emergencies, immediately share the emergency number. If information is missing, say you'll ask the clinic team.`;
}

export const CLINIC_SAMPLE = [
  "Hi, what time are you open on Saturday?",
  "How much is a consultation?",
  "I'd like to book an appointment for next week.",
];

/** WhatsApp text that switches the visitor to a clinic's test receptionist. */
export function testCommand(code: string) {
  return `TEST ${code}`;
}

export function parseClinicCommand(body: string): { kind: "test"; code: string } | { kind: "exit" } | null {
  const t = body.trim();
  const m = /^test\s+([a-z0-9]{3,10})$/i.exec(t);
  if (m) return { kind: "test", code: m[1]!.toUpperCase() };
  if (/^exit$/i.test(t)) return { kind: "exit" };
  return null;
}

/** Test codes are 3–10 uppercase letters or digits (also enforced by the database). */
export function testCodeError(code: string): string | null {
  return /^[A-Z0-9]{3,10}$/.test(code) ? null : "Test code must be 3–10 letters or numbers, with no spaces.";
}

export const CLINIC_VISITOR_PREFIX = "wa_c_";
/** Short key for a clinic (uuid without dashes) so visitor ids stay under the 64-char limit. */
export function clinicVisitorKey(clinicId: string) {
  return clinicId.replace(/-/g, "");
}
export function clinicVisitorId(clinicId: string, phone: string) {
  return `${CLINIC_VISITOR_PREFIX}${clinicVisitorKey(clinicId)}_${phone}`;
}
