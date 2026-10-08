import { describe, expect, it } from "vitest";
import { stepError } from "./clinic";
import { IVY_PRESET } from "./clinic-presets";

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
