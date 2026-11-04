import { describe, expect, it } from "vitest";
import { latestMessagePreview, messageText, sortConversations, startedOnEarlierDay, viewConversations, visiblePages } from "./web-conversations";

describe("web conversation list", () => {
  it("reads the latest saved line, including older content-only messages", () => {
    expect(messageText({ content: "Hello from yesterday" })).toBe("Hello from yesterday");
    expect(
      latestMessagePreview([
        { role: "user", parts: [{ type: "text", text: "Older question" }] },
        { role: "assistant", parts: [{ type: "text", text: "Yesterday's reply" }] },
      ]),
    ).toBe("Yesterday's reply");
  });

  it("treats a 31 Oct thread as older than a 4 Nov visit in IST", () => {
    const now = new Date("2026-11-04T01:47:00Z");
    expect(startedOnEarlierDay("2026-10-31T17:56:55Z", now, "Asia/Kolkata")).toBe(true);
    expect(startedOnEarlierDay("2026-11-03T16:55:49Z", now, "Asia/Kolkata")).toBe(true);
    expect(startedOnEarlierDay("2026-11-03T18:40:00Z", now, "Asia/Kolkata")).toBe(false);
  });

  it("keeps the visitor who just wrote above an older chat that started later", () => {
    const rows = [
      { id: "started-yesterday", created_at: "2026-11-03T16:55:49Z", updated_at: "2026-11-03T16:55:52Z" },
      { id: "continued-today", created_at: "2026-10-31T17:56:55Z", updated_at: "2026-11-04T01:40:57Z" },
    ];
    expect(sortConversations(rows, "activity-desc").map((row) => row.id)).toEqual(["continued-today", "started-yesterday"]);
    expect(sortConversations(rows, "started-desc").map((row) => row.id)).toEqual(["started-yesterday", "continued-today"]);
  });

  it("searches, filters to yesterday, and pages the matches", () => {
    const now = new Date("2026-11-04T02:00:00Z");
    const rows = [
      { id: "today", created_at: "2026-11-04T01:00:00Z", updated_at: "2026-11-04T01:10:00Z", text: "clinic hours" },
      { id: "yesterday-a", created_at: "2026-11-03T16:00:00Z", updated_at: "2026-11-03T16:05:00Z", text: "book a demo" },
      { id: "yesterday-b", created_at: "2026-11-03T15:00:00Z", updated_at: "2026-11-03T15:05:00Z", text: "pricing" },
    ];
    const page = viewConversations(rows, {
      sort: "activity-desc",
      window: "yesterday",
      contact: "all",
      query: "book",
      page: 0,
      pageSize: 15,
      now,
      timeZone: "Asia/Kolkata",
      hasLead: () => false,
      searchText: (row) => row.text,
    });
    expect(page.matched).toBe(1);
    expect(page.items.map((row) => row.id)).toEqual(["yesterday-a"]);
    expect(page.from).toBe(1);
    expect(visiblePages(0, 1)).toEqual([0]);
    expect(visiblePages(4, 10)).toEqual([2, 3, 4, 5, 6]);
  });
});
