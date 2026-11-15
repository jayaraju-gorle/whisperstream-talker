import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { parseClinicCommand } from "./clinic";
import { PUBLIC_CLINIC_CODE, PUBLIC_SAMPLE_BUSINESS_ID } from "./public-clinic-demo";
import { resolveTrial } from "./server/clinic-mode.server";

const message = (role: "user" | "assistant", text: string): UIMessage => ({
  id: text,
  role,
  parts: [{ type: "text", text }],
});
function fakeDb(
  rows: Record<string, { id: string; name: string } | null>,
  demoBusinessId: string | null = null,
) {
  return {
    from: (table: string) => {
      let code = "",
        id = "";
      const q = {
        select: () => q,
        eq: (col: string, v: string) => {
          if (col === "test_code") code = v;
          else id = v;
          return q;
        },
        maybeSingle: async () => {
          if (table === "app_settings")
            return {
              data: demoBusinessId ? { value: { clinic_id: demoBusinessId } } : null,
              error: null,
            };
          const row = code
            ? rows[code]
            : Object.values(rows).find((business) => business?.id === id);
          return { data: row ? { ...row, hours: {}, doctors: [] } : null, error: null };
        },
      };
      return q;
    },
  } as never;
}

describe("TRY business codes", () => {
  it.each([
    ["TRY IYASHI", "IYASHI"],
    ["try ivy", "IVY"],
    ["Try Iyashi.", "IYASHI"],
    ["try I-Y-A-S-H-I", "IYASHI"],
  ])("parses %s", (text, code) => {
    expect(parseClinicCommand(text)).toEqual({ kind: "try", code });
  });
  it("switches to a saved business assistant on TRY IYASHI", async () => {
    const r = await resolveTrial(
      fakeDb({ IYASHI: { id: "c1", name: "Iyashi Clinics" } }),
      [message("user", "TRY IYASHI")],
      "Website",
    );
    expect(r.session?.id).toBe("c1");
    expect(r.notice).toContain("Iyashi Clinics");
  });
  it("ignores unknown codes so 'try again' stays with Mira", async () => {
    const r = await resolveTrial(fakeDb({}), [message("user", "try again")], "Website");
    expect(r.session).toBeNull();
    expect(r.notice).toBeNull();
  });
  it("EXIT returns to Mira", async () => {
    const r = await resolveTrial(
      fakeDb({ IVY: { id: "c2", name: "Ivy" } }),
      [message("user", "TRY IVY"), message("assistant", "hi"), message("user", "exit")],
      "Website",
    );
    expect(r.session).toBeNull();
    expect(r.notice).toContain("Mira");
  });
});

describe("admin-selected public demo business", () => {
  it.each(["Website", "WhatsApp"] as const)(
    "starts %s with Iyashi when its switch is on",
    async (channel) => {
      const r = await resolveTrial(
        fakeDb({ IYASHI: { id: "c1", name: "Iyashi Clinics" } }, "c1"),
        [message("user", "What are your hours?")],
        channel,
      );
      expect(r.session?.id).toBe("c1");
      expect(r.session?.name).toBe("Iyashi Clinics");
      expect(r.notice).toBeNull();
    },
  );
  it("uses Aura when every business switch is off", async () => {
    const r = await resolveTrial(
      fakeDb({ IYASHI: { id: "c1", name: "Iyashi Clinics" } }),
      [message("user", "What are your hours?")],
      "Website",
    );
    expect(r.session).toBeNull();
  });
  it("lets an explicit TRY code override the selected default", async () => {
    const db = fakeDb(
      { IYASHI: { id: "c1", name: "Iyashi Clinics" }, IVY: { id: "c2", name: "Ivy" } },
      "c1",
    );
    const r = await resolveTrial(db, [message("user", "TRY IVY")], "Website");
    expect(r.session?.id).toBe("c2");
  });
  it("EXIT restores Aura even while Iyashi is the selected default", async () => {
    const db = fakeDb({ IYASHI: { id: "c1", name: "Iyashi Clinics" } }, "c1");
    const r = await resolveTrial(db, [message("user", "exit")], "WhatsApp");
    expect(r.session).toBeNull();
    expect(r.notice).toContain("Mira");
  });
  it(`TRY ${PUBLIC_CLINIC_CODE} restores Aura even while Iyashi is the selected default`, async () => {
    const db = fakeDb({ IYASHI: { id: "c1", name: "Iyashi Clinics" } }, "c1");
    const r = await resolveTrial(db, [message("user", `TRY ${PUBLIC_CLINIC_CODE}`)], "Website");
    expect(r.session).toBeNull();
    expect(r.notice).toContain("Aura Health Clinic");
  });
  it("treats Aura's own saved id as the regular sample", async () => {
    const r = await resolveTrial(
      fakeDb({}, PUBLIC_SAMPLE_BUSINESS_ID),
      [message("user", "Hello")],
      "Website",
    );
    expect(r.session).toBeNull();
  });
});
