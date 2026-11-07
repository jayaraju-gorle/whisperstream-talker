type TextPart = { type?: string; text?: string };
type StoredMessage = { parts?: TextPart[]; content?: unknown };

export function messageText(message: StoredMessage | null | undefined): string {
  if (!message) return "";
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return typeof message.content === "string" ? message.content.replace(/\s+/g, " ").trim() : "";
}

export function latestMessagePreview(messages: unknown, max = 180): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const text = messageText(messages[i] as StoredMessage);
    if (text) return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }
  return "";
}

export function calendarDay(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

/** True when the stored conversation began on an earlier calendar day in `timeZone`. */
export function startedOnEarlierDay(createdAt: string, now: Date, timeZone: string): boolean {
  const then = new Date(createdAt);
  if (Number.isNaN(then.getTime())) return false;
  return calendarDay(then, timeZone) < calendarDay(now, timeZone);
}

export type ConversationSort = "activity-desc" | "activity-asc" | "started-desc" | "started-asc";
export type ActivityWindow = "all" | "today" | "yesterday" | "7d" | "30d";
export type ContactFilter = "all" | "with-lead" | "visitors";

type Dated = { id: string; created_at: string; updated_at: string };

function dayIndex(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000;
}

/** Whole calendar days from `iso` until `now` in `timeZone`. Negative when `iso` is still in the future. */
export function daysSince(iso: string, now: Date, timeZone: string): number | null {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return dayIndex(calendarDay(now, timeZone)) - dayIndex(calendarDay(then, timeZone));
}

export function matchesActivityWindow(iso: string, window: ActivityWindow, now: Date, timeZone: string): boolean {
  if (window === "all") return true;
  const days = daysSince(iso, now, timeZone);
  if (days == null || days < 0) return false;
  if (window === "today") return days === 0;
  if (window === "yesterday") return days === 1;
  if (window === "7d") return days <= 6;
  return days <= 29;
}

export function sortConversations<T extends Dated>(rows: T[], sort: ConversationSort): T[] {
  const newestFirst = sort.endsWith("desc");
  const key = sort.startsWith("started") ? "created_at" : "updated_at";
  return [...rows].sort((a, b) => {
    const compared = a[key].localeCompare(b[key]);
    if (compared !== 0) return newestFirst ? -compared : compared;
    return newestFirst ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
  });
}

export type ConversationPage<T> = {
  items: T[];
  total: number;
  matched: number;
  page: number;
  pages: number;
  from: number;
  to: number;
};

export function viewConversations<T extends Dated>(
  rows: T[],
  options: {
    sort: ConversationSort;
    window: ActivityWindow;
    contact: ContactFilter;
    query: string;
    page: number;
    pageSize: number;
    now: Date;
    timeZone: string;
    hasLead: (row: T) => boolean;
    searchText: (row: T) => string;
  },
): ConversationPage<T> {
  const query = options.query.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (!matchesActivityWindow(row.updated_at, options.window, options.now, options.timeZone)) return false;
    const lead = options.hasLead(row);
    if (options.contact === "with-lead" && !lead) return false;
    if (options.contact === "visitors" && lead) return false;
    if (query && !options.searchText(row).toLowerCase().includes(query)) return false;
    return true;
  });
  const sorted = sortConversations(filtered, options.sort);
  const pageSize = Math.max(1, options.pageSize);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(0, options.page), pages - 1);
  const start = sorted.length === 0 ? 0 : page * pageSize;
  const items = sorted.slice(start, start + pageSize);
  return {
    items,
    total: rows.length,
    matched: sorted.length,
    page,
    pages,
    from: sorted.length === 0 ? 0 : start + 1,
    to: start + items.length,
  };
}

export function visiblePages(page: number, pages: number, width = 5): number[] {
  if (pages <= 0) return [];
  const start = Math.max(0, Math.min(page - Math.floor(width / 2), pages - width));
  const end = Math.min(pages, start + width);
  return Array.from({ length: end - start }, (_, index) => start + index);
}
