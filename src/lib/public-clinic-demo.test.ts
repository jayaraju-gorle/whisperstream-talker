import { describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";
import { parseClinicCommand } from "./clinic";
import { resolveTrial } from "./server/clinic-mode.server";

const message = (role: "user" | "assistant", text: string): UIMessage => ({ id: text, role, parts: [{ type: "text", text }] });
function fakeDb(rows: Record<string, { id: string; name: string } | null>) {
  return { from: () => {
    let code = "", id = "";
    const q = {
      select: () => q,
      eq: (col: string, v: string) => { if (col === "test_code") code = v; else id = v; return q; },
      maybeSingle: async () => ({ data: code ? rows[code] ?? null : Object.values(rows).find(r => r?.id === id) ? { id, name: "Iyashi Clinics", hours: {}, doctors: [] } : null }),
    };
    return q;
  } } as never;
}

describe("TRY business codes", () => {
  it.each([["TRY IYASHI", "IYASHI"], ["try ivy", "IVY"], ["Try Iyashi.", "IYASHI"], ["try I-Y-A-S-H-I", "IYASHI"]])("parses %s", (text, code) => {
    expect(parseClinicCommand(text)).toEqual({ kind: "try", code });
  });
  it("switches to a saved business assistant on TRY IYASHI", async () => {
    const r = await resolveTrial(fakeDb({ IYASHI: { id: "c1", name: "Iyashi Clinics" } }), [message("user", "TRY IYASHI")], "Website");
    expect(r.session?.id).toBe("c1");
    expect(r.notice).toContain("Iyashi Clinics");
  });
  it("ignores unknown codes so 'try again' stays with Mira", async () => {
    const r = await resolveTrial(fakeDb({}), [message("user", "try again")], "Website");
    expect(r.session).toBeNull();
    expect(r.notice).toBeNull();
  });
  it("EXIT returns to Mira", async () => {
    const r = await resolveTrial(fakeDb({ IVY: { id: "c2", name: "Ivy" } }), [message("user", "TRY IVY"), message("assistant", "hi"), message("user", "exit")], "Website");
    expect(r.session).toBeNull();
    expect(r.notice).toContain("Mira");
  });
});
