// Pure helpers that turn built-in/custom scenarios + knowledge bases into a system prompt.
import { SCENARIOS } from "./catalog";

export type KnowledgeBase = { id: string; name: string; content: string };
export type CustomScenario = { id: string; label: string; prompt: string; sample: string[]; kb_ids: string[] };

export const CUSTOM_PREFIX = "custom:";
export const KB_CHAR_BUDGET = 40000;

const VOICE_RULES =
  "You are speaking out loud. Reply in one to three short, natural sentences. No markdown, lists, emoji or URLs. Reply in the user's language.";

export function findCustom(scenarioId: string, custom: CustomScenario[]) {
  if (!scenarioId.startsWith(CUSTOM_PREFIX)) return undefined;
  const id = scenarioId.slice(CUSTOM_PREFIX.length);
  return custom.find((c) => c.id === id);
}

export function scenarioSample(scenarioId: string, custom: CustomScenario[]): string[] {
  const c = findCustom(scenarioId, custom);
  if (c) return c.sample.filter((l) => l.trim());
  return SCENARIOS.find((s) => s.id === scenarioId)?.sample ?? [];
}

/** Knowledge base ids that apply: the scenario's attached KBs plus any picked for this session. */
export function activeKbIds(scenarioId: string, custom: CustomScenario[], sessionKbIds: string[]) {
  const fromScenario = findCustom(scenarioId, custom)?.kb_ids ?? [];
  return [...new Set([...fromScenario, ...sessionKbIds])];
}

export function buildSystemPrompt(
  scenarioId: string,
  custom: CustomScenario[],
  kbs: KnowledgeBase[],
  sessionKbIds: string[],
): string {
  const c = findCustom(scenarioId, custom);
  const base = c
    ? `${c.prompt.trim() || "You are a helpful assistant."} ${VOICE_RULES}`
    : (SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!).prompt;
  const ids = activeKbIds(scenarioId, custom, sessionKbIds);
  const picked = ids.map((id) => kbs.find((k) => k.id === id)).filter((k): k is KnowledgeBase => !!k && !!k.content.trim());
  if (!picked.length) return base;
  let budget = KB_CHAR_BUDGET;
  const parts: string[] = [];
  for (const k of picked) {
    if (budget <= 0) break;
    const text = k.content.trim().slice(0, budget);
    budget -= text.length;
    parts.push(`### ${k.name}\n${text}`);
  }
  return `${base}\n\nUse the reference knowledge below to answer. If the answer is not in it, say you don't know rather than inventing facts.\n\n${parts.join("\n\n")}`;
}
