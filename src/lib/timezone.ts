export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "IST · India" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "Europe/London", label: "London" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
];
export function validTimezone(value: unknown): value is string {
  return typeof value === "string" && TIMEZONES.some(t => t.value === value);
}
export function formatTimestamp(value: string, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-IN", { timeZone, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZoneName: "short" }).format(new Date(value));
}
const RELATIVE_DAYS: [RegExp, number][] = [
  [/\bday after tomorrow\b/i, 2],
  [/\btomorrow\b/i, 1],
  [/\btoday\b|\btonight\b/i, 0],
];

/** Replace "today"/"tomorrow"/"day after tomorrow" with the actual date, counted from when the request was received. */
export function resolvePreferredTime(text: string, receivedAt: string, timeZone = DEFAULT_TIMEZONE) {
  for (const [pattern, offset] of RELATIVE_DAYS) {
    if (!pattern.test(text)) continue;
    const base = new Date(receivedAt);
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(base).split("-").map(Number);
    const day = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + offset, 12));
    const label = new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(day).replace(", " + parts[0], " " + parts[0]);
    return text.replace(pattern, label).replace(/\s+at\s+/i, ", ").replace(/^\s+|\s+$/g, "");
  }
  return text;
}
