import { CurrencySelect } from "@/components/CurrencySelect";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Send } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AgentConfigForm } from "@/components/playground/AgentConfigForm";
import { MetricsStrip, TurnMetricLine } from "@/components/playground/MetricsStrip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_AGENT_A, DEFAULT_AGENT_B, type AgentConfig } from "@/lib/catalog";
import { computeCost } from "@/lib/catalog";
import type { TurnMetrics } from "@/lib/pipeline";

export const Route = createFileRoute("/demo")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Guest demo — Conversational AI Flows Studio" },
      { name: "description", content: "Explore a sample voice and text AI comparison without signing in." },
      { property: "og:title", content: "Guest demo — Conversational AI Flows Studio" },
      { property: "og:description", content: "Explore a sample voice and text AI comparison without signing in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://conversationalaistudio.online/demo" },
    ],
    links: [{ rel: "canonical", href: "https://conversationalaistudio.online/demo" }],
  }),
  component: Demo,
});

const examples = [
  { question: "How can I compare two AI agents?", a: "Try the same prompt with two configurations. Compare their first-response time, full reply, and estimated cost to choose the right fit.", b: "Set up both agents, then send one message to both. Review their answers alongside latency and cost estimates." },
  { question: "Can I test with text instead of speaking?", a: "Yes. Text mode sends your message to the model without transcription. You can still compare two agents side by side.", b: "Absolutely. Switch to text mode to compare model replies without a microphone or speech synthesis." },
];

function sampleMetrics(cfg: AgentConfig, index: number, voice: boolean): TurnMetrics {
  const usage = { audioSeconds: voice ? 2.4 : 0, inputTokens: 34, outputTokens: index ? 31 : 38, ttsChars: voice ? 153 : 0 };
  return { sttMs: voice ? 180 + index * 40 : undefined, llmTtfbMs: 320 + index * 90, ttsTtfbMs: voice ? 210 + index * 30 : undefined, v2vMs: voice ? 710 + index * 160 : 320 + index * 90, ...usage, cost: computeCost(cfg, usage) };
}

function Demo() {
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [compare, setCompare] = useState(true);
  const [configs, setConfigs] = useState<AgentConfig[]>([DEFAULT_AGENT_A, DEFAULT_AGENT_B]);
  const [example, setExample] = useState(0);
  const [showTurn, setShowTurn] = useState(true);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold"><Logo className="h-6 w-6" /> Conversational AI Flows Studio</Link>
        <span className="font-mono text-xs text-primary">GUEST DEMO</span>
        <div className="ml-auto"><CurrencySelect /></div>
        <Button asChild variant="outline" size="sm"><Link to="/auth">Sign in to test live <ArrowRight /></Link></Button>
      </header>
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 text-sm">
        <div className="flex rounded border border-border p-0.5" role="group" aria-label="Demo mode">
          {(["voice", "text"] as const).map((m) => <Button key={m} size="sm" variant={mode === m ? "default" : "ghost"} onClick={() => setMode(m)} className="capitalize">{m}</Button>)}
        </div>
        <label className="flex items-center gap-2"><Switch checked={compare} onCheckedChange={setCompare} /> Compare two agents</label>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setShowTurn(false); setExample(0); }}><RotateCcw /> Reset</Button>
      </div>
      <div className="border-b border-border bg-secondary/40 px-4 py-2 text-center text-xs text-muted-foreground">Sample conversation and illustrative metrics only. No AI requests are made; sign in to test live agents and save sessions.</div>
      <main className={`grid flex-1 gap-px bg-border ${compare ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {configs.slice(0, compare ? 2 : 1).map((cfg, i) => {
          const metrics = sampleMetrics(cfg, i, mode === "voice");
          return <section key={i} className="flex min-h-[55vh] flex-col bg-background p-4">
            <div className="mb-3 flex items-center gap-2"><span className={`font-mono text-sm font-bold ${i ? "text-agent-b" : "text-agent-a"}`}>AGENT {i ? "B" : "A"}</span><span className="text-xs text-muted-foreground">Sample setup</span></div>
            <div className="grid gap-5">
              <AgentConfigForm config={cfg} onChange={(c) => setConfigs((all) => all.map((old, j) => j === i ? c : old))} available={{}} />
              <div className="self-end"><MetricsStrip m={showTurn ? metrics : undefined} voice={mode === "voice"} /><p className="mt-2 font-mono text-[10px] text-muted-foreground">Illustrative timing and estimated costs, not a live measurement.</p></div>
            </div>
            <div className="mt-6 space-y-4 border-t border-border pt-5">
              {showTurn ? <>
                <p className="ml-auto w-fit max-w-[85%] rounded bg-secondary px-3 py-2 text-sm">{examples[example]?.question}</p>
                <div className="max-w-[90%]"><p className="text-sm leading-relaxed">{i ? examples[example]?.b : examples[example]?.a}</p><TurnMetricLine m={metrics} /></div>
              </> : <p className="pt-6 text-center text-sm text-muted-foreground">Choose a sample message below.</p>}
            </div>
          </section>;
        })}
      </main>
      <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <span className="mr-2 text-xs text-muted-foreground">Sample messages</span>
          {examples.map((item, i) => <Button key={i} variant="outline" size="sm" onClick={() => { setExample(i); setShowTurn(true); }}>{item.question} <Send /></Button>)}
          <Button asChild variant="ghost" size="sm" className="ml-auto"><Link to="/"><ArrowLeft /> Home</Link></Button>
        </div>
      </div>
    </div>
  );
}