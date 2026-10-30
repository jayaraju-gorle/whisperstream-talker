import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { publicTrialHistory } from "./public-clinic-demo";

const message = (role: "user" | "assistant", text: string): UIMessage => ({ id: text, role, parts: [{ type: "text", text }] });
describe("public trial isolation", () => {
  it.each(["IVY", "IYASHI", "SSK"])("removes private %s trial replies and tool context", code => {
    const last = message("user", "What are the hours?");
    expect(publicTrialHistory([message("user", `TRY ${code}`), message("assistant", "Private business details"), last])).toEqual([last]);
  });
  it("keeps hypothetical AURA trial context", () => {
    const history = [message("user", "TRY AURA"), message("assistant", "Sample reply"), message("user", "Hours?")];
    expect(publicTrialHistory(history)).toEqual(history);
  });
});