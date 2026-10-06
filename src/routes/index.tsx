import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Columns2,
  Gauge,
  History,
  Mic,
  PlayCircle,
  Radio,
  Shuffle,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Conversational AI Flows Studio — Test voice and text AI stacks side by side" },
      {
        name: "description",
        content:
          "Talk or type to AI agents, swap speech-to-text, AI model and voice providers, and compare latency and cost live — in voice and text modes. Try a free demo before signing in.",
      },
      { property: "og:title", content: "Conversational AI Flows Studio — Test voice and text AI stacks side by side" },
      {
        property: "og:description",
        content:
          "Swap speech, model and voice providers and compare latency and cost in real time — with voice and text conversations, in a free demo or the full playground.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://conversationalaistudio.online/" },
    ],
    links: [{ rel: "canonical", href: "https://conversationalaistudio.online/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://conversationalaistudio.online/#website",
              url: "https://conversationalaistudio.online/",
              name: "Conversational AI Flows Studio",
              inLanguage: "en",
            },
            {
              "@type": "WebApplication",
              "@id": "https://conversationalaistudio.online/#app",
              name: "Conversational AI Flows Studio",
              url: "https://conversationalaistudio.online/",
              description:
                "Browser-based voice and text AI test bench: swap speech-to-text, LLM and text-to-speech providers and compare latency and cost per turn, side by side, in live voice or plain text conversations. Includes a free demo that runs without an account.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any (web browser)",
              browserRequirements: "Requires a modern browser with microphone access",
              isPartOf: { "@id": "https://conversationalaistudio.online/#website" },
              featureList: [
                "Free guest demo with sample scenarios — no sign-in required",
                "Live voice and text conversations with AI agents",
                "Live speech-to-speech calls with streaming voice models (GPT Live, Gemini Live, OpenAI Realtime)",
                "Text-only mode for testing LLM stacks without speech providers",
                "Voice and text provider options: OpenAI, Google Gemini, Anthropic Claude, xAI Grok, Groq, Deepgram, ElevenLabs and Sarvam AI; live availability depends on connected keys",
                "Real-time latency metrics: time to first token, time to first audio, end-to-end voice response time",
                "Estimated token usage and cost per turn, with multi-currency display",
                "Side-by-side comparison of two agent stacks in voice or text",
                "Prebuilt industry scenarios plus custom personas and knowledge bases with per-reply passage retrieval",
                "Saved session history with per-turn metrics",
              ],
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

const STAGES = [
  { k: "STT", stage: "Recognition", value: "180", label: "Speech-to-text transcription" },
  { k: "LLM", stage: "Reasoning", value: "320", label: "Model's first token" },
  { k: "TTS", stage: "Synthesis", value: "210", label: "First spoken audio" },
];

const FEATURES = [
  {
    icon: PlayCircle,
    t: "Try before you sign in",
    d: "A free demo of the full studio — voice, text and comparisons with sample conversations — right in your browser. Real AI credits start with an account.",
  },
  {
    icon: Mic,
    t: "Live voice & text",
    d: "Talk through your mic or just type — the agent replies as it thinks, sentence by sentence, spoken or written.",
  },
  {
    icon: Shuffle,
    t: "Swap providers",
    d: "Choose OpenAI, Google Gemini, Anthropic Claude, xAI (Grok), Groq or Sarvam AI for replies; Deepgram and ElevenLabs for speech. Compare sample conversations in the demo or connect provider keys for live conversations.",
  },
  {
    icon: Gauge,
    t: "Real metrics",
    d: "Time to first token, time to first audio, end-to-end voice response time, token usage and cost for every turn.",
  },
  {
    icon: Columns2,
    t: "Compare side by side",
    d: "One message, two differently configured agents answering at the same time — in voice or text — so you can judge quality, latency and cost together.",
  },
  {
    icon: Radio,
    t: "Speech-to-speech calls",
    d: "Live voice models like GPT Live, Gemini Live and OpenAI Realtime answer with a single streaming model — no separate transcription or voice steps.",
  },
  {
    icon: BookOpen,
    t: "Scenarios & knowledge",
    d: "Run prebuilt industry scenarios — clinic, bank, online store — or write your own persona and attach knowledge bases the agent answers from.",
  },
  {
    icon: History,
    t: "History & cost",
    d: "Every session is saved with per-turn timing, token usage and estimated cost, so you can compare stacks over time — in your currency.",
  },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 shrink-0" /> Conversational AI Flows Studio
        </div>
        <Link
          to="/auth"
          className="flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
        >
          Sign in
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Voice &amp; text agent test bench</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl">
          Hear — and read — the difference between AI stacks before you commit.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Speak or type to an agent, swap the transcription, model and voice provider, and watch latency and cost tick
          up on every turn. Test in full voice or text-only mode, run two stacks side by side, and try it all free in
          the demo before you sign in.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/playground"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open the playground <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 font-medium text-foreground hover:bg-accent"
          >
            Try the free demo
          </Link>
        </div>

        <div className="mt-16 max-w-3xl rounded-lg border border-border bg-card/70 font-mono text-sm">
          <div className="p-4 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
                Voice latency benchmark
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-bold leading-none text-primary sm:text-3xl">
                  710 <span className="text-lg font-medium sm:text-xl">ms</span>
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                  Total end-to-end response time
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 overflow-hidden rounded border border-border sm:grid-cols-3">
              {STAGES.map((s, i) => (
                <div
                  key={s.k}
                  className={`min-w-0 bg-background/60 p-3 sm:p-4${
                    i > 0 ? " border-t border-border sm:border-t-0 sm:border-l" : ""
                  }`}
                >
                  <div className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                    {s.k} · {s.stage}
                  </div>
                  <div className="mt-1 whitespace-nowrap text-lg font-medium text-foreground sm:text-xl">
                    {s.value} <span className="text-xs font-normal text-muted-foreground">ms</span>
                  </div>
                  <div className="mt-2 text-[10px] leading-relaxed text-muted-foreground sm:text-xs">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">180 + 320 + 210 = 710 ms</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Measured from the moment you stop speaking to the agent's first spoken word.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="border-t border-border pt-4">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
