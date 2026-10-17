import { describe, expect, it } from "vitest";
import { defaultHours } from "./clinic";
import { callSettingsError, toCallSettings } from "./business-call-settings";

describe("business call settings", () => {
  it("defaults calls off and uses the business working hours", () => {
    const s = toCallSettings({}, defaultHours());
    expect(s.enabled).toBe(false);
    expect(s.use_business_hours).toBe(true);
    expect(s.hours).toEqual(defaultHours());
  });
  it("restores the call switch, forwarding number, greeting and working hours", () => {
    const saved = { ...toCallSettings({}, defaultHours()), enabled: true, forwarding_number: "+918639628613", voice_greeting: "Welcome to SSK & Associates.", use_business_hours: false };
    expect(toCallSettings(JSON.parse(JSON.stringify(saved)), defaultHours())).toEqual(saved);
    expect(callSettingsError(saved)).toBeNull();
  });
  it("rejects a forwarding number without country code", () => {
    expect(callSettingsError({ ...toCallSettings({}, defaultHours()), forwarding_number: "8639628613" })).not.toBeNull();
  });
  it("rejects overlapping custom call hours", () => {
    const s = toCallSettings({}, defaultHours());
    s.use_business_hours = false;
    s.hours = s.hours.map((h, i) => i === 0 ? { ...h, slots: [{ from: "10:00", to: "15:00" }, { from: "14:00", to: "19:00" }] } : h);
    expect(callSettingsError(s)).toBe("Monday: time slots overlap.");
  });
});