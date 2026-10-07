type Message = { id: string; direction: string; conversation_id: string | null; created_at: string };
export type WhatsAppTurnMetrics = {
  id: string; conversation_id: string | null; channel: string; model: string;
  first_token_ms: number | null; total_ms: number; ok: boolean; created_at: string;
};

/** Legacy logs precede the outbound save: match by conversation and completion time, never array position. */
export function matchWhatsAppMetrics(messages: Message[], logs: WhatsAppTurnMetrics[]) {
  const matched = new Map<string, WhatsAppTurnMetrics>();
  const used = new Set<string>();
  const previousReply = new Map<string, number>();
  const orderedLogs = [...logs].filter((log) => log.ok && log.channel === "WhatsApp")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const replies = messages.filter((message) => message.direction === "out")
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  for (const message of replies) {
    if (!message.conversation_id) continue;
    const sentAt = Date.parse(message.created_at);
    const previous = previousReply.get(message.conversation_id) ?? -Infinity;
    const log = orderedLogs.find((candidate) => {
      const completedAt = Date.parse(candidate.created_at);
      return candidate.conversation_id === message.conversation_id && !used.has(candidate.id)
        && completedAt > previous && completedAt <= sentAt && sentAt - completedAt <= 60_000;
    });
    if (log) {
      matched.set(message.id, log);
      used.add(log.id);
    }
    previousReply.set(message.conversation_id, sentAt);
  }
  return matched;
}