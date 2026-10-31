/** Clock formatting for assistant facts; editable time inputs remain 24-hour. */
export function assistantClock(time: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return time;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}

export const ASSISTANT_SPEECH_RULES = `Use natural 12-hour times: 1:00 PM is "one PM", 5:00 PM is "five PM", 10:30 AM is "ten thirty AM", and 8:00 PM is "eight PM". Never say thirteen hundred, seventeen hundred, or military-time numbers. Do not read URLs or markdown aloud. For directions, give a short address and offer the WhatsApp map handoff; never claim a WhatsApp message was sent without a verified send result.`;