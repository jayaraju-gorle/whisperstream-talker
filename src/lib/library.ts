// Pure helpers that turn built-in/custom scenarios + knowledge bases into a system prompt.
import { SCENARIOS } from "./catalog";
import { BUILT_IN_KNOWLEDGE } from "./built-in-knowledge";

export type KnowledgeBase = { id: string; name: string; content: string };
export type CustomScenario = { id: string; label: string; prompt: string; sample: string[]; kb_ids: string[] };

export const CUSTOM_PREFIX = "custom:";
export const KB_CHAR_BUDGET = 40000;
export const builtInKnowledge: KnowledgeBase[] = BUILT_IN_KNOWLEDGE.map(({ id, name, content }) => ({ id, name, content }));

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
  const fromBuiltIn = BUILT_IN_KNOWLEDGE.filter((k) => k.scenarioId === scenarioId).map((k) => k.id);
  return [...new Set([...fromBuiltIn, ...fromScenario, ...sessionKbIds])];
}

// ---------- Passage retrieval (BM25 over paragraph chunks) ----------
export const CHUNK_CHARS = 700;
export const RETRIEVAL_CHAR_BUDGET = 4000;
export const RETRIEVAL_TOP_K = 6;

export type Passage = { kb: string; text: string };

const STOP = new Set(
  "a an and are as at be but by can could do does for from had has have he her his how i if in into is it its me my no not of on or our please she so than that the their them then there these they this to us was we were what when where which who why will with would you your yes ok okay hi hello thanks thank".split(" "),
);

export function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));
}

/** Split text into ~CHUNK_CHARS passages on paragraph, then sentence boundaries. */
export function chunkText(text: string, max = CHUNK_CHARS): string[] {
  const out: string[] = [];
  let cur = "";
  const push = () => { if (cur.trim()) out.push(cur.trim()); cur = ""; };
  for (const para of text.split(/\n\s*\n/)) {
    const pieces = para.length > max ? para.split(/(?<=[.!?])\s+|\n/) : [para];
    for (const p of pieces) {
      if (cur && cur.length + p.length + 1 > max) push();
      cur = cur ? `${cur}\n${p}` : p;
      while (cur.length > max) { out.push(cur.slice(0, max)); cur = cur.slice(max); }
    }
    if (cur.length >= 150) push(); // keep paragraphs as their own passages unless tiny
  }
  push();
  return out;
}

export function retrievePassages(kbs: KnowledgeBase[], query: string, k = RETRIEVAL_TOP_K, budget = RETRIEVAL_CHAR_BUDGET): Passage[] {
  const q = [...new Set(tokenize(query))];
  if (!q.length) return [];
  const docs = kbs.flatMap((kb) => chunkText(kb.content).map((text) => ({ kb: kb.name, text, toks: tokenize(`${kb.name} ${text}`) })));
  if (!docs.length) return [];
  const N = docs.length;
  const avg = docs.reduce((s, d) => s + d.toks.length, 0) / N || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d.toks)) df.set(t, (df.get(t) ?? 0) + 1);
  const k1 = 1.4, b = 0.75;
  const scored = docs.map((d, i) => {
    const tf = new Map<string, number>();
    for (const t of d.toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.toks.length) / avg)));
    }
    return { d, i, score };
  });
  const top = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  const out: Passage[] = [];
  let used = 0;
  for (const s of top) {
    if (used + s.d.text.length > budget && out.length) break;
    out.push({ kb: s.d.kb, text: s.d.text });
    used += s.d.text.length;
  }
  return out;
}

/**
 * System prompt for a turn. With `query` (the caller's recent words), only the best-matching
 * knowledge passages are included; without it (e.g. live calls) the knowledge is sent capped.
 */
export function buildSystemPrompt(
  scenarioId: string,
  custom: CustomScenario[],
  kbs: KnowledgeBase[],
  sessionKbIds: string[],
  query?: string,
): string {
  const c = findCustom(scenarioId, custom);
  const base = c
    ? `${c.prompt.trim() || "You are a helpful assistant."} ${VOICE_RULES}`
    : (SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!).prompt;
  const ids = activeKbIds(scenarioId, custom, sessionKbIds);
  const picked = ids.map((id) => [...builtInKnowledge, ...kbs].find((k) => k.id === id)).filter((k): k is KnowledgeBase => !!k && !!k.content.trim());
  if (!picked.length) return base;

  if (query !== undefined) {
    const passages = retrievePassages(picked, query);
    const names = picked.map((k) => k.name).join(", ");
    if (!passages.length)
      return `${base}\n\nYou have reference knowledge (${names}), but nothing in it matches this question. If you need specific facts, say you don't know rather than inventing them.`;
    return `${base}\n\nRelevant excerpts from the reference knowledge (${names}). For factual questions about the reference knowledge's business, use the excerpts rather than conflicting details in the scenario persona. Answer from these; if the answer isn't here, say you don't know rather than inventing facts.\n\n${passages
      .map((p, i) => `[${i + 1}] (${p.kb})\n${p.text}`)
      .join("\n\n")}`;
  }

  let budget = KB_CHAR_BUDGET;
  const parts: string[] = [];
  for (const k of picked) {
    if (budget <= 0) break;
    const text = k.content.trim().slice(0, budget);
    budget -= text.length;
    parts.push(`### ${k.name}\n${text}`);
  }
  return `${base}\n\nUse the reference knowledge below to answer. For factual questions about the reference knowledge's business, use it rather than conflicting details in the scenario persona. If the answer is not in it, say you don't know rather than inventing facts.\n\n${parts.join("\n\n")}`;
}

/** Retrieval query: the latest caller message plus the previous one for follow-ups like "how much is it?". */
export function retrievalQuery(history: { role: string; content: string }[]): string {
  return history.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join(" ");
}
