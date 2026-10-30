import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware: () => ({ handler: (fn: unknown) => fn }) }) }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { getClinicPresets } from "./clinic-presets.functions";
const handler = getClinicPresets as unknown as (args: { context: { userId: string; supabase: { rpc: ReturnType<typeof vi.fn> } } }) => Promise<{ label: string }[]>;
describe("real clinic preset authorization", () => {
  it("denies a signed-in non-admin", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false });
    await expect(handler({ context: { userId: "ordinary-user", supabase: { rpc } } })).rejects.toThrow("Only signed-in admins");
    expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: "ordinary-user", _role: "admin" });
  });
  it("keeps Ivy and Iyashi accessible to verified admins", async () => {
    const presets = await handler({ context: { userId: "admin-user", supabase: { rpc: vi.fn().mockResolvedValue({ data: true }) } } });
    expect(presets.map(p => p.label)).toContain("Ivy Women and Fertility Centre");
    expect(presets.map(p => p.label)).toContain("Iyashi Clinics");
  });
});