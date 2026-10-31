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