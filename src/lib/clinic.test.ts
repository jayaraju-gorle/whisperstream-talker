import { describe, expect, it } from "vitest";
import { clinicKnowledge, emptyClinic, parseClinicCommand, stepError } from "./clinic";

describe("clinic onboarding", () => {
  it("requires a name and phone on the details step", () => {
    expect(stepError(0, emptyClinic())).toBe("Add the clinic name.");
    expect(stepError(0, { ...emptyClinic(), name: "Sunrise" })).toBe("Add the appointments phone number.");
  });
  it("rejects closing before opening", () => {
    const c = emptyClinic();
    c.hours[0] = { day: "Monday", open: true, from: "18:00", to: "09:00" };
    expect(stepError(1, c)).toBe("Monday: closing time must be after opening time.");
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
  });
});
