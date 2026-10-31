import { describe, expect, it, vi } from "vitest";
import { PUBLIC_SAMPLE_BUSINESS_ID, publicAssistantInstructions } from "./public-clinic.server";
describe("editable public Aura sample", () => {
  it("uses only the designated sample row and reflects saved fees without old hard-coded facts", async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Aura Health Clinic", doctors: [{ name: "Dr. Sample", specialty: "Family care", days: "Monday", fee: "₹950" }] } }) };
    const from = vi.fn().mockReturnValue(chain);
    const instructions = await publicAssistantInstructions({ from } as unknown as Parameters<typeof publicAssistantInstructions>[0]);
    expect(chain.eq).toHaveBeenCalledWith("id", PUBLIC_SAMPLE_BUSINESS_ID);
    expect(from).toHaveBeenCalledWith("clinics");
    expect(instructions).toContain("₹950");
    expect(instructions).not.toContain("₹600");
    expect(instructions).toContain("Never claim a real booking or save patient appointments");
  });
  it("never substitutes another business if the sample is missing", async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null }) };
    const from = vi.fn().mockReturnValue(chain);
    expect(await publicAssistantInstructions({ from } as unknown as Parameters<typeof publicAssistantInstructions>[0])).toContain("Aura Health Clinic");
    expect(from).toHaveBeenCalledTimes(1);
  });
});