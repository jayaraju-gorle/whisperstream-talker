import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { FLO_MODEL_SETTING_KEY, resolveFloModel, type FloModelOption } from "@/lib/flo-models";
import { FLO_PROVIDER_OPTIONS } from "@/lib/server/flo.server";

type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
const BASE = "https://ai.gateway.lovable.dev/v1";

export async function loadFloModel(db: Db): Promise<FloModelOption> {
  const { data } = await db.from("app_settings").select("value").eq("key", FLO_MODEL_SETTING_KEY).maybeSingle();
  return resolveFloModel(data?.value);
}

/** Build the language model + provider options for the chosen Flo model, all through the AI gateway. */
export function floLanguageModel(opt: FloModelOption, apiKey: string, fetch: typeof globalThis.fetch) {
  const headers = { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" };
  if (opt.api === "messages") {
    return { model: createAnthropic({ baseURL: BASE, apiKey, headers, fetch })(opt.id), providerOptions: {} };
  }
  if (opt.api === "chat") {
    return { model: createOpenAICompatible({ name: "lovable", baseURL: BASE, apiKey, headers, fetch })(opt.id), providerOptions: {} };
  }
  return { model: createOpenAI({ baseURL: BASE, apiKey, headers, fetch }).responses(opt.id), providerOptions: FLO_PROVIDER_OPTIONS };
}

export async function logFloTurn(db: Db, row: {
  conversation_id: string | null; channel: string; model: string; started: number; firstToken: number | null;
  input_tokens?: number | undefined; output_tokens?: number | undefined; steps?: number; ok: boolean; error?: string;
}) {
  const { error } = await db.from("assistant_turn_logs").insert({
    conversation_id: row.conversation_id, channel: row.channel, model: row.model,
    first_token_ms: row.firstToken == null ? null : Math.round(row.firstToken - row.started),
    total_ms: Math.round(Date.now() - row.started),
    input_tokens: row.input_tokens ?? null, output_tokens: row.output_tokens ?? null,
    steps: row.steps ?? null, ok: row.ok, error: row.error?.slice(0, 500) ?? null,
  });
  if (error) console.error("turn log failed", error);
}
