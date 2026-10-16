import { describe, expect, it } from "vitest";
import { DAYS, toClinicInput, clinicKnowledge, clinicPrompt, clinicVisitorId, emptyClinic, parseClinicCommand, receptionistAudience, stepError, testCodeError } from "./clinic";

describe("clinic onboarding", () => {
  it("uses the client audience for SSK and CA/tax firms, not medical practices", () => {
    expect(receptionistAudience("SSK & Associates")).toBe("client");
    expect(receptionistAudience("Example Chartered Accountants")).toBe("client");
    expect(receptionistAudience("Example Tax Advisory")).toBe("client");
    expect(receptionistAudience("Example & Associates", [{name: "CA Example", specialty: "", days: "", fee: "500"}])).toBe("client");
    expect(receptionistAudience("Ivy Women and Fertility Centre")).toBe("patient");
    expect(receptionistAudience("Iyashi Clinics")).toBe("patient");
  });
  it("requires a name and phone on the details step", () => {
    expect(stepError(0, emptyClinic())).toBe("Add the clinic name.");
    expect(stepError(0, { ...emptyClinic(), name: "Sunrise" })).toBe("Add the appointments phone number.");
  });
  it("rejects closing before opening", () => {
    const c = emptyClinic();
    c.hours[0] = { day: "Monday", open: true, slots: [{ from: "18:00", to: "09:00" }] };
    expect(stepError(1, c)).toBe("Monday: closing time must be after opening time.");
  });
  it("supports split shifts and rejects overlaps", () => {
    const c = emptyClinic();
    c.hours[0] = { day: "Monday", open: true, slots: [{ from: "10:00", to: "15:00" }, { from: "17:00", to: "20:00" }] };
    expect(stepError(1, c)).toBeNull();
    expect(clinicKnowledge({ ...c, name: "S", phone: "1" })).toContain("Monday: 10:00 – 15:00, 17:00 – 20:00");
    c.hours[0]!.slots[1] = { from: "14:00", to: "20:00" };
    expect(stepError(1, c)).toBe("Monday: time slots overlap.");
  });
  it("reads older single-range hours", () => {
    const hours = DAYS.map((day) => ({ day, open: true, from: "09:00", to: "17:00" }));
    expect(toClinicInput({ hours }).hours[0]!.slots).toEqual([{ from: "09:00", to: "17:00" }]);
  });
  it("requires a fee for every doctor", () => {
    const c = { ...emptyClinic(), doctors: [{ name: "Dr. Rao", specialty: "", days: "", fee: "" }] };
    expect(stepError(2, c)).toBe("Add a consultation fee for every doctor.");
  });
  it("puts hours and fees into the receptionist knowledge", () => {
    const c = { ...emptyClinic(), name: "Sunrise", phone: "123", doctors: [{ name: "Dr. Rao", specialty: "Ortho", days: "Mon", fee: "₹900" }] };
    const kb = clinicKnowledge(c);
    expect(kb).toContain("Sunday: Closed");
    expect(kb).toContain("Dr. Rao (Ortho) — Mon. Fee: ₹900.");
  });
  it("parses WhatsApp test and exit commands", () => {
    expect(parseClinicCommand(" test ab12cd ")).toEqual({ kind: "test", code: "AB12CD" });
    expect(parseClinicCommand("EXIT")).toEqual({ kind: "exit" });
    expect(parseClinicCommand("test me please")).toBeNull();
    expect(parseClinicCommand("test ivy")).toEqual({ kind: "test", code: "IVY" });
    expect(parseClinicCommand("TEST Iyashi")).toEqual({ kind: "test", code: "IYASHI" });
    expect(parseClinicCommand("test ab")).toBeNull();
  });
  it("validates test codes as 3-10 uppercase letters or digits", () => {
    expect(testCodeError("IVY")).toBeNull();
    expect(testCodeError("IVYCLINIC1")).toBeNull();
    expect(testCodeError("IV")).not.toBeNull();
    expect(testCodeError("IVYCLINIC12")).not.toBeNull();
    expect(testCodeError("IVY 2")).not.toBeNull();
  });
  it("keeps clinic WhatsApp visitor ids under the 64-character limit", () => {
    const id = clinicVisitorId("3f6b2a1c-9d4e-4f5a-8b7c-1d2e3f4a5b6c", "916302392274");
    expect(id).toBe("wa_c_3f6b2a1c9d4e4f5a8b7c1d2e3f4a5b6c_916302392274");
    expect(id.length).toBeLessThanOrEqual(64);
  });
  it("keeps the Google Maps link and puts it in knowledge and prompt", () => {
    const url = "https://maps.app.goo.gl/abc";
    expect(toClinicInput({ map_url: url }).map_url).toBe(url);
    expect(clinicKnowledge({ ...emptyClinic(), name: "S", phone: "1", map_url: url })).toContain(`- Google Maps / Directions: ${url}`);
    expect(clinicPrompt("S")).toContain("Google Maps");
  });
});
