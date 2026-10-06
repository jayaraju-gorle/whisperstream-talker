// Client-safe provider catalog, scenarios, and pricing. Prices are estimates
// (USD) and should be checked against each vendor's pricing page.

export type ProviderId = "openai" | "groq" | "deepgram" | "elevenlabs" | "sarvam" | "google" | "anthropic" | "xai";
export type ConnectionId = ProviderId | "lovable";
export type ModelAccess = { provider: ProviderId; connection?: ConnectionId };

export function modelAvailable(model: ModelAccess, available: Partial<Record<ConnectionId, boolean>>) {
  return available[model.connection ?? model.provider] !== false;
}

export type Layer = "stt" | "llm" | "tts";

export const PROVIDERS: Record<ProviderId, { label: string; secret: string | null }> = {
  openai: { label: "OpenAI", secret: "OPENAI_API_KEY" },
  groq: { label: "Groq", secret: "GROQ_API_KEY" },
  deepgram: { label: "Deepgram", secret: "DEEPGRAM_API_KEY" },
  elevenlabs: { label: "ElevenLabs", secret: "ELEVENLABS_API_KEY" },
  sarvam: { label: "Sarvam AI", secret: "SARVAM_API_KEY" },
  google: { label: "Google Gemini", secret: "GEMINI_API_KEY" },
  anthropic: { label: "Anthropic", secret: "ANTHROPIC_API_KEY" },
  xai: { label: "xAI", secret: "XAI_API_KEY" },
};

export type SttModel = ModelAccess & {
  id: string; // catalog key
  provider: ProviderId;
  model: string; // provider model id
  label: string;
  usdPerMinute: number;
};

export type LlmModel = ModelAccess & {
  id: string;
  provider: ProviderId;
  model: string;
  label: string;
  usdPerMInput: number;
  usdPerMOutput: number;
  longContext?: { threshold: number; usdPerMInput: number; usdPerMOutput: number };
};

export type TtsModel = ModelAccess & {
  id: string;
  provider: ProviderId;
  model: string;
  label: string;
  usdPer1kChars: number;
  voices: { id: string; label: string }[];
};

export const STT_MODELS: SttModel[] = [
  { id: "lv-4o-mini-transcribe", provider: "openai", connection: "lovable", model: "openai/gpt-4o-mini-transcribe", label: "GPT-4o mini Transcribe", usdPerMinute: 0.003 },
  { id: "lv-4o-transcribe", provider: "openai", connection: "lovable", model: "openai/gpt-4o-transcribe", label: "GPT-4o Transcribe", usdPerMinute: 0.006 },
  { id: "lv-gemini-transcribe", provider: "google", connection: "lovable", model: "google/gemini-3.5-transcribe", label: "Gemini 3.5 Transcribe", usdPerMinute: 0.004 },
  { id: "dg-nova-3", provider: "deepgram", model: "nova-3", label: "Deepgram Nova-3", usdPerMinute: 0.0043 },
  { id: "groq-whisper-v3", provider: "groq", model: "whisper-large-v3", label: "Whisper v3 (Groq)", usdPerMinute: 0.00185 },
  { id: "groq-whisper-v3-turbo", provider: "groq", model: "whisper-large-v3-turbo", label: "Whisper v3 Turbo (Groq)", usdPerMinute: 0.000667 },
  { id: "sv-saaras-v3", provider: "sarvam", model: "saaras:v3", label: "Sarvam Saaras v3", usdPerMinute: 0.006 },
  { id: "sv-saarika-v2.5", provider: "sarvam", model: "saarika:v2.5", label: "Sarvam Saarika v2.5", usdPerMinute: 0.006 },
  { id: "oa-whisper-1", provider: "openai", model: "whisper-1", label: "Whisper-1 (OpenAI)", usdPerMinute: 0.006 },
  { id: "oa-4o-mini-transcribe", provider: "openai", model: "gpt-4o-mini-transcribe", label: "GPT-4o mini Transcribe (OpenAI)", usdPerMinute: 0.003 },
];

// First-party model IDs and standard USD/MTok pricing:
// https://platform.claude.com/docs/en/models/overview
export const LLM_MODELS: LlmModel[] = [
  { id: "an-claude-sonnet-5", provider: "anthropic", model: "claude-sonnet-5", label: "Claude Sonnet 5", usdPerMInput: 2, usdPerMOutput: 10 },
  { id: "an-claude-haiku-4.5", provider: "anthropic", model: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", usdPerMInput: 1, usdPerMOutput: 5 },
  { id: "xai-grok-4.7", provider: "xai", model: "grok-4.7", label: "Grok 4.7", usdPerMInput: 2, usdPerMOutput: 6, longContext: { threshold: 200000, usdPerMInput: 4, usdPerMOutput: 12 } },
  { id: "lv-gpt-6-astra", provider: "openai", connection: "lovable", model: "openai/gpt-6-astra", label: "GPT-6 Astra", usdPerMInput: 5, usdPerMOutput: 20 },
  { id: "lv-gpt-6-sol", provider: "openai", connection: "lovable", model: "openai/gpt-6-sol", label: "GPT-6 Sol", usdPerMInput: 1.5, usdPerMOutput: 6 },
  { id: "lv-gpt-6-luna", provider: "openai", connection: "lovable", model: "openai/gpt-6-luna", label: "GPT-6 Luna", usdPerMInput: 0.2, usdPerMOutput: 0.8 },
  { id: "lv-chat-latest", provider: "openai", connection: "lovable", model: "openai/chat-latest", label: "ChatGPT Instant", usdPerMInput: 1.25, usdPerMOutput: 10 },
  { id: "lv-gemini-3.5-flash", provider: "google", connection: "lovable", model: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", usdPerMInput: 0.3, usdPerMOutput: 2.5 },
  { id: "lv-gemini-2.5-flash-lite", provider: "google", connection: "lovable", model: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", usdPerMInput: 0.1, usdPerMOutput: 0.4 },
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
  { id: "lv-4o-mini-tts", provider: "openai", connection: "lovable", model: "openai/gpt-4o-mini-tts", label: "GPT-4o mini TTS", usdPer1kChars: 0.015, voices: OPENAI_VOICES },
  { id: "lv-gemini-flash-tts", provider: "google", connection: "lovable", model: "google/gemini-2.5-flash-tts", label: "Gemini 2.5 Flash TTS", usdPer1kChars: 0.01, voices: GEMINI_VOICES },
  { id: "lv-gemini-3.1-tts", provider: "google", connection: "lovable", model: "google/gemini-3.1-flash-tts-preview", label: "Gemini 3.1 Flash TTS", usdPer1kChars: 0.01, voices: GEMINI_VOICES },
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
export type S2sModel = ModelAccess & {
  id: string;
  provider: ProviderId;
  label: string;
  usdPerMinute: number;
  ready: boolean; // false = listed, wired once the provider key is connected
  voices: { id: string; label: string }[];
};

export const S2S_MODELS: S2sModel[] = [
  {
    id: "lv-gpt-live-1", provider: "openai", connection: "lovable", label: "GPT Live (OpenAI)", usdPerMinute: 0.05, ready: true,
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

// Verbatim personas and caller lines from conversational-ai-playground/server/bot.py.
// Legacy "generic" corresponds to the general scenario in this app.
export type Scenario = { id: string; label: string; prompt: string; sample: string[] };

export const SCENARIOS: Scenario[] = [
  {
    id: "general",
    label: "General Assistant",
    prompt: "You are a helpful business assistant for customer-facing sales and support conversations.",
    sample: [
      "Hi, who are you and what can you help me with?",
      "What kind of businesses do you usually assist?",
      "Alright, thanks. That's all for now.",
    ],
  },
  {
    id: "hospital",
    label: "Hospital — Appointment Booking",
    prompt: "You are the appointment booking assistant for Sunrise Multi-Speciality Hospital. Help callers book, reschedule, or cancel doctor appointments. Collect one detail at a time: the patient's name, the specialty or doctor they need (General Medicine, Cardiology, Orthopedics, Pediatrics, Dermatology, ENT), and their preferred date and time. Consultations are available Monday to Saturday, 9 AM to 1 PM and 5 PM to 8 PM. Resolve relative dates like 'this week' or 'tomorrow' to concrete dates yourself and state them — do not ask for exact calendar dates. This is a product demo, so simulate realistic slot availability — occasionally a requested slot is taken and you offer the nearest alternatives. If the caller says any nearby slot works or asks you to confirm, pick the best available slot yourself and confirm it — do not keep asking them to choose. Before confirming, read back the full booking details. Never give medical advice; for emergencies, tell the caller to visit the emergency department immediately.",
    sample: [
      "Hi, I'd like to book an appointment with a cardiologist.",
      "My name is Ravi Kumar.",
      "Sometime this week, morning around 10 if possible — but any nearby slot works for me.",
      "Yes, please book whichever slot is closest and confirm it.",
      "No, that's all. Thank you!",
    ],
  },
  {
    id: "bank",
    label: "Bank — Customer Support",
    prompt: "You are a customer support agent for Horizon Bank. Help customers with blocking a lost or stolen card, checking account balance, recent transactions, branch locations and timings, and general product questions about savings accounts, fixed deposits, and credit cards. Before discussing any account-specific detail, verify identity by asking for the customer's registered name and the last four digits of their account number. This is a product demo, so simulate plausible account data after verification. Never ask for full card numbers, PINs, passwords, or OTPs — if a caller offers one, tell them never to share it. For a lost card, treat it as urgent: verify, confirm the card is blocked, and reassure the customer.",
    sample: [
      "Hi, I think I lost my debit card. I'm really worried.",
      "My name is Priya Sharma, account ending 4321.",
      "Yes, please block the card immediately.",
      "How do I get a replacement card?",
      "Thanks, that's very helpful. Bye.",
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce — Order Support",
    prompt: "You are the order support assistant for QuickKart, an online shopping platform. Help customers track orders, process returns and refunds, and answer questions about delivery times and payment issues. Ask for the order ID or the customer's registered phone number to look up an order. This is a product demo, so simulate plausible order details. Returns are accepted within 7 days of delivery; refunds take 3 to 5 business days. Be empathetic when a customer reports a problem, and summarize the resolution before ending.",
    sample: [
      "Hi, my order hasn't arrived yet and it's been a week.",
      "The order ID is QK12345.",
      "It was supposed to arrive two days ago.",
      "If it doesn't arrive by then, can I get a refund?",
      "Okay, thank you for the help.",
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
  const rates = llmModel?.longContext && (u.inputTokens ?? 0) >= llmModel.longContext.threshold ? llmModel.longContext : llmModel;
  const llm =
    ((u.inputTokens ?? 0) / 1_000_000) * (rates?.usdPerMInput ?? 0) +
    ((u.outputTokens ?? 0) / 1_000_000) * (rates?.usdPerMOutput ?? 0);
  const tts = ((u.ttsChars ?? 0) / 1000) * (findTts(cfg.ttsId)?.usdPer1kChars ?? 0);
  return { stt, llm, tts, total: stt + llm + tts };
}

export function formatUsd(v: number) {
  if (v === 0) return "$0";
  if (v < 0.01) return `$${v.toFixed(5)}`;
  return `$${v.toFixed(4)}`;
}
