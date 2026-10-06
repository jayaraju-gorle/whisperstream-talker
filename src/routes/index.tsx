import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Columns2, Gauge, Mic, Shuffle } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Conversational AI Flows Studio — Test voice and text AI stacks side by side" },
      {
        name: "description",
        content:
          "Talk or type to AI agents, swap speech-to-text, AI model and voice providers, and compare latency and cost live — in voice and text modes.",
      },
      { property: "og:title", content: "Conversational AI Flows Studio — Test voice and text AI stacks side by side" },
      {
        property: "og:description",
        content: "Swap speech, model and voice providers and compare latency and cost in real time — with both voice and text conversations.",
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
                "Browser-based voice and text AI test bench: swap speech-to-text, LLM and text-to-speech providers and compare latency and cost per turn, side by side, in live voice or plain text conversations.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any (web browser)",
              browserRequirements: "Requires a modern browser with microphone access",
              isPartOf: { "@id": "https://conversationalaistudio.online/#website" },
              featureList: [
                "Live voice and text conversations with AI agents",
                "Text-only mode for testing LLM stacks without speech providers",
                "Swappable STT, LLM and TTS providers (OpenAI, Groq, Deepgram, ElevenLabs, Lovable AI)",
                "Real-time latency metrics: time to first token, time to first audio, voice-to-voice",
                "Estimated cost per turn and per session",
                "Side-by-side comparison of two agent stacks in voice or text",
                "Saved session history",
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
  { k: "STT", label: "Speech to text", ms: "180 ms" },
  { k: "LLM", label: "First token", ms: "320 ms" },
  { k: "TTS", label: "First audio", ms: "210 ms" },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 shrink-0" /> Conversational AI Flows Studio
        </div>
        <Link to="/auth" className="flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm text-muted-foreground hover:text-foreground">
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
          up on every turn. Test in full voice or text-only mode, and run two stacks side by side.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/playground"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open the playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-16 rounded-lg border border-border bg-card/70 p-5 font-mono text-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>turn 04 · voice-to-voice</span>
            <span className="text-primary">710 ms</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border">
            {STAGES.map((s) => (
              <div key={s.k} className="min-w-0 bg-background p-2 sm:p-4">
                <div className="text-xs text-muted-foreground">{s.k}</div>
                <div className="mt-1 whitespace-nowrap text-lg text-foreground sm:text-2xl">{s.ms}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-4">
          {[
            { icon: Mic, t: "Live voice & text", d: "Talk through your mic or just type — the agent replies as it thinks, sentence by sentence, spoken or written." },
            { icon: Shuffle, t: "Swap providers", d: "Lovable AI, OpenAI, Groq, Deepgram and ElevenLabs for each step — or skip speech entirely in text mode." },
            { icon: Gauge, t: "Real metrics", d: "Time to first token, time to first audio, voice-to-voice latency and cost per step." },
            { icon: Columns2, t: "Compare", d: "One message, two differently configured agents answering side by side — in voice or text." },
          ].map(({ icon: Icon, t, d }) => (
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
