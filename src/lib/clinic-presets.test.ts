import { describe, expect, it } from "vitest";
import { stepError } from "./clinic";
import { IVY_PRESET, IYASHI_PRESET, SSK_PRESET } from "./clinic-presets";

describe("Ivy Women and Fertility Centre preset", () => {
  it("passes every wizard validation step", () => {
    expect(stepError(0, IVY_PRESET)).toBeNull();
    expect(stepError(1, IVY_PRESET)).toBeNull();
    expect(stepError(2, IVY_PRESET)).toBeNull();
  });

  it("carries the client's split hours", () => {
    const mon = IVY_PRESET.hours.find((h) => h.day === "Monday");
    expect(mon).toEqual({ day: "Monday", open: true, slots: [{ from: "10:00", to: "15:00" }, { from: "17:00", to: "20:00" }] });
    const sun = IVY_PRESET.hours.find((h) => h.day === "Sunday");
    expect(sun).toEqual({ day: "Sunday", open: true, slots: [{ from: "10:00", to: "14:00" }] });
  });

  it("lists all five doctors with a fee each", () => {
    const names = IVY_PRESET.doctors.map((d) => d.name);
    expect(names).toEqual([
      "Dr. Bharathi Sudha A",
      "Dr. Sravya Buggana",
      "Dr. Bharath Chidige",
      "Dr. Havisha",
      "Dr. Harish Chandra Reddy",
    ]);
    expect(IVY_PRESET.doctors.every((d) => d.fee.trim() && d.name.trim())).toBe(true);
  });
});

describe("Iyashi Clinics preset", () => {
  it("passes every wizard validation step", () => {
    expect(stepError(0, IYASHI_PRESET)).toBeNull();
    expect(stepError(1, IYASHI_PRESET)).toBeNull();
    expect(stepError(2, IYASHI_PRESET)).toBeNull();
  });

  it("carries the confirmed hours: Mon–Sat 10:00–21:00, Sunday closed", () => {
    const mon = IYASHI_PRESET.hours.find((h) => h.day === "Monday");
    expect(mon).toEqual({ day: "Monday", open: true, slots: [{ from: "10:00", to: "21:00" }] });
    const sat = IYASHI_PRESET.hours.find((h) => h.day === "Saturday");
    expect(sat).toEqual({ day: "Saturday", open: true, slots: [{ from: "10:00", to: "21:00" }] });
    const sun = IYASHI_PRESET.hours.find((h) => h.day === "Sunday");
    expect(sun?.open).toBe(false);
  });

  it("lists both doctors with their ₹800 fees", () => {
    const names = IYASHI_PRESET.doctors.map((d) => d.name);
    expect(names).toEqual(["Dr. Chaitra Rachamalla", "Dr. S.V.S. Yashwant"]);
    expect(IYASHI_PRESET.doctors.every((d) => d.fee === "₹800")).toBe(true);
  });

  it("carries the confirmed phone and address", () => {
    expect(IYASHI_PRESET.phone).toBe("+91 78429 57575");
    expect(IYASHI_PRESET.address).toContain("Madhapur, Hyderabad, Telangana 500081");
  });
  it("includes both clinics' Google Maps links", () => {
    expect(IVY_PRESET.map_url).toBe("https://maps.app.goo.gl/iy6xNvqdDzBdanBs6");
    expect(IYASHI_PRESET.map_url).toBe("https://maps.app.goo.gl/g3yRGnthyvs82pAD6");
  });
});

describe("SSK & Associates preset", () => {
  it("passes every wizard validation step", () => {
    expect(stepError(0, SSK_PRESET)).toBeNull();
    expect(stepError(1, SSK_PRESET)).toBeNull();
    expect(stepError(2, SSK_PRESET)).toBeNull();
  });

  it("is open Mon–Sat 10:00–19:00 and closed Sunday", () => {
    expect(SSK_PRESET.hours.find((h) => h.day === "Monday")).toEqual({ day: "Monday", open: true, slots: [{ from: "10:00", to: "19:00" }] });
    expect(SSK_PRESET.hours.find((h) => h.day === "Saturday")).toEqual({ day: "Saturday", open: true, slots: [{ from: "10:00", to: "19:00" }] });
    expect(SSK_PRESET.hours.find((h) => h.day === "Sunday")?.open).toBe(false);
  });

  it("carries the confirmed contact details and ₹500 fee", () => {
    expect(SSK_PRESET.name).toBe("SSK & Associates");
    expect(SSK_PRESET.phone).toBe("+91 86396 28613");
    expect(SSK_PRESET.email).toBe("Sasumana.saikumar@gmail.com");
    expect(SSK_PRESET.address).toBe("Kakatiya Hills, Madhapur, Hyderabad – 500081");
    expect(SSK_PRESET.doctors).toHaveLength(1);
    expect(SSK_PRESET.doctors[0]?.name).toBe("CA Sasumana Saikumar");
    expect(SSK_PRESET.doctors[0]?.fee).toBe("₹500");
  });
});
