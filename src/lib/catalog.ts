// Client-safe provider catalog, scenarios, and pricing. Prices are estimates
// (USD) and should be checked against each vendor's pricing page.

export type ProviderId = "lovable" | "openai" | "groq" | "deepgram" | "elevenlabs" | "sarvam" | "google";
export type Layer = "stt" | "llm" | "tts";

export const PROVIDERS: Record<ProviderId, { label: string; secret: string | null }> = {
  lovable: { label: "Lovable AI", secret: null },
  openai: { label: "OpenAI", secret: "OPENAI_API_KEY" },
  groq: { label: "Groq", secret: "GROQ_API_KEY" },
  deepgram: { label: "Deepgram", secret: "DEEPGRAM_API_KEY" },
  elevenlabs: { label: "ElevenLabs", secret: "ELEVENLABS_API_KEY" },
  sarvam: { label: "Sarvam AI", secret: "SARVAM_API_KEY" },
  google: { label: "Google AI", secret: "GEMINI_API_KEY" },
};

export type SttModel = {
  id: string; // catalog key
  provider: ProviderId;
  model: string; // provider model id
  label: string;
  usdPerMinute: number;
};

export type LlmModel = {
  id: string;
  provider: ProviderId;
  model: string;
  label: string;
  usdPerMInput: number;
  usdPerMOutput: number;
};

export type TtsModel = {
  id: string;
  provider: ProviderId;
  model: string;
  label: string;
  usdPer1kChars: number;
  voices: { id: string; label: string }[];
};

export const STT_MODELS: SttModel[] = [
  { id: "lv-4o-mini-transcribe", provider: "lovable", model: "openai/gpt-4o-mini-transcribe", label: "GPT-4o mini Transcribe", usdPerMinute: 0.003 },
  { id: "lv-4o-transcribe", provider: "lovable", model: "openai/gpt-4o-transcribe", label: "GPT-4o Transcribe", usdPerMinute: 0.006 },
  { id: "lv-gemini-transcribe", provider: "lovable", model: "google/gemini-3.5-transcribe", label: "Gemini 3.5 Transcribe", usdPerMinute: 0.004 },
  { id: "dg-nova-3", provider: "deepgram", model: "nova-3", label: "Deepgram Nova-3", usdPerMinute: 0.0043 },
  { id: "groq-whisper-v3", provider: "groq", model: "whisper-large-v3", label: "Whisper v3 (Groq)", usdPerMinute: 0.00185 },
  { id: "groq-whisper-v3-turbo", provider: "groq", model: "whisper-large-v3-turbo", label: "Whisper v3 Turbo (Groq)", usdPerMinute: 0.000667 },
  { id: "sv-saaras-v3", provider: "sarvam", model: "saaras:v3", label: "Sarvam Saaras v3", usdPerMinute: 0.006 },
  { id: "sv-saarika-v2.5", provider: "sarvam", model: "saarika:v2.5", label: "Sarvam Saarika v2.5", usdPerMinute: 0.006 },
  { id: "oa-whisper-1", provider: "openai", model: "whisper-1", label: "Whisper-1 (OpenAI)", usdPerMinute: 0.006 },
  { id: "oa-4o-mini-transcribe", provider: "openai", model: "gpt-4o-mini-transcribe", label: "GPT-4o mini Transcribe (OpenAI)", usdPerMinute: 0.003 },
];

export const LLM_MODELS: LlmModel[] = [
  { id: "lv-gpt-6-astra", provider: "lovable", model: "openai/gpt-6-astra", label: "GPT-6 Astra", usdPerMInput: 5, usdPerMOutput: 20 },
  { id: "lv-gpt-6-sol", provider: "lovable", model: "openai/gpt-6-sol", label: "GPT-6 Sol", usdPerMInput: 1.5, usdPerMOutput: 6 },
  { id: "lv-gpt-6-luna", provider: "lovable", model: "openai/gpt-6-luna", label: "GPT-6 Luna", usdPerMInput: 0.2, usdPerMOutput: 0.8 },
  { id: "lv-chat-latest", provider: "lovable", model: "openai/chat-latest", label: "ChatGPT Instant", usdPerMInput: 1.25, usdPerMOutput: 10 },
  { id: "lv-gemini-3.5-flash", provider: "lovable", model: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", usdPerMInput: 0.3, usdPerMOutput: 2.5 },
  { id: "lv-gemini-2.5-flash-lite", provider: "lovable", model: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", usdPerMInput: 0.1, usdPerMOutput: 0.4 },
  { id: "oa-gpt-4.1-mini", provider: "openai", model: "gpt-4.1-mini", label: "GPT-4.1 mini (OpenAI)", usdPerMInput: 0.4, usdPerMOutput: 1.6 },
  { id: "oa-gpt-4.1-nano", provider: "openai", model: "gpt-4.1-nano", label: "GPT-4.1 nano (OpenAI)", usdPerMInput: 0.1, usdPerMOutput: 0.4 },
  { id: "sv-sarvam-30b", provider: "sarvam", model: "sarvam-30b", label: "Sarvam 30B", usdPerMInput: 0.028, usdPerMOutput: 0.114 },
  { id: "sv-sarvam-105b", provider: "sarvam", model: "sarvam-105b", label: "Sarvam 105B", usdPerMInput: 0.045, usdPerMOutput: 0.182 },
  { id: "groq-llama-3.3-70b", provider: "groq", model: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)", usdPerMInput: 0.59, usdPerMOutput: 0.79 },
  { id: "groq-llama-3.1-8b", provider: "groq", model: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Groq)", usdPerMInput: 0.05, usdPerMOutput: 0.08 },
  { id: "groq-gpt-oss-120b", provider: "groq", model: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Groq)", usdPerMInput: 0.15, usdPerMOutput: 0.75 },
  { id: "groq-gpt-oss-20b", provider: "groq", model: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Groq)", usdPerMInput: 0.1, usdPerMOutput: 0.5 },
];

const OPENAI_VOICES = ["alloy", "ash", "coral", "sage", "verse", "shimmer"].map((v) => ({ id: v, label: v }));
const GEMINI_VOICES = ["Kore", "Puck", "Charon", "Aoede", "Fenrir", "Leda"].map((v) => ({ id: v, label: v }));

export const TTS_MODELS: TtsModel[] = [
  { id: "lv-4o-mini-tts", provider: "lovable", model: "openai/gpt-4o-mini-tts", label: "GPT-4o mini TTS", usdPer1kChars: 0.015, voices: OPENAI_VOICES },
  { id: "lv-gemini-flash-tts", provider: "lovable", model: "google/gemini-2.5-flash-tts", label: "Gemini 2.5 Flash TTS", usdPer1kChars: 0.01, voices: GEMINI_VOICES },
  { id: "lv-gemini-3.1-tts", provider: "lovable", model: "google/gemini-3.1-flash-tts-preview", label: "Gemini 3.1 Flash TTS", usdPer1kChars: 0.01, voices: GEMINI_VOICES },
  {
    id: "dg-aura-2", provider: "deepgram", model: "aura-2", label: "Deepgram Aura-2", usdPer1kChars: 0.03,
    voices: ["thalia", "andromeda", "helena", "apollo", "orion", "arcas"].map((v) => ({ id: `aura-2-${v}-en`, label: v })),
  },
  {
    id: "el-flash-v2.5", provider: "elevenlabs", model: "eleven_flash_v2_5", label: "ElevenLabs Flash v2.5", usdPer1kChars: 0.05,
    voices: [
      { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel" },
      { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah" },
      { id: "pNInz6obpgDQGcFmaJgB", label: "Adam" },
      { id: "ErXwobaYiN019PkySvjV", label: "Antoni" },
    ],
  },
  {
    id: "sv-bulbul-v3", provider: "sarvam", model: "bulbul:v3", label: "Sarvam Bulbul v3", usdPer1kChars: 0.018,
    voices: ["priya", "aditya", "ritu", "rahul", "neha", "rohan", "kavya", "amit", "shreya", "kabir"].map((v) => ({ id: v, label: v })),
  },
  {
    id: "oa-4o-mini-tts", provider: "openai", model: "gpt-4o-mini-tts", label: "GPT-4o mini TTS (OpenAI)", usdPer1kChars: 0.015, voices: OPENAI_VOICES,
  },
];

// Speech-to-speech (realtime) models: one model hears and speaks directly.
export type S2sModel = {
  id: string;
  provider: ProviderId;
  label: string;
  usdPerMinute: number;
  ready: boolean; // false = listed, wired once the provider key is connected
  voices: { id: string; label: string }[];
};

export const S2S_MODELS: S2sModel[] = [
  {
    id: "lv-gpt-live-1", provider: "lovable", label: "GPT Live (built-in)", usdPerMinute: 0.05, ready: true,
    voices: ["marin", "cedar", "gleam", "meridian", "willow", "vesper"].map((v) => ({ id: v, label: v })),
  },
  {
    id: "g-gemini-live", provider: "google", label: "Gemini Live (native audio)", usdPerMinute: 0.035, ready: false,
    voices: GEMINI_VOICES,
  },
  {
    id: "oa-realtime", provider: "openai", label: "OpenAI Realtime", usdPerMinute: 0.3, ready: false,
    voices: OPENAI_VOICES,
  },
];

export const LANGUAGES = [
  { id: "auto", label: "Auto-detect" },
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "pt", label: "Portuguese" },
  { id: "ja", label: "Japanese" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
  { id: "kn", label: "Kannada" },
  { id: "bn", label: "Bengali" },
  { id: "mr", label: "Marathi" },
];

const VOICE_RULES =
  "You are speaking out loud. Reply in one to three short, natural sentences. No markdown, lists, emoji or URLs. Reply in the user's language.";

export type Scenario = { id: string; label: string; prompt: string; sample: string[] };

export const SCENARIOS: Scenario[] = [
  {
    id: "general",
    label: "General assistant",
    prompt: `You are a friendly, helpful assistant. ${VOICE_RULES}`,
    sample: [
      "Hi! Can you suggest a quick dinner I can cook in 20 minutes?",
      "I don't eat meat. Something with paneer or tofu?",
      "Great, what do I need to buy for that?",
      "Thanks, that's all!",
    ],
  },
  {
    id: "hospital",
    label: "Hospital appointments",
    prompt: `You are the front desk agent for City Care Hospital. Help callers book, move or cancel doctor appointments. Ask for name, department and preferred day one question at a time. Invent plausible open slots. ${VOICE_RULES}`,
    sample: [
      "Hi, I'd like to book an appointment with a cardiologist.",
      "My name is Ravi Kumar.",
      "Sometime this week, morning around 10 if possible, but any nearby slot works.",
      "Yes, please book whichever slot is closest and confirm it.",
      "No, that's all. Thank you!",
    ],
  },
  {
    id: "bank",
    label: "Bank support",
    prompt: `You are a support agent for Northwind Bank. Help with card blocks, balance questions and disputes. Never ask for full card numbers or PINs. ${VOICE_RULES}`,
    sample: [
      "Hi, I think I lost my debit card. Can you block it?",
      "My name is Anita Sharma and the last four digits of my account are 4821.",
      "Yes, please block it right away.",
      "Can I get a replacement card sent to my home address?",
      "Great, thanks for the help.",
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce orders",
    prompt: `You are an order assistant for an online store. Help track orders, start returns and answer delivery questions. Ask for the order number when needed and invent plausible order statuses. ${VOICE_RULES}`,
    sample: [
      "Hi, where is my order? It hasn't arrived yet.",
      "The order number is 50213.",
      "Okay. If it's late, can I return it once it arrives?",
      "How long will the refund take?",
      "Alright, thank you!",
    ],
  },
];

export type AgentConfig = {
  sttId: string;
  llmId: string;
  ttsId: string;
  voice: string;
  scenario: string;
  language: string;
};

export const DEFAULT_AGENT_A: AgentConfig = {
  sttId: "lv-4o-mini-transcribe",
  llmId: "lv-gpt-6-astra",
  ttsId: "lv-4o-mini-tts",
  voice: "alloy",
  scenario: "general",
  language: "auto",
};

export const DEFAULT_AGENT_B: AgentConfig = {
  sttId: "lv-gemini-transcribe",
  llmId: "lv-gemini-3.5-flash",
  ttsId: "lv-gemini-flash-tts",
  voice: "Kore",
  scenario: "general",
  language: "auto",
};

export const findStt = (id: string) => STT_MODELS.find((m) => m.id === id);
export const findLlm = (id: string) => LLM_MODELS.find((m) => m.id === id);
export const findTts = (id: string) => TTS_MODELS.find((m) => m.id === id);

export type Usage = {
  audioSeconds?: number | undefined;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  ttsChars?: number | undefined;
};

export type CostBreakdown = { stt: number; llm: number; tts: number; total: number };

export function computeCost(cfg: Pick<AgentConfig, "sttId" | "llmId" | "ttsId">, u: Usage): CostBreakdown {
  const stt = ((u.audioSeconds ?? 0) / 60) * (findStt(cfg.sttId)?.usdPerMinute ?? 0);
  const llmModel = findLlm(cfg.llmId);
  const llm =
    ((u.inputTokens ?? 0) / 1_000_000) * (llmModel?.usdPerMInput ?? 0) +
    ((u.outputTokens ?? 0) / 1_000_000) * (llmModel?.usdPerMOutput ?? 0);
  const tts = ((u.ttsChars ?? 0) / 1000) * (findTts(cfg.ttsId)?.usdPer1kChars ?? 0);
  return { stt, llm, tts, total: stt + llm + tts };
}

export function formatUsd(v: number) {
  if (v === 0) return "$0";
  if (v < 0.01) return `$${v.toFixed(5)}`;
  return `$${v.toFixed(4)}`;
}
