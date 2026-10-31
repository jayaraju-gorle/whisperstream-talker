import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TIMEZONE, formatTimestamp } from "./timezone";

const db = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), order: vi.fn(), limit: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: db.from } }));
import { fetchPlaygroundSessions } from "./playground-sessions";

describe("Playground session history", () => {
  it("reads playground sessions and their turns, not Assistant live replies", async () => {
    const sessions = [{ id: "session-1", turns: [{ metrics: { v2vMs: 710 } }] }];
    db.from.mockReturnValue({ select: db.select });
    db.select.mockReturnValue({ order: db.order });
    db.order.mockReturnValue({ limit: db.limit });
    db.limit.mockResolvedValue({ data: sessions, error: null });
    expect(await fetchPlaygroundSessions()).toEqual(sessions);
    expect(db.from.mock.calls).toEqual([["conversations"]]);
    expect(db.select).toHaveBeenCalledWith("id,title,mode,compare,created_at,turns(metrics)");
  });
  it("defaults session timestamps to IST", () => {
    expect(DEFAULT_TIMEZONE).toBe("Asia/Kolkata");
    expect(formatTimestamp("2026-10-31T01:53:00Z")).toContain("07:23:00 am IST");
  });
  it("allows a different timezone without changing the session instant", () => {
    expect(formatTimestamp("2026-10-31T01:53:00Z", "UTC")).toContain("01:53:00 am UTC");
  });
});