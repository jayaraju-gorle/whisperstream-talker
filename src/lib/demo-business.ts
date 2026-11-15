export const DEMO_BUSINESS_SETTING_KEY = "public_demo_business";

/** The single saved business used by every public channel when no TRY/EXIT override is active. */
export function parseDemoBusinessId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const id = (value as { clinic_id?: unknown }).clinic_id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}
