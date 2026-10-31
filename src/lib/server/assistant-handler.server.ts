import { PUBLIC_CLINIC_CODE, PUBLIC_CLINIC_GREETING, PUBLIC_CLINIC_NOTICE, publicTrialHistory } from "@/lib/public-clinic-demo";
import { z } from "zod";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, isStepCount, streamText, type UIMessage } from "ai";
import { activeClinicCommand } from "@/lib/server/clinic-mode.server";
import { publicAssistantInstructions } from "@/lib/server/public-clinic.server";
import { floTools } from "@/lib/server/flo.server";
import { ASSISTANT_SPEECH_RULES } from "@/lib/assistant-speech";
import { floLanguageModel, loadFloModel, logFloTurn } from "@/lib/server/flo-model.server";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/server/run-id";

const MAX_USER_TURNS = 40;
// WhatsApp conversations use a reserved "whatsapp_" prefix; browsers can never address them.
const VisitorId = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).refine((v) => !v.startsWith("whatsapp_"));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

const Body = z.object({
  visitorId: VisitorId,
  messages: z.array(z.any()).min(1).max(200),
});

export async function handleAssistantPost({ request, voice = false, channel }: { request: Request; voice?: boolean; channel?: "Bolna" }): Promise<Response> {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid request" }, 400);
        const { visitorId } = parsed.data;
        if (visitorId.startsWith("bolna_") && channel !== "Bolna") return json({ error: "Invalid request" }, 400);
        const messages = publicTrialHistory(parsed.data.messages as UIMessage[]);
        const userTurns = messages.filter((m) => m.role === "user").length;
        if (userTurns > MAX_USER_TURNS)
          return json({ error: "This chat has reached its limit. Please leave your email and we'll reach out." }, 429);
        const last = messages[messages.length - 1];
        const lastText = JSON.stringify(last?.parts ?? "");
        if (lastText.length > 4000) return json({ error: "Message is too long" }, 400);

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json({ error: "Assistant is not configured" }, 500);

        const db = await admin();
        const { data: convo, error: convoErr } = await db
          .from("assistant_conversations")
          .upsert({ visitor_id: visitorId, updated_at: new Date().toISOString() }, { onConflict: "visitor_id" })
          .select("id")
          .single();
        if (convoErr || !convo) return json({ error: "Couldn't start the conversation" }, 500);

        const save = async (all: UIMessage[]) => {
          const { error } = await db
            .from("assistant_conversations")
            .update({ messages: all as never, updated_at: new Date().toISOString() })
            .eq("id", convo.id);
          if (error) console.error("conversation save failed", error);
        };

        // No public path may resolve real business codes or appointment tools.
        const cmd = activeClinicCommand(messages);
        let notice: string | null = null;
        if (cmd.index === messages.length - 1) {
          notice = cmd.code === PUBLIC_CLINIC_CODE ? PUBLIC_CLINIC_GREETING : cmd.code
            ? PUBLIC_CLINIC_NOTICE : "You're with Mira. Would you like an assistant set up for your own clinic?";
        }
        if (notice) {
          const text = notice;
          const stream = createUIMessageStream({
            originalMessages: messages,
            execute: ({ writer }) => {
              const id = crypto.randomUUID();
              writer.write({ type: "start" });
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: text });
              writer.write({ type: "text-end", id });
              writer.write({ type: "finish" });
            },
            onFinish: async ({ messages: all }) => save(all),
          });
          return createUIMessageStreamResponse({ stream });
        }
        const history = cmd.index >= 0 ? messages.slice(cmd.index + 1) : messages;

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        // Independent, fresh per-turn reads run together; never cache editable Aura facts.
        const [choice, instructions, modelMessages] = await Promise.all([
          loadFloModel(db),
          publicAssistantInstructions(db),
          convertToModelMessages(history),
        ]);
        const { model, providerOptions } = floLanguageModel(choice, apiKey, runIdFetch.fetch);
        const started = Date.now();
        let firstToken: number | null = null;
        const log = { conversation_id: convo.id, channel: channel ?? "Website", model: choice.id, started };

        const result = streamText({
          model,
          instructions: instructions + (voice ? `\nVOICE: Respond in English unless the caller explicitly speaks another language. Keep answers to one or two short sentences, asking one question at a time. Start with the direct answer; avoid repeated introductions, filler and recaps. After the fictional disclosure in the greeting, use Aura or the clinic; keep brief demo context for fees, appointments and illustrative directions. If interrupted, address the caller's latest question without restarting your earlier answer. ${ASSISTANT_SPEECH_RULES} Require explicit confirmation of the exact details before saving contact details. Appointments are simulated requests only, never saved or confirmed real bookings. Preserve completed tool results and never repeat a completed action for late transcript fragments.` : ""),
          messages: modelMessages,
          abortSignal: request.signal,
          stopWhen: isStepCount(4),
          tools: floTools(db, convo.id, channel),
          providerOptions,
          onChunk: ({ chunk }) => { if (firstToken == null && chunk.type === "text-delta") firstToken = Date.now(); },
          onFinish: async ({ totalUsage, steps }) => {
            await logFloTurn(db, { ...log, firstToken, input_tokens: totalUsage.inputTokens, output_tokens: totalUsage.outputTokens, steps: steps.length, ok: true });
          },
          onError: async ({ error }) => {
            await logFloTurn(db, { ...log, firstToken, ok: false, error: String((error as Error)?.message ?? error) });
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: false,
            onError: (error) => error instanceof Error ? error.message : "The assistant could not reply.",
            onFinish: async ({ messages: all }) => save(all),
          }),
          runIdFetch,
        );
}

export async function handleAssistantGet({ request }: { request: Request }) {
        const id = VisitorId.safeParse(new URL(request.url).searchParams.get("visitorId"));
        if (!id.success || id.data.startsWith("bolna_")) return json({ messages: [] });
        const db = await admin();
        const { data, error } = await db
          .from("assistant_conversations")
          .select("messages")
          .eq("visitor_id", id.data)
          .maybeSingle();
        if (error) return json({ error: "Couldn't load the conversation" }, 500);
        const history = (Array.isArray(data?.messages) ? data.messages : []) as unknown as UIMessage[];
        return json({ messages: publicTrialHistory(history).length === history.length ? history : [] });
}
