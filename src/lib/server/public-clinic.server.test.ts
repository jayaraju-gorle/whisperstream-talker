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
  it("includes the saved Google Maps link with hypothetical-directions safeguards", async () => {
    const map_url = "https://www.google.com/maps/search/?api=1&query=Hyderabad%2C%20Telangana%2C%20India";
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Aura Health Clinic", map_url, notes: "Illustrative Hyderabad city location only; not a real Aura clinic listing." } }) };
    const instructions = await publicAssistantInstructions({ from: vi.fn().mockReturnValue(chain) } as unknown as Parameters<typeof publicAssistantInstructions>[0]);
    expect(instructions).toContain(map_url);
    expect(instructions).toContain("Illustrative Hyderabad city location only");
    expect(instructions).toContain("including any contact details or directions");
    expect(instructions).not.toContain("No real directions, map");
  });
});