import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, Phone, RotateCcw, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader } from "@/components/ai-elements/tool";
import { ContactSummary } from "@/components/ContactSummary";
import { contactDetails, contactUpdateMessage } from "@/lib/assistant-contact";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FloVoice } from "@/components/FloVoice";
import { PHONE_ASSISTANT_NUMBER, PHONE_ASSISTANT_URL, WHATSAPP_ASSISTANT_URL } from "@/lib/flo-voice";

const KEY = "flo-visitor-id";
const SUGGESTIONS = ["What can I test here?", "Can I try voice calls?", "I'd like a custom agent for my business"];

function visitorId() {
  let id = localStorage.getItem(KEY);
  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    id = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function SiteAssistant() {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [busy, setBusy] = useState(false);

  const restart = () => {
    const next = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(KEY, next);
    setId(next);
    setInitial([]);
  };

  useEffect(() => {
    if (!open || id) return;
    const v = visitorId();
    setId(v);
    fetch(`/api/public/assistant?visitorId=${v}`)
      .then((r) => r.json())
      .then((d) => setInitial(Array.isArray(d.messages) ? d.messages : []))
      .catch(() => setInitial([]));
  }, [open, id]);

  return (
    <>
      {open && (
        <div className="fixed inset-x-2 bottom-20 z-50 flex h-[min(600px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[400px]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Logo className="h-6 w-6" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Mira · Studio guide</div>
              <div className="text-xs text-muted-foreground">Chat or talk with your assistant</div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Restart conversation" title="Restart conversation" disabled={busy || !initial}>
                  <RotateCcw />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start a new conversation?</AlertDialogTitle>
                  <AlertDialogDescription>This clears the chat from this window. Previously shared contact details remain saved with us.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep chatting</AlertDialogCancel>
                  <AlertDialogAction onClick={restart}>Restart conversation</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </div>
          {id && initial ? (
            <ChatBody key={id} visitorId={id} initial={initial} onBusyChange={setBusy} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Shimmer>Opening chat…</Shimmer>
            </div>
          )}
        </div>
      )}
      <Button
        aria-label={open ? "Close chat" : "Chat with us"}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 h-12 rounded-full px-4 shadow-lg"
      >
        {open ? <X /> : <MessageCircle />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask Mira"}</span>
      </Button>
    </>
  );
}

function ChatBody({ visitorId, initial, onBusyChange }: { visitorId: string; initial: UIMessage[]; onBusyChange: (busy: boolean) => void }) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/public/assistant", body: { visitorId } }),
    [visitorId],
  );
  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: `flo-${visitorId}`,
    messages: initial,
    transport,
    onError: (e) => {
      let msg = e.message;
      try {
        msg = JSON.parse(e.message).error ?? msg;
      } catch {
        /* plain text */
      }
      toast.error(msg || "The assistant couldn't reply. Please try again.");
    },
  });
  const [voiceActive, setVoiceActive] = useState(false);
  const busy = voiceActive || status === "submitted" || status === "streaming";
  useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);
  const [text, setText] = useState("");
  const latestContactCall = messages.flatMap((m) => m.parts)
    .filter((p) => p.type === "tool-save_lead" && p.state === "output-available"
      && (p.output as { saved?: boolean } | undefined)?.saved)
    .at(-1);

  const send = (t: string) => {
    const v = t.trim();
    if (!v || busy) return;
    sendMessage({ text: v });
    setText("");
  };

  return (
    <>
      {status !== "submitted" && status !== "streaming" && <FloVoice visitorId={visitorId} onActive={setVoiceActive} onMessages={setMessages} />}
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-4">
          {messages.length === 0 && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Hi! I'm Mira. How can I help today?
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" disabled={busy} onClick={() => send(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent
                className={
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent p-0 text-foreground"
                }
              >
                {m.parts.map((p, i) => {
                  if (p.type === "text")
                    return m.role === "assistant" ? (
                      <MessageResponse key={i}>{p.text}</MessageResponse>
                    ) : (
                      <span key={i} className="whitespace-pre-wrap">{p.text}</span>
                    );
                  if (p.type === "tool-save_lead") {
                    const saved = p.state === "output-available" && (p.output as { saved?: boolean } | undefined)?.saved;
                    const details = contactDetails(p.input);
                    return (
                      <Tool key={i} defaultOpen={false}>
                        <ToolHeader type={p.type} state={p.state} title={saved ? "Your shared details" : "Sharing your details"} />
                        <ToolContent>
                          {saved && details ? (
                            <ContactSummary details={details} editable={p === latestContactCall} busy={busy}
                              onUpdate={(updated) => send(contactUpdateMessage(updated))} />
                          ) : (
                            <p className="text-sm text-muted-foreground">{p.state === "output-error" || p.state === "output-available"
                              ? "We couldn’t save your details. Please try again." : "Saving your shared details…"}</p>
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <Shimmer className="text-sm">Thinking…</Shimmer>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3">
        <PromptInput onSubmit={(msg) => send(msg.text)}>
          <PromptInputTextarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask about the studio…"
            maxLength={2000}
            disabled={voiceActive}
          />
          <PromptInputFooter className="justify-between">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <UserCheck className="h-3 w-3" /> Your details are only shared if you ask.
            </span>
            <PromptInputSubmit status={status} onStop={stop} disabled={voiceActive || (!busy && !text.trim())} />
          </PromptInputFooter>
        </PromptInput>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs"><a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3 w-3" />Chat on WhatsApp</a></Button>
          <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs"><a href={PHONE_ASSISTANT_URL}><Phone className="h-3 w-3" />Call {PHONE_ASSISTANT_NUMBER}</a></Button>
        </div>
      </div>
    </>
  );
}
