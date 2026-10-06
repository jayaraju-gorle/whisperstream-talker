import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Play, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";
import { useCurrency } from "@/hooks/use-currency";
import { LANGUAGES, PROVIDERS, S2S_MODELS, SCENARIOS, modelAvailable, type ConnectionId } from "@/lib/catalog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KnowledgePicker } from "./KnowledgePicker";
import { buildSystemPrompt, type CustomScenario, type KnowledgeBase } from "@/lib/library";

type Line = { role: "user" | "assistant"; text: string };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function LivePanel({
  available,
  library,
}: {
  available: Partial<Record<ConnectionId, boolean>>;
  library: { scenarios: CustomScenario[]; kbs: KnowledgeBase[] };
}) {
  const [sessionKbs, setSessionKbs] = useState<string[]>([]);
  const { fmt } = useCurrency();
  const [modelId, setModelId] = useState(S2S_MODELS[0]!.id);
  const model = S2S_MODELS.find((m) => m.id === modelId)!;
  const [voice, setVoice] = useState(model.voices[0]!.id);
  const [scenario, setScenario] = useState("general");
  const [language, setLanguage] = useState("auto");
  const [lines, setLines] = useState<Line[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [firstAudioMs, setFirstAudioMs] = useState<number | null>(null);
  const startedAt = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);

  const call = useLiveVoice({
    startPayload: async () => {
      const { data } = await supabase.auth.getSession();
      const persona = buildSystemPrompt(scenario, library.scenarios, library.kbs, sessionKbs);
      return { token: data.session?.access_token ?? "", scenario, voice, language, persona };
    },
    onEvent: (e: LiveEvent) => {
      if (e.type === "gateway.session.created") setSeconds(15);
      if ((e.type === "session.usage.updated" || e.type === "session.closed") && typeof e.usage?.seconds === "number") {
        setSeconds(Math.max(15, e.usage.seconds));
      }
      if (e.type === "session.input_transcript.delta" || e.type === "session.output_transcript.delta") {
        const role = e.type === "session.input_transcript.delta" ? "user" : "assistant";
        const delta = typeof e["delta"] === "string" ? (e["delta"] as string) : "";
        if (!delta) return;
        if (role === "assistant" && startedAt.current && firstAudioMs == null) {
          setFirstAudioMs(performance.now() - startedAt.current);
        }
        setLines((all) => {
          const last = all[all.length - 1];
          if (last && last.role === role) return [...all.slice(0, -1), { role, text: last.text + delta }];
          return [...all, { role, text: delta.trimStart() }];
        });
      }
    },
  });

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const active = call.status === "connecting" || call.status === "connected" || call.status === "stopping";
  const ok = model.ready && modelAvailable(model, available);

  function start() {
    setLines([]);
    setSeconds(0);
    setFirstAudioMs(null);
    startedAt.current = performance.now();
    call.start();
  }

  return (
    <section className="flex min-h-[60vh] min-w-0 flex-col bg-background">
      <div className="grid gap-4 border-b border-border p-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="min-w-0">
          <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <span className="font-mono text-sm font-bold text-agent-a">LIVE S2S</span>
            <span className="text-xs text-muted-foreground">One model listens and speaks — no separate STT or TTS.</span>
          </div>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5">
            <Field label="Speech-to-speech model">
              <Select value={modelId} disabled={active} onValueChange={(v) => {
                setModelId(v);
                setVoice(S2S_MODELS.find((m) => m.id === v)!.voices[0]!.id);
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {S2S_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} disabled={!m.ready} className="text-xs">
                      {m.label}{!m.ready && ` · needs ${PROVIDERS[m.provider].label} key`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Voice">
              <Select value={voice} disabled={active} onValueChange={setVoice}>
                <SelectTrigger className="h-8 text-xs capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {model.voices.map((v) => <SelectItem key={v.id} value={v.id} className="text-xs capitalize">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Scenario">
              <Select value={scenario} disabled={active} onValueChange={setScenario}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider">Built-in</SelectLabel>
                    {SCENARIOS.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>)}
                  </SelectGroup>
                  {library.scenarios.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-[10px] uppercase tracking-wider">My scenarios</SelectLabel>
                      {library.scenarios.map((s) => <SelectItem key={s.id} value={`custom:${s.id}`} className="text-xs">{s.label}</SelectItem>)}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Knowledge">
              <div><KnowledgePicker kbs={library.kbs} value={sessionKbs} onChange={setSessionKbs} disabled={active} scenarioId={scenario} scenarios={library.scenarios} /></div>
            </Field>
            <Field label="Language">
              <Select value={language} disabled={active} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <div className="min-w-0 space-y-2 self-end">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border">
            {[
              ["Status", call.status],
              ["First reply", firstAudioMs != null ? `${Math.round(firstAudioMs)} ms` : "—"],
              ["Billed", seconds ? `${Math.round(seconds)} s · ${fmt((seconds / 60) * model.usdPerMinute)}` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0 break-words bg-background px-2.5 py-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className={cn("mt-0.5 font-mono text-sm tabular-nums", k === "Billed" && "text-primary")}>{v}</div>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/70">
            Billed per second with a 15 s minimum per call. Costs are estimates.
          </p>
        </div>
      </div>

      <div ref={scroller} className="min-w-0 flex-1 space-y-3 overflow-y-auto break-words p-4" style={{ maxHeight: "55vh" }}>
        {lines.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            {active ? "Connecting… the agent will greet you." : "Start a call and talk naturally — you can interrupt any time."}
          </p>
        )}
        {lines.map((l, i) =>
          l.role === "user" ? (
            <div key={i} className="ml-auto w-fit max-w-[85%] rounded-lg bg-secondary px-3 py-2 text-sm">{l.text}</div>
          ) : (
            <p key={i} className="max-w-[90%] text-sm leading-relaxed">{l.text}</p>
          ),
        )}
      </div>

      <div className="sm:sticky sm:bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
          {!active ? (
            <Button onClick={start} disabled={!ok}>
              <Radio className="mr-1.5 h-4 w-4" /> Start live call
            </Button>
          ) : (
            <>
              <Button variant="destructive" onClick={call.stop} disabled={call.status === "stopping"}>
                <PhoneOff className="mr-1.5 h-4 w-4" /> End call
              </Button>
              <Button variant="outline" onClick={() => call.setMuted(!call.muted)} disabled={call.status !== "connected"}>
                {call.muted ? <MicOff className="mr-1.5 h-4 w-4" /> : <Mic className="mr-1.5 h-4 w-4" />}
                {call.muted ? "Unmute" : "Mute"}
              </Button>
            </>
          )}
          {call.playbackBlocked && (
            <Button variant="outline" onClick={call.resumePlayback}><Play className="mr-1.5 h-4 w-4" /> Play audio</Button>
          )}
          {call.error && <span className="text-xs text-destructive">{call.error}</span>}
          <audio ref={call.audioRef} className="hidden" />
        </div>
      </div>
    </section>
  );
}
