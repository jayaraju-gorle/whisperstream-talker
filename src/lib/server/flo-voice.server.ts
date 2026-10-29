import { DefaultChatTransport, readUIMessageStream, type UIMessage } from "ai";
import { handleAssistantPost } from "@/routes/api/public/assistant";
import { ASSISTANT_INSTRUCTIONS } from "@/lib/assistant-knowledge";
import { activeClinicCommand, loadClinicSession } from "@/lib/server/clinic-mode.server";
import { validFloVisitor, voiceMessages, type VoiceFragment } from "@/lib/flo-voice";

export async function createFloVoice(visitorId: unknown, runId: string) {
  if (!validFloVisitor(visitorId)) throw new Error("Invalid conversation identity.");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data, error } = await db.from("assistant_conversations").select("messages").eq("visitor_id", visitorId).maybeSingle();
  if (error) throw new Error("Couldn't load your conversation.");
  const history = (Array.isArray(data?.messages) ? data.messages : []) as unknown as UIMessage[];
  const command = activeClinicCommand(history);
  let instructions = ASSISTANT_INSTRUCTIONS;
  if (command.code) {
    const { data: business } = await db.from("clinics").select("id").eq("test_code", command.code).maybeSingle();
    const session = business ? await loadClinicSession(db, business.id, "Website") : null;
    if (session) instructions = session.instructions;
  }
  const persona = `${instructions}
VOICE CHANNEL: Speak in English unless the caller explicitly speaks another language. Keep spoken replies to one or two sentences. Do not read markdown or URLs aloud.
Backchannel policy: Moderate listening sounds without taking over.
Interruption policy: Stop speaking and listen when interrupted; keep completed actions.
Delegation policy:
Backend tools: Shared Flo knowledge, business switching, consent-based contact capture and appointment requests.
Delegate to the backend when: The caller asks any product or business question, says TRY followed by a business code (SSK, IVY, IYASHI), says EXIT, shares contact details, requests an appointment, or corrects details. Always use the backend's current assistant and verified result. Never claim an action succeeded without it. After TRY, continue as the business selected by the backend; EXIT restores Flo.
Do not delegate to the backend when: Giving a brief greeting, listening, or asking the caller to repeat unclear speech.`;

  return {
    persona,
    openingInstructions: "Briefly greet the caller in the current assistant role, ask how you can help, then listen. Do not mention tests or the playground.",
    history,
    async answer(fragments: VoiceFragment[], signal: AbortSignal, delegationId: string) {
      const turns = voiceMessages(fragments, runId);
      // Only the latest caller context goes to the normal chat pipeline. Its own
      // saved replies/tool results remain intact for consent and business switching.
      const latest = turns.at(-1)?.role === "user" ? turns.at(-1) : turns.filter((m) => m.role === "user").at(-1);
      if (!latest) throw new Error("Please repeat your question.");
      const previous = history.findIndex((m) => m.id === latest.id);
      if (previous >= 0) history.splice(previous);
      history.push(latest);
      const transport = new DefaultChatTransport({
        api: "/api/public/assistant",
        body: { visitorId },
        fetch: async (_url, init) => {
          const request = new Request("https://assistant.internal/api/public/assistant", { ...init, signal,
            headers: { "Content-Type": "application/json", "X-Lovable-AIG-Run-ID": runId,
              "X-Lovable-AIG-Metadata": JSON.stringify({ delegation_id: delegationId }) } });
          return handleAssistantPost({ request });
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
      return text;
    },
  };
}