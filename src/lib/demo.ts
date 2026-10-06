import { computeCost, type AgentConfig } from "./catalog";
import { activeKbIds, retrievePassages, scenarioSample, type CustomScenario, type KnowledgeBase } from "./library";
import type { TurnMetrics } from "./pipeline";

export function demoReply(config: AgentConfig, text: string, turn: number, scenarios: CustomScenario[], kbs: KnowledgeBase[], selected: string[]) {
  const ids = activeKbIds(config.scenario, scenarios, selected);
  const matches = retrievePassages(kbs.filter((kb) => ids.includes(kb.id)), text, 1, 700);
  if (matches[0]) return `Sample reference from ${matches[0].kb}: ${matches[0].text}`;
  const custom = scenarios.find((s) => `custom:${s.id}` === config.scenario);
  if (custom) return `Sample response for ${custom.label}. A signed-in agent would follow your instructions and use matching knowledge to answer: “${text}”`;
  const scripts: Record<string, string[]> = {
    general: ["Hello! I’m a sample business assistant for customer-facing sales and support conversations.", "Businesses can explore customer support, appointment booking and order enquiries here.", "Thank you for trying the studio. Sign in whenever you’re ready to test real AI responses."],
    hospital: ["I can help with a sample cardiology appointment. What is the patient’s name?", "Thank you, Ravi. What date and time would you prefer?", "In this sample, I can offer a nearby morning slot. Would you like me to confirm the simulated appointment?", "Your sample appointment is confirmed. No real booking has been made.", "You’re welcome. This concludes the sample appointment conversation."],
    bank: ["I’m sorry to hear that. For this sample, use fictional details only: a name and the last four digits of an account.", "Thank you. Shall I simulate blocking the lost card?", "The card is blocked in this fictional conversation only. No banking action has been taken.", "A real agent would use the bank’s verified replacement-card policy. Sign in to test knowledge-grounded answers.", "You’re welcome. Never share a PIN, password or OTP."],
    ecommerce: ["I’m sorry your order is delayed. Can you provide a fictional order ID for this sample?", "Thank you. In this example, the order is delayed in transit.", "A real agent would check an order system before promising a delivery date.", "Refund eligibility would be checked against the attached returns policy. This demo does not process refunds.", "You’re welcome. No real order was changed."],
  };
  const sample = scenarioSample(config.scenario, scenarios);
  const position = sample.indexOf(text);
  const replies = scripts[config.scenario] ?? scripts["general"] ?? [];
  return replies[(position >= 0 ? position : turn) % replies.length] ?? "Sign in to get a real AI response.";
}

export function demoMetrics(config: AgentConfig, index: number, voice: boolean, text: string, reply: string, spoken: boolean): TurnMetrics {
  const usage = { audioSeconds: voice ? 2.4 : 0, inputTokens: Math.ceil(text.length / 4) + 150, outputTokens: Math.ceil(reply.length / 4), ttsChars: spoken ? reply.length : 0 };
  return { sttMs: voice ? 180 + index * 40 : undefined, llmTtfbMs: 320 + index * 90, ttsTtfbMs: spoken ? 210 + index * 30 : undefined, v2vMs: voice ? 710 + index * 160 : 320 + index * 90, ...usage, cost: computeCost(config, usage) };
}