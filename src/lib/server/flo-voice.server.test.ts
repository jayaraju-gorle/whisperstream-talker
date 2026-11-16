import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), resolveTrial: vi.fn() }));
vi.mock("@/lib/server/clinic-mode.server", () => ({ resolveTrial: mocks.resolveTrial }));
vi.mock("@/lib/server/public-clinic.server", () => ({ publicAssistantInstructions: async () => "Fictional Aura sample instructions" }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/server/assistant-handler.server", () => ({ handleAssistantPost: vi.fn() }));
import { createFloVoice } from "./flo-voice.server";
describe("public voice isolation", () => {
  it("resumes saved TRY business history so voice continues the same assistant", async () => {
    mocks.resolveTrial.mockResolvedValue({ session: { name: "Iyashi Clinics", instructions: "Iyashi verified business facts" } });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { messages: [
      { role: "user", parts: [{ type: "text", text: "TRY IVY" }] },
      { role: "assistant", parts: [{ type: "text", text: "Private clinic details" }] },
    ] } }) });
    const voice = await createFloVoice("visitor_1234567890123456", "voice-check");
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("assistant_conversations");
    expect(voice.history.some(m => m.role === "assistant")).toBe(true);
    expect(mocks.resolveTrial).toHaveBeenCalledWith(expect.anything(), voice.history, "Website");
    expect(voice.persona).toContain("Iyashi verified business facts");
    expect(voice.persona).not.toContain("Fictional Aura sample instructions");
  });
  it("keeps the hypothetical sample facts when no specific business is active", async () => {
    mocks.resolveTrial.mockResolvedValue({ session: null });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { messages: [] } }) });
    const voice = await createFloVoice("visitor_1234567890123456", "voice-default");
    expect(voice.persona).toContain("Fictional Aura sample instructions");
  });
});