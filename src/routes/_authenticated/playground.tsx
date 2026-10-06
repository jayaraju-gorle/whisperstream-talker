import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Mic, MicOff, Play, RotateCcw, Send, Square } from "lucide-react";
import { LivePanel } from "@/components/playground/LivePanel";
import { KnowledgePicker } from "@/components/playground/KnowledgePicker";
import { useLibrary } from "@/hooks/use-library";
import { buildSystemPrompt, retrievalQuery, scenarioSample } from "@/lib/library";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_AGENT_A, DEFAULT_AGENT_B, type AgentConfig, type ConnectionId } from "@/lib/catalog";
import { AgentRunner, type TurnMetrics } from "@/lib/pipeline";
import { MicCapture } from "@/lib/audio/engine";
import { AgentPanel } from "@/components/playground/AgentPanel";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/playground")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Playground — Conversational AI Flows Studio" },
      { name: "description", content: "Compare voice and text agents using OpenAI, Google Gemini, Anthropic Claude, xAI Grok, Groq and Sarvam AI, with speech providers, response times and estimated costs." },
      { property: "og:title", content: "Playground — Conversational AI Flows Studio" },
      { property: "og:description", content: "Compare voice and text agents using OpenAI, Google Gemini, Anthropic Claude, xAI Grok, Groq and Sarvam AI, with speech providers, response times and estimated costs." },
    ],
  }),
  component: Playground,
});

type Turn = { id: string; user: string; assistant: string; metrics?: TurnMetrics; pending: boolean };
type Status = "transcribing" | "thinking" | "speaking" | "idle";
const LABELS = ["A", "B"] as const;

function Playground() {
  const { user } = Route.useRouteContext();
  const [mode, setMode] = useState<"voice" | "text" | "live">("voice");
  const [compare, setCompare] = useState(false);
  const [configs, setConfigs] = useState<AgentConfig[]>([DEFAULT_AGENT_A, DEFAULT_AGENT_B]);
  const [turns, setTurns] = useState<Turn[][]>([[], []]);
  const [status, setStatus] = useState<Status[]>(["idle", "idle"]);
  const [muted, setMuted] = useState([false, false]);
  const [available, setAvailable] = useState<Partial<Record<ConnectionId, boolean>>>({});
  const [micOn, setMicOn] = useState(false);
  const [micStarting, setMicStarting] = useState(false);
  const [level, setLevel] = useState(0);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [bargeIn, setBargeIn] = useState(true);
  const [silenceMs, setSilenceMs] = useState(700);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [draft, setDraft] = useState("");
  const [simulating, setSimulating] = useState(false);
  const simRef = useRef(false);
  const library = useLibrary();
  const [sessionKbs, setSessionKbs] = useState<string[]>([]);
  const libRef = useRef({ library, sessionKbs });
  libRef.current = { library, sessionKbs };

  const runners = useRef<AgentRunner[]>([new AgentRunner(DEFAULT_AGENT_A), new AgentRunner(DEFAULT_AGENT_B)]);
  const mic = useRef<MicCapture | null>(null);
  const convId = useRef<string | null>(null);
  const live = useRef({ compare, bargeIn, mode, configs });
  live.current = { compare, bargeIn, mode, configs };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/providers", { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
      if (res.ok) setAvailable(await res.json());
    })();
    return () => {
      mic.current?.stop();
      runners.current.forEach((r) => r.interrupt());
    };
  }, []);

  useEffect(() => {
    runners.current.forEach((r) => {
      r.systemFor = (cfg, history) => {
        const { library: l, sessionKbs: s } = libRef.current;
        return buildSystemPrompt(cfg.scenario, l.scenarios, l.kbs, s, retrievalQuery(history));
      };
    });
  }, []);
  useEffect(() => {
    configs.forEach((c, i) => (runners.current[i]!.config = c));
  }, [configs]);
  useEffect(() => {
    muted.forEach((m, i) => runners.current[i]!.player.setMuted(m));
  }, [muted]);
  useEffect(() => {
    if (mic.current) mic.current.vad = { silenceMs, sensitivity };
  }, [silenceMs, sensitivity]);

  const activeIdx = useMemo(() => (compare ? [0, 1] : [0]), [compare]);

  const ensureConversation = useCallback(async (title: string) => {
    if (convId.current) return convId.current;
    const { compare, mode, configs } = live.current;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: title.slice(0, 80) || "Untitled session", mode, compare, agents: configs.slice(0, compare ? 2 : 1) })
      .select("id")
      .single();
    if (error) {
      toast.error("Couldn't save this session");
      return null;
    }
    convId.current = data.id;
    return data.id;
  }, [user.id]);

  const runTurn = useCallback(
    async (input: { audio?: Blob; audioSeconds?: number; text?: string; startedAt: number; speak: boolean }) => {
      const idxs = live.current.compare ? [0, 1] : [0];
      await Promise.all(
        idxs.map(async (i) => {
          const turnId = crypto.randomUUID();
          const patch = (p: Partial<Turn>) =>
            setTurns((all) => all.map((list, j) => (j !== i ? list : list.map((t) => (t.id === turnId ? { ...t, ...p } : t)))));
          setTurns((all) => all.map((list, j) => (j !== i ? list : [...list, { id: turnId, user: input.text ?? "…", assistant: "", pending: true }])));
          try {
            const r = await runners.current[i]!.run(input, {
              onUserText: (t) => patch({ user: t }),
              onDelta: (t) => patch({ assistant: t }),
              onMetrics: (m) => patch({ metrics: m }),
              onStatus: (s) => setStatus((st) => st.map((x, j) => (j === i ? s : x))),
            });
            if (!r) {
              setTurns((all) => all.map((list, j) => (j !== i ? list : list.filter((t) => t.id !== turnId || t.assistant))));
              patch({ pending: false });
              return;
            }
            patch({ pending: false, metrics: r.metrics });
            const cid = await ensureConversation(r.userText);
            if (cid) {
              await supabase.from("turns").insert({
                conversation_id: cid,
                user_id: user.id,
                agent: LABELS[i]!,
                user_text: r.userText,
                assistant_text: r.reply,
                metrics: JSON.parse(JSON.stringify({ ...r.metrics, config: runners.current[i]!.config })),
              });
            }
          } catch (e) {
            patch({ pending: false });
            toast.error(`Agent ${LABELS[i]}: ${e instanceof Error ? e.message : "failed"}`);
          }
        }),
      );
    },
    [ensureConversation, user.id],
  );

  async function toggleMic() {
    if (micStarting) return;
    if (micOn) {
      mic.current?.stop();
      mic.current = null;
      setMicOn(false);
      setLevel(0);
      return;
    }
    const cap = new MicCapture(
      {
        onLevel: (rms, speaking) => {
          setLevel(Math.min(1, rms * 12));
          setUserSpeaking(speaking);
        },
        onSpeechStart: () => {
          if (live.current.bargeIn) runners.current.forEach((r) => r.busy && r.interrupt());
        },
        onUtterance: (wav, seconds, endedAt) => {
          const idxs = live.current.compare ? [0, 1] : [0];
          if (!live.current.bargeIn && idxs.some((i) => runners.current[i]!.busy)) return;
          runTurn({ audio: wav, audioSeconds: seconds, startedAt: endedAt, speak: true });
        },
      },
      { silenceMs, sensitivity },
    );
    setMicStarting(true);
    try {
      await cap.start();
      mic.current = cap;
      setMicOn(true);
    } catch (e) {
      toast.error(e instanceof Error && e.name === "NotAllowedError" ? "Microphone access was blocked." : "Couldn't start the microphone.");
    } finally {
      setMicStarting(false);
    }
  }

  function sendText() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    runTurn({ text, startedAt: performance.now(), speak: speakReplies });
  }

  function resetSession() {
    runners.current.forEach((r) => r.reset());
    setTurns([[], []]);
    convId.current = null;
  }

  function stopAll() {
    simRef.current = false;
    runners.current.forEach((r) => r.interrupt());
  }

  // Auto-play the scenario's sample caller lines through the active agent(s).
  async function simulate() {
    if (simRef.current) return stopAll();
    const sample = scenarioSample(configs[0]!.scenario, library.scenarios);
    if (!sample.length) return void toast.info("This scenario has no caller lines yet. Add some in the library.");
    if (micOn) await toggleMic();
    resetSession();
    simRef.current = true;
    setSimulating(true);
    const speak = mode === "voice" ? true : speakReplies;
    for (const line of sample) {
      if (!simRef.current) break;
      await runTurn({ text: line, startedAt: performance.now(), speak });
      await new Promise((res) => setTimeout(res, 600));
    }
    simRef.current = false;
    setSimulating(false);
  }

  const anyBusy = activeIdx.some((i) => status[i] !== "idle");

  return (
    <div className="flex flex-1 flex-col">
      {/* Control rail */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-4 py-3">
        <div className="flex rounded-md border border-border p-0.5 text-sm">
          {(["voice", "text", "live"] as const).map((m) => (
            <Button variant={mode === m ? "default" : "ghost"} size="sm"
              key={m}
              onClick={() => setMode(m)}
              className="capitalize"
            >
              {m === "live" ? "Live S2S" : m}
            </Button>
          ))}
        </div>
        {mode !== "live" && (
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={compare} onCheckedChange={(v) => { setCompare(v); resetSession(); }} /> Compare two agents
        </label>
        )}
        {mode === "live" ? null : mode === "voice" ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={bargeIn} onCheckedChange={setBargeIn} /> Interrupt when I speak
            </label>
            <label className="flex w-48 items-center gap-2 text-xs text-muted-foreground">
              Pause <Slider min={300} max={1500} step={50} value={[silenceMs]} onValueChange={([v]) => setSilenceMs(v ?? 700)} />
              <span className="w-12 font-mono">{silenceMs}ms</span>
            </label>
            <label className="flex w-44 items-center gap-2 text-xs text-muted-foreground">
              Mic sensitivity <Slider min={0} max={1} step={0.05} value={[sensitivity]} onValueChange={([v]) => setSensitivity(v ?? 0.5)} />
            </label>
          </>
        ) : (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={speakReplies} onCheckedChange={setSpeakReplies} /> Speak replies
          </label>
        )}
        {mode !== "live" && <KnowledgePicker kbs={library.kbs} value={sessionKbs} onChange={setSessionKbs} scenarioId={configs[0]?.scenario ?? "general"} scenarios={library.scenarios} />}
        {mode !== "live" && (
          <Button variant={simulating ? "outline" : "secondary"} size="sm" className="ml-auto" onClick={simulate}
            title="Auto-play the selected scenario's sample conversation">
            {simulating && <LoaderCircle className="h-3.5 w-3.5 motion-safe:animate-spin" />}
            {simulating ? <Square className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            {simulating ? "Stop simulation" : "Simulate scenario"}
          </Button>
        )}
        <Button variant="ghost" size="sm" className={mode === "live" ? "ml-auto" : ""} onClick={resetSession}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New session
        </Button>
      </div>

      {mode === "live" ? <LivePanel available={available} library={library} /> : (<>
      {/* Agents */}
      <div className={cn("grid flex-1 gap-px bg-border", compare ? "md:grid-cols-2" : "grid-cols-1")}>
        {activeIdx.map((i) => (
          <AgentPanel
            key={i}
            label={LABELS[i]!}
            config={configs[i]!}
            onConfig={(c) => setConfigs((all) => all.map((x, j) => (j === i ? c : x)))}
            available={available}
            customScenarios={library.scenarios}
            turns={turns[i]!}
            status={status[i]!}
            voice={mode === "voice"}
            muted={muted[i]!}
            onMute={() => setMuted((m) => m.map((x, j) => (j === i ? !x : x)))}
            wide={!compare}
          />
        ))}
      </div>

      {/* Input dock */}
      <div className="sm:sticky sm:bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        {mode === "voice" ? (
          <div className="mx-auto flex max-w-3xl items-center gap-4">
            <Button variant="ghost" size="icon" loading={micStarting}
              onClick={toggleMic}
              aria-label={micStarting ? "Starting microphone" : micOn ? "Turn microphone off" : "Turn microphone on"}
              className={cn(
                "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                micOn ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary",
              )}
            >
              {micOn && (
                <span
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  style={{ transform: `scale(${1 + level * 0.6})`, opacity: 0.6 - level * 0.3 }}
                />
              )}
              {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex h-8 items-end gap-[3px]">
                {Array.from({ length: 48 }).map((_, k) => {
                  const h = micOn ? Math.max(0.08, level * (0.5 + 0.5 * Math.sin(k * 1.7 + level * 10))) : 0.08;
                  return <div key={k} className={cn("flex-1 rounded-sm", userSpeaking ? "bg-primary" : "bg-muted-foreground/40")} style={{ height: `${h * 100}%` }} />;
                })}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {micStarting ? "Starting microphone… allow microphone access if prompted." : !micOn
                  ? "Tap the mic and start talking. Headphones stop the agent from hearing itself."
                  : userSpeaking
                    ? "Listening…"
                    : anyBusy
                      ? "Agent responding — speak to interrupt"
                      : "Ready. Speak naturally and pause when you're done."}
              </p>
            </div>
            {anyBusy && (
              <Button variant="outline" size="sm" onClick={stopAll}>
                <Square className="mr-1.5 h-3.5 w-3.5" /> Stop
              </Button>
            )}
          </div>
        ) : (
          <form className="mx-auto flex max-w-3xl items-end gap-2" onSubmit={(e) => { e.preventDefault(); sendText(); }}>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              placeholder={compare ? "Type once — both agents answer" : "Type a message"}
              rows={1}
              className="min-h-10 resize-none"
            />
            {anyBusy ? (
              <Button type="button" variant="outline" onClick={stopAll} aria-label="Stop reply"><LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /><Square className="h-4 w-4" /></Button>
            ) : (
              <Button type="submit" aria-label="Send message" disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
            )}
          </form>
        )}
      </div>
      </>)}
    </div>
  );
}

