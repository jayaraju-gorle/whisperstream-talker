import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, isStepCount, streamText, tool, type UIMessage } from "ai";
import { ASSISTANT_INSTRUCTIONS } from "@/lib/assistant-knowledge";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/server/run-id";

const MODEL = "openai/gpt-6-astra";
const MAX_USER_TURNS = 40;
const VisitorId = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);

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

export const Route = createFileRoute("/api/public/assistant")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      // Restore the visitor's single conversation. The visitor id is a random secret kept in their browser.
      GET: async ({ request }) => {
        const id = VisitorId.safeParse(new URL(request.url).searchParams.get("visitorId"));
        if (!id.success) return json({ messages: [] });
        const db = await admin();
        const { data, error } = await db
          .from("assistant_conversations")
          .select("messages")
          .eq("visitor_id", id.data)
          .maybeSingle();
        if (error) return json({ error: "Couldn't load the conversation" }, 500);
        return json({ messages: data?.messages ?? [] });
      },
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid request" }, 400);
        const { visitorId } = parsed.data;
        const messages = parsed.data.messages as UIMessage[];
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

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses(MODEL),
          instructions: ASSISTANT_INSTRUCTIONS,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          stopWhen: isStepCount(4),
          tools: {
            save_lead: tool({
              description: "Save a visitor's contact details so the founder can get in touch.",
              inputSchema: z.object({
                name: z.string().min(1).max(120),
                email: z.string().max(254),
                phone: z.string().max(40).nullable(),
                company: z.string().max(160).nullable(),
                interest: z.string().max(2000).nullable().describe("What they need, in one or two sentences"),
              }),
              execute: async (input) => {
                if (!z.string().email().safeParse(input.email.trim()).success)
                  return { saved: false, reason: "The email address looks invalid; ask the visitor to check it." };
                const { error } = await db.from("leads").insert({
                  conversation_id: convo.id,
                  name: input.name.trim(),
                  email: input.email.trim(),
                  phone: input.phone?.trim() || null,
                  company: input.company?.trim() || null,
                  interest: input.interest?.trim() || null,
                });
                if (error) {
                  console.error("lead insert failed", error);
                  return { saved: false, reason: "Saving failed; apologise and suggest trying again shortly." };
                }
                return { saved: true };
              },
            }),
          },
          providerOptions: {
            openai: {
              store: false,
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: false,
            onFinish: async ({ messages: all }) => {
              const { error } = await db
                .from("assistant_conversations")
                .update({ messages: all as never, updated_at: new Date().toISOString() })
                .eq("id", convo.id);
              if (error) console.error("conversation save failed", error);
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
