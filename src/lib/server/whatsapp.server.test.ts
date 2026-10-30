import { afterEach, describe, expect, it, vi } from "vitest";
import { nextStatus, typingForPayload, withWhatsAppTyping } from "./whatsapp.server";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function mockTyping() {
  vi.stubEnv("LOVABLE_API_KEY", "test-gateway");
  vi.stubEnv("WHATSAPP_API_KEY", "test-connection");
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"success":true}'));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("WhatsApp typing lifecycle", () => {
  it("shows native typing immediately for a signed inbound payload", async () => {
    const fetchMock = mockTyping();
    await typingForPayload({ entry: [{ changes: [{ value: { messages: [{ id: "wamid.incoming" }] } }] }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({
      messaging_product: "whatsapp", status: "read", message_id: "wamid.incoming", typing_indicator: { type: "text" },
    });
  });
  it("refreshes typing during the first reply and stops after sending", async () => {
    vi.useFakeTimers();
    const fetchMock = mockTyping();
    let finish: ((value: string) => void) | undefined;
    const result = withWhatsAppTyping("wamid.first", () => new Promise<string>((resolve) => { finish = resolve; }));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    finish?.("sent");
    expect(await result).toBe("sent");
    await vi.advanceTimersByTimeAsync(40_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("stops refreshing if generation fails", async () => {
    vi.useFakeTimers();
    const fetchMock = mockTyping();
    await expect(withWhatsAppTyping("wamid.failed", async () => { throw new Error("model failed"); })).rejects.toThrow("model failed");
    await vi.advanceTimersByTimeAsync(40_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("keeps replies available when typing requests fail", async () => {
    mockTyping().mockRejectedValue(new Error("unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await withWhatsAppTyping("wamid.reply", async () => "reply sent")).toBe("reply sent");
    log.mockRestore();
  });
});

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
