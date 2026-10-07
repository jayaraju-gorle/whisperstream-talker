// Models the site owner can choose to power Flo (web chat + WhatsApp). Browser-safe list.
export type FloModelOption = { id: string; label: string; vendor: "OpenAI" | "Google Gemini" | "Anthropic"; api: "responses" | "chat" | "messages" };

export const FLO_MODELS: FloModelOption[] = [
  { id: "openai/gpt-6-astra", label: "GPT-6 Astra", vendor: "OpenAI", api: "responses" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 mini", vendor: "OpenAI", api: "responses" },
  { id: "google/gemini-3.7-flash", label: "Gemini 3.7 Flash", vendor: "Google Gemini", api: "chat" },
  { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash", vendor: "Google Gemini", api: "chat" },
  { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5", vendor: "Anthropic", api: "messages" },
  { id: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5", vendor: "Anthropic", api: "messages" },
];

export const DEFAULT_FLO_MODEL = "openai/gpt-6-astra";
export const FLO_MODEL_SETTING_KEY = "flo_model";

/** Resolve a stored setting to a supported model; anything unknown falls back to the default. */
export function resolveFloModel(stored: unknown): FloModelOption {
  const id = typeof stored === "object" && stored && "model" in stored ? (stored as { model: unknown }).model : stored;
  return FLO_MODELS.find((m) => m.id === id) ?? FLO_MODELS.find((m) => m.id === DEFAULT_FLO_MODEL)!;
}
