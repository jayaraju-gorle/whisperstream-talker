import { describe, expect, it } from "vitest";
import { nextStatus } from "./whatsapp.server";

describe("WhatsApp delivery status ordering", () => {
  it("an older sent callback never overwrites delivered or read", () => {
    expect(nextStatus("delivered", "sent")).toBe("delivered");
    expect(nextStatus("read", "delivered")).toBe("read");
  });
  it("advances accepted to sent and delivered", () => {
    expect(nextStatus("accepted", "sent")).toBe("sent");
    expect(nextStatus("sent", "delivered")).toBe("delivered");
  });
  it("failure applies before delivery but not after", () => {
    expect(nextStatus("sent", "failed")).toBe("failed");
    expect(nextStatus("read", "failed")).toBe("read");
  });
});
