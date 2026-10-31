import { afterEach, describe, expect, it, vi } from "vitest";
import { nextStatus, routeMessage, typingForPayload, withWhatsAppTyping } from "./whatsapp.server";

describe("public WhatsApp demo isolation", () => {
  it("shares the current editable Aura map only to the initiating WhatsApp conversation", async () => {
    const url = "https://www.google.com/maps/search/?api=1&query=Hyderabad";
    const eq = vi.fn().mockReturnThis();
    const chain = { eq, maybeSingle: vi.fn().mockResolvedValue({ data: { map_url: url }, error: null }) };
    const from = vi.fn((table: string) => table === "clinics"
      ? { select: vi.fn().mockReturnValue(chain) }
      : { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) });
    const result = await routeMessage({ from } as unknown as Parameters<typeof routeMessage>[0], "919999999999", "AURA MAP");
    expect(eq).toHaveBeenCalledWith("id", "ddba5e0f-a003-4d8b-9af6-339712f5564e");
    expect(result.text).toContain(url);
    expect(result.text).toContain("not a real Aura clinic listing");
  });
  it("does not invent a map when Aura has no saved link", async () => {
    const chain = { eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { map_url: "" } }) };
    const from = vi.fn((table: string) => table === "clinics"
      ? { select: vi.fn().mockReturnValue(chain) }
      : { delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) });
    const result = await routeMessage({ from } as unknown as Parameters<typeof routeMessage>[0], "919999999999", "AURA MAP");
    expect(result.text).toContain("isn't available");
    expect(result.text).not.toContain("https://");
  });
  it.each(["TRY IVY", "TRY IYASHI", "Hours?"])("never loads a real clinic for %s and clears old routing", async body => {
    const eq = vi.fn().mockResolvedValue({});
    const remove = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: remove });
    const result = await routeMessage({ from } as unknown as Parameters<typeof routeMessage>[0], "919999999999", body);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("clinic_whatsapp_sessions");
    expect(remove).toHaveBeenCalledTimes(1);
    expect(eq).toHaveBeenCalledWith("phone", "919999999999");
    expect(result).not.toHaveProperty("clinic");
  });
});

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
