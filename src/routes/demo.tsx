import { DEFAULT_COMPARE } from "@/lib/studio-defaults";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, History, LoaderCircle, Mic, MicOff, PhoneOff, Play, Radio, RotateCcw, Send, Square } from "lucide-react";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Logo } from "@/components/Logo";
import { AgentPanel, type PlaygroundTurn } from "@/components/playground/AgentPanel";
import { DemoLibrary } from "@/components/playground/DemoLibrary";
import { KnowledgePicker } from "@/components/playground/KnowledgePicker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_AGENT_A, DEFAULT_AGENT_B, LANGUAGES, S2S_MODELS, SCENARIOS, type AgentConfig } from "@/lib/catalog";
import { builtInKnowledge, scenarioSample, type CustomScenario, type KnowledgeBase } from "@/lib/library";
import { demoMetrics, demoReply } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { LoadingIndicator } from "@/components/LoadingIndicator";

export const Route = createFileRoute("/demo")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Guest demo — Conversational AI Flows Studio" },
      { name: "description", content: "Compare sample conversations with OpenAI, Google Gemini, Anthropic Claude and xAI Grok model options without using AI credits." },
      { property: "og:title", content: "Guest demo — Conversational AI Flows Studio" },
      { property: "og:description", content: "Compare sample conversations with OpenAI, Google Gemini, Anthropic Claude and xAI Grok model options without using AI credits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://conversationalaistudio.online/demo" },
    ],
    links: [{ rel: "canonical", href: "https://conversationalaistudio.online/demo" }],
  }),
  component: Demo,
});

type Mode = "voice" | "text" | "live";
function Demo() {
  const [mode, setMode] = useState<Mode>("voice");
  const [compare, setCompare] = useState(DEFAULT_COMPARE);
  const [configs, setConfigs] = useState<AgentConfig[]>([DEFAULT_AGENT_A, DEFAULT_AGENT_B]);
  const [turns, setTurns] = useState<PlaygroundTurn[][]>([[], []]);
  const [muted, setMuted] = useState([false, false]);
  const [bargeIn, setBargeIn] = useState(true);
  const [silenceMs, setSilenceMs] = useState(700);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [liveMuted, setLiveMuted] = useState(false);
  const [modelId, setModelId] = useState(S2S_MODELS[0]?.id ?? "");
  const model = S2S_MODELS.find((m) => m.id === modelId);
  const [voice, setVoice] = useState(model?.voices[0]?.id ?? "");
  const [scenarios, setScenarios] = useState<CustomScenario[]>([]);
  const [kbs, setKbs] = useState<KnowledgeBase[]>(builtInKnowledge);
  const [sessionKbs, setSessionKbs] = useState<string[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{ id: string; title: string; turns: PlaygroundTurn[][] }[]>([]);
  const generation = useRef(0);
  const state = useRef({ configs, compare, turns, scenarios, kbs, sessionKbs, muted, mode, speakReplies });
  state.current = { configs, compare, turns, scenarios, kbs, sessionKbs, muted, mode, speakReplies };
  useEffect(() => () => { generation.current++; }, []);
  const config = configs[0] ?? DEFAULT_AGENT_A;
  const samples = scenarioSample(config.scenario, scenarios);

  function stop() { generation.current++; setBusy(false); setSimulating(false); }
  function reset() {
    stop(); setLiveActive(false);
    const current = state.current.turns;
    if (current.some((list) => list.length)) setHistory((h) => [{ id: crypto.randomUUID(), title: current[0]?.[0]?.user ?? "Sample session", turns: current }, ...h]);
    setTurns([[], []]);
  }
  async function runSample(text: string, ticket = generation.current) {
    if (!text.trim()) return;
    const s = state.current;
    const active = s.compare && s.mode !== "live" ? [0, 1] : [0];
    const additions = active.map((i) => {
      const cfg = s.configs[i] ?? DEFAULT_AGENT_A;
      const reply = demoReply(cfg, text, s.turns[i]?.length ?? 0, s.scenarios, s.kbs, s.sessionKbs);
      return { index: i, turn: { id: crypto.randomUUID(), user: text, assistant: reply, pending: true, metrics: demoMetrics(cfg, i, s.mode !== "text", text, reply, s.mode !== "text" || s.speakReplies) } };
    });
    setBusy(true);
    setTurns((all) => all.map((list, i) => { const item = additions.find((a) => a.index === i); return item ? [...list, { id: item.turn.id, user: text, assistant: "", pending: true }] : list; }));
    const count = Math.max(...additions.map((a) => a.turn.assistant.length));
    for (let end = 32; end < count + 32; end += 32) {
      await new Promise((r) => setTimeout(r, 35));
      if (ticket !== generation.current) {
        setTurns((all) => all.map((list) => list.map((t) => additions.some((a) => a.turn.id === t.id) ? { ...t, pending: false } : t)));
        return;
      }
      setTurns((all) => all.map((list) => list.map((t) => {
        const a = additions.find((a) => a.turn.id === t.id);
        return a ? { ...a.turn, assistant: a.turn.assistant.slice(0, end), pending: end < a.turn.assistant.length } : t;
      })));
    }
    setBusy(false);
  }
  async function simulate() {
    if (simulating) return stop();
    reset(); const ticket = generation.current; setSimulating(true);
    for (const line of samples) {
      if (ticket !== generation.current) return;
      await runSample(line, ticket);
      await new Promise((r) => setTimeout(r, 350));
    }
    if (ticket === generation.current) setSimulating(false);
  }
  function sendText() { if (!draft.trim() || busy) return; const text = draft.trim(); setDraft(""); void runSample(text); }
  function setConfig(c: AgentConfig, index = 0) { setConfigs((all) => all.map((old, i) => i === index ? c : old)); }
  function changeMode(next: Mode) { reset(); setMode(next); }
  function scenarioSelect() {
    return <Select value={config.scenario} disabled={liveActive} onValueChange={(scenario) => setConfig({ ...config, scenario })}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{[...SCENARIOS, ...scenarios.map((s) => ({ ...s, id: `custom:${s.id}` }))].map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select>;
  }

  return <div className="flex min-h-screen flex-col">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur">
      <Link to="/" className="col-span-2 flex min-w-0 items-center gap-2 font-semibold"><Logo className="h-6 w-6 shrink-0" /><span>Conversational AI Flows Studio</span></Link>
      <nav className="col-span-2 flex min-w-0 items-center gap-1 text-sm sm:col-span-1"><Button variant="secondary" size="sm" onClick={() => { setLibraryOpen(false); setHistoryOpen(false); }}>Playground</Button><Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}><History className="h-3.5 w-3.5" /> History</Button><Button variant="ghost" size="sm" onClick={() => setLibraryOpen(true)}><BookOpen className="h-3.5 w-3.5" /> Library</Button></nav>
      <div className="col-span-2 flex flex-wrap items-center justify-end gap-3 sm:col-span-1"><span className="font-mono text-xs text-primary">GUEST DEMO</span><CurrencySelect /><Button asChild variant="outline" size="sm"><Link to="/auth">Sign in</Link></Button></div>
    </header>
    <div className="border-b border-border bg-secondary/40 px-4 py-2 text-center text-xs text-muted-foreground">Interactive samples only · no AI credits used · replies, audio activity and metrics are illustrative. <Link to="/auth" className="text-primary underline">Sign in for real AI conversations and saved sessions.</Link></div>
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-4 py-3">
      <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Demo mode">{(["voice", "text", "live"] as const).map((m) => <Button size="sm" key={m} variant={mode === m ? "default" : "ghost"} className="capitalize" onClick={() => changeMode(m)}>{m === "live" ? "Live S2S" : m}</Button>)}</div>
      {mode !== "live" && <label className="flex items-center gap-2 text-sm"><Switch checked={compare} onCheckedChange={(v) => { reset(); setCompare(v); }} /> Compare two agents</label>}
      {mode === "voice" && <><label className="flex items-center gap-2 text-sm"><Switch checked={bargeIn} onCheckedChange={setBargeIn} /> Interrupt when I speak</label><label className="flex w-48 items-center gap-2 text-xs text-muted-foreground">Pause<Slider min={300} max={1500} step={50} value={[silenceMs]} onValueChange={([v]) => setSilenceMs(v ?? 700)} /><span className="w-12 shrink-0 font-mono">{silenceMs}ms</span></label><label className="flex w-44 items-center gap-2 text-xs text-muted-foreground">Mic sensitivity<Slider min={0} max={1} step={0.05} value={[sensitivity]} onValueChange={([v]) => setSensitivity(v ?? 0.5)} /></label></>}
      {mode === "text" && <label className="flex items-center gap-2 text-sm"><Switch checked={speakReplies} onCheckedChange={setSpeakReplies} /> Speak replies</label>}
      {mode !== "live" && <><KnowledgePicker kbs={kbs} scenarios={scenarios} value={sessionKbs} scenarioId={config.scenario} onChange={setSessionKbs} onManage={() => setLibraryOpen(true)} /><Button variant={simulating ? "outline" : "secondary"} size="sm" className="ml-auto" disabled={!samples.length || (busy && !simulating)} onClick={() => void simulate()}>{simulating && <LoaderCircle className="motion-safe:animate-spin" />}{simulating ? <Square /> : <Play />}{simulating ? "Stop simulation" : "Simulate scenario"}</Button></>}
      <Button variant="ghost" size="sm" className={mode === "live" ? "ml-auto" : ""} onClick={reset}><RotateCcw /> New session</Button>
    </div>
    {mode === "live" ? <section className="flex flex-1 flex-col bg-background">
      <div className="grid gap-4 border-b border-border p-4 lg:grid-cols-[minmax(0,420px)_1fr]"><div className="min-w-0"><div className="mb-3 font-mono text-sm font-bold text-agent-a">LIVE S2S</div><div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5">
        <label className="min-w-0 space-y-1 text-xs text-muted-foreground">Speech-to-speech model<Select value={modelId} disabled={liveActive} onValueChange={(v) => { setModelId(v); setVoice(S2S_MODELS.find((m) => m.id === v)?.voices[0]?.id ?? ""); }}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{S2S_MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent></Select></label>
        <label className="min-w-0 space-y-1 text-xs text-muted-foreground">Voice<Select value={voice} disabled={liveActive} onValueChange={setVoice}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{model?.voices.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}</SelectContent></Select></label>
        <label className="min-w-0 space-y-1 text-xs text-muted-foreground">Scenario{scenarioSelect()}</label><div className="min-w-0 space-y-1 text-xs text-muted-foreground">Knowledge<KnowledgePicker kbs={kbs} scenarios={scenarios} value={sessionKbs} scenarioId={config.scenario} onChange={setSessionKbs} disabled={liveActive} onManage={() => setLibraryOpen(true)} /></div>
        <label className="min-w-0 space-y-1 text-xs text-muted-foreground">Language<Select value={config.language} disabled={liveActive} onValueChange={(language) => setConfig({ ...config, language })}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent></Select></label>
      </div></div><div className="min-w-0 self-end"><div className="grid grid-cols-3 gap-px rounded border border-border bg-border">{[["Status", liveActive ? (busy ? "responding" : "connected") : "idle"], ["First reply", turns[0]?.length ? "710 ms (sample)" : "—"], ["Credits used", "0"]].map(([k, v]) => <div key={k} className="min-w-0 break-words bg-background p-2.5"><div className="font-mono text-[10px] uppercase text-muted-foreground">{k}</div><div className="mt-1 font-mono text-sm">{v}</div></div>)}</div><p className="mt-2 text-xs text-muted-foreground">Sample call only. No microphone, provider connection or billing.</p></div></div>
      <div className="min-h-64 min-w-0 flex-1 space-y-4 break-words p-4">{!turns[0]?.length && <p className="pt-10 text-center text-sm text-muted-foreground">Start a sample call.</p>}{turns[0]?.map((t) => <div key={t.id} className="space-y-2"><p className="ml-auto w-fit max-w-[85%] rounded-lg bg-secondary px-3 py-2 text-sm">{t.user}</p><p className="max-w-[90%] text-sm leading-relaxed">{t.assistant || <LoadingIndicator label="Preparing sample reply…" />}</p></div>)}</div>
      <div className="sm:sticky sm:bottom-0 border-t border-border bg-background p-4"><div className="mx-auto flex max-w-3xl flex-wrap gap-3">{!liveActive ? <Button onClick={() => { setLiveActive(true); void runSample(samples[0] ?? "Hello"); }}><Radio /> Start live call · sample</Button> : <><Button variant="destructive" onClick={() => { stop(); setLiveActive(false); }}><PhoneOff /> End call</Button><Button variant="outline" onClick={() => setLiveMuted(!liveMuted)}>{liveMuted ? <MicOff /> : <Mic />}{liveMuted ? "Unmute" : "Mute"}</Button><Button variant="secondary" loading={busy} loadingLabel="Replying…" disabled={liveMuted} onClick={() => void runSample(samples[(turns[0]?.length ?? 0) % Math.max(samples.length, 1)] ?? "Hello")}><Play /> Next sample line</Button></>}</div></div>
    </section> : <>
      <div className={cn("grid flex-1 gap-px bg-border", compare ? "md:grid-cols-2" : "grid-cols-1")}>{(compare ? [0, 1] : [0]).map((i) => <AgentPanel key={i} label={i ? "B" : "A"} config={configs[i] ?? DEFAULT_AGENT_A} onConfig={(c) => setConfig(c, i)} available={{}} customScenarios={scenarios} turns={turns[i] ?? []} status={busy ? "thinking" : "idle"} voice={mode === "voice"} stt={mode === "voice"} tts={mode === "voice" || speakReplies} muted={muted[i] ?? false} onMute={() => setMuted((all) => all.map((m, j) => i === j ? !m : m))} wide={!compare} sample />)}</div>
      <div className="sm:sticky sm:bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        {mode === "voice" ? <div className="mx-auto flex max-w-3xl items-center gap-4"><Button variant={busy ? "default" : "outline"} size="icon" className="h-14 w-14 shrink-0 rounded-full border-2" aria-label={busy ? "Stop sample voice" : "Play sample voice turn"} disabled={busy && !bargeIn} onClick={() => { if (busy) stop(); else void runSample(samples[(turns[0]?.length ?? 0) % Math.max(samples.length, 1)] ?? "Hello"); }}>{busy ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}</Button><div className="min-w-0 flex-1"><div className="flex h-8 items-end gap-[3px]" aria-label="Sample audio activity">{Array.from({ length: 48 }, (_, i) => <div key={i} className={cn("flex-1 rounded-sm", busy ? "bg-primary motion-safe:animate-pulse" : "bg-muted-foreground/40")} style={{ height: busy ? `${20 + ((i * 37) % 80)}%` : "8%" }} />)}</div><p className="mt-1 font-mono text-xs text-muted-foreground">{busy ? "Sample agent responding" : "Play a sample voice turn · no microphone recording or audio generated"}</p></div>{busy && <Button variant="outline" size="sm" onClick={stop}><Square /> Stop</Button>}</div> : <form className="mx-auto flex max-w-3xl items-end gap-2" onSubmit={(e) => { e.preventDefault(); sendText(); }}><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }} placeholder={compare ? "Type once — both agents show sample replies" : "Type a message for a sample reply"} rows={1} className="min-h-10 resize-none" />{busy ? <Button type="button" variant="outline" aria-label="Stop reply" onClick={stop}><LoaderCircle className="motion-safe:animate-spin" /><Square /></Button> : <Button type="submit" aria-label="Send message" disabled={!draft.trim()}><Send /></Button>}</form>}
        <div className="mx-auto mt-3 flex max-w-3xl flex-wrap gap-2">{samples.map((line, i) => <Button key={i} size="sm" variant="outline" className="h-auto max-w-full whitespace-normal text-left" disabled={busy || simulating} onClick={() => void runSample(line)}>{line}</Button>)}</div>
      </div>
    </>}
    <DemoLibrary open={libraryOpen} onOpenChange={setLibraryOpen} scenarios={scenarios} kbs={kbs} onScenarios={setScenarios} onKbs={setKbs} onRun={(scenario) => { reset(); setConfig({ ...config, scenario }); }} />
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Demo history</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">Sample sessions stay here until you refresh. Sign in to save real conversations.</p>{!history.length && <p className="text-sm text-muted-foreground">No previous sessions. Start a new session to keep the current sample here.</p>}{history.map((h) => <div key={h.id} className="border-t border-border py-3"><Button variant="ghost" className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => { stop(); setTurns(h.turns); setHistoryOpen(false); }}>{h.title}</Button><p className="text-xs text-muted-foreground">{h.turns[0]?.length ?? 0} sample turns</p></div>)}</DialogContent></Dialog>
  </div>;
}
