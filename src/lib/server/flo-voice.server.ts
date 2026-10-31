import { DefaultChatTransport, readUIMessageStream, type UIMessage } from "ai";
import { handleAssistantPost } from "@/lib/server/assistant-handler.server";
import { publicAssistantInstructions } from "@/lib/server/public-clinic.server";
import { PUBLIC_CLINIC_GREETING, publicTrialHistory } from "@/lib/public-clinic-demo";
import { ASSISTANT_SPEECH_RULES } from "@/lib/assistant-speech";
import { validFloVisitor, voiceMessages, type VoiceFragment } from "@/lib/flo-voice";

export async function createFloVoice(visitorId: unknown, runId: string) {
  if (!validFloVisitor(visitorId)) throw new Error("Invalid conversation identity.");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data, error } = await db.from("assistant_conversations").select("messages").eq("visitor_id", visitorId).maybeSingle();
  if (error) throw new Error("Couldn't load your conversation.");
  const history = publicTrialHistory((Array.isArray(data?.messages) ? data.messages : []) as unknown as UIMessage[]);
  const initial = [...history];
  const answered = new Map<string, { text: string; answer: string }>();
  const instructions = await publicAssistantInstructions(db);
  const persona = `${instructions}
VOICE CHANNEL: Speak in English unless the caller explicitly speaks another language. Keep spoken replies to one or two sentences. ${ASSISTANT_SPEECH_RULES}
Backchannel policy: Moderate listening sounds without taking over.
Interruption policy: Stop speaking and listen when interrupted; keep completed actions.
Delegation policy:
Backend tools: Shared Mira knowledge, business switching, consent-based contact capture and appointment requests.
Delegate to the backend when: The caller asks any product or business question, says TRY followed by the sample code AURA, says EXIT, shares contact details, requests an appointment, or corrects details. Always use the backend's current assistant and verified result. Never claim an action succeeded without it. After TRY, continue as the business selected by the backend; EXIT restores Mira.
Do not delegate to the backend when: Giving a brief greeting, listening, or asking the caller to repeat unclear speech.`;

  return {
    persona,
    openingInstructions: PUBLIC_CLINIC_GREETING + " Give this brief fictional-demo disclosure once, then listen.",
    history,
    async persist(fragments: VoiceFragment[]) {
      if (!fragments.length) return;
      const messages = [...initial, ...voiceMessages(fragments, runId)];
      const tools = history.slice(initial.length).flatMap((m) => m.parts.filter((p) => p.type.startsWith("tool-")));
      const lastAssistant = messages.filter((m) => m.role === "assistant").at(-1);
      if (lastAssistant) lastAssistant.parts.push(...tools);
      const { error } = await db.from("assistant_conversations").upsert({ visitor_id: visitorId,
        messages: messages as never, updated_at: new Date().toISOString() }, { onConflict: "visitor_id" });
      if (error) throw new Error("Couldn't save the voice conversation.");
    },
    async answer(fragments: VoiceFragment[], signal: AbortSignal, delegationId: string) {
      const turns = voiceMessages(fragments, runId);
      // Only the latest caller context goes to the normal chat pipeline. Its own
      // saved replies/tool results remain intact for consent and business switching.
      const latest = turns.at(-1)?.role === "user" ? turns.at(-1) : turns.filter((m) => m.role === "user").at(-1);
      if (!latest) throw new Error("Please repeat your question.");
      const latestText = latest.parts.map((p) => p.type === "text" ? p.text : "").join("");
      const cached = answered.get(latest.id);
      if (cached?.text === latestText) return cached.answer;
      const previous = history.findIndex((m) => m.id === latest.id);
      // A late correction retains completed tool results rather than replaying
      // the original action after truncating its result from history.
      if (previous >= 0) history.push({ ...latest, id: `${latest.id}-correction-${crypto.randomUUID()}` });
      else history.push(latest);
      const transport = new DefaultChatTransport({
        api: "/api/public/assistant",
        body: { visitorId },
        fetch: async (_url, init) => {
          const request = new Request("https://assistant.internal/api/public/assistant", { ...init, signal,
            headers: { "Content-Type": "application/json", "X-Lovable-AIG-Run-ID": runId,
              "X-Lovable-AIG-Metadata": JSON.stringify({ delegation_id: delegationId }) } });
          return handleAssistantPost({ request, voice: true });
        },
      });
      const stream = await transport.sendMessages({ trigger: "submit-message", chatId: visitorId, messageId: undefined, messages: [...history], abortSignal: signal });
      let reply: UIMessage | undefined;
      for await (const message of readUIMessageStream({ stream, terminateOnError: true })) reply = message;
      signal.throwIfAborted();
      if (!reply) throw new Error("The assistant could not finish its reply.");
      history.push(reply);
      const text = reply.parts.map((p) => p.type === "text" ? p.text : "").join("");
      if (!text.trim()) throw new Error("The assistant returned no reply.");
      answered.set(latest.id, { text: latestText, answer: text });
      return text;
    },
  };
}