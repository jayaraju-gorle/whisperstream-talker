import { describe, expect, it, vi } from "vitest";
import { loadClinicConversations } from "./portal-conversations.server";

describe("loadClinicConversations", () => {
  it("loads appointment and non-appointment conversations scoped to the clinic across channels", async () => {
    const clinicId = "11111111-1111-4111-8111-111111111111";
    const key = clinicId.replace(/-/g, "");
    const otherClinicId = "22222222-2222-4222-8222-222222222222";

    const assistantRows = [
      {
        id: "wa-inquiry",
        visitor_id: "whatsapp_+919876543210",
        updated_at: "2026-11-20T12:00:00Z",
        messages: [
          { id: "m1", role: "user", parts: [{ type: "text", text: "TRY HANVI" }] },
          { id: "m2", role: "user", parts: [{ type: "text", text: "What are your timings?" }] },
          {
            id: "m3",
            role: "assistant",
            parts: [{ type: "text", text: "We are open 11 AM to 8 PM daily." }],
          },
        ],
      },
      {
        id: "web-booked",
        visitor_id: `web_c_${key}_abcdef1234567890`,
        updated_at: "2026-11-20T11:00:00Z",
        messages: [
          { id: "w1", role: "user", parts: [{ type: "text", text: "Book tomorrow 5pm" }] },
          {
            id: "w2",
            role: "assistant",
            parts: [
              { type: "tool-request_appointment", state: "output-available", output: { ok: true } },
              { type: "text", text: "Your appointment request is noted." },
            ],
          },
        ],
      },
      {
        id: "phone-inquiry",
        visitor_id: "bolna_call_123",
        updated_at: "2026-11-20T10:00:00Z",
        messages: [
          { id: "p1", role: "user", parts: [{ type: "text", text: "TRY HANVI" }] },
          { id: "p2", role: "user", parts: [{ type: "text", text: "Do you do implants?" }] },
          { id: "p3", role: "assistant", parts: [{ type: "text", text: "Yes, we do implants." }] },
        ],
      },
      {
        id: "other-clinic",
        visitor_id: "whatsapp_+919000000000",
        updated_at: "2026-11-20T09:00:00Z",
        messages: [
          { id: "o1", role: "user", parts: [{ type: "text", text: "TRY OTHER" }] },
          { id: "o2", role: "user", parts: [{ type: "text", text: "Hello" }] },
        ],
      },
    ];

    const from = vi.fn((table: string) => {
      if (table === "app_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: { value: { clinic_id: otherClinicId } } })),
        };
      }
      if (table === "assistant_conversations") {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn(async () => ({ data: assistantRows, error: null })),
        };
      }
      if (table === "conversations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn(async () => ({ data: [], error: null })),
        };
      }
      if (table === "phone_call_links") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn(async () => ({
            data: [{ visitor_id: "bolna_call_123", phone: "+919111222333" }],
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await loadClinicConversations({ from } as never, {
      id: clinicId,
      testCode: "HANVI",
    });

    expect(result).toHaveLength(3);
    expect(result.map((c) => [c.id, c.channel, c.contact, c.hasAppointment])).toEqual([
      ["wa-inquiry", "WhatsApp", "+919876543210", false],
      ["web-booked", "Browser", "Website visitor", true],
      ["phone-inquiry", "Phone", "+919111222333", false],
    ]);
    expect(result[0]?.messages).toHaveLength(2);
    expect(result[0]?.preview).toBe("What are your timings?");
  });
});
