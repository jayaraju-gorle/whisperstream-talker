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
  MessageCircle,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PHONE_ASSISTANT_NUMBER, PHONE_ASSISTANT_URL, WHATSAPP_ASSISTANT_URL } from "@/lib/flo-voice";

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
                "Live speech-to-speech calls with streaming voice models (OpenAI Realtime, Gemini Live)",
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
    t: "Build your own combination",
    d: "Mix speech-to-text (STT), language models (LLMs) and text-to-speech (TTS). Choose OpenAI, Gemini, Claude, Grok, Groq, Sarvam AI, Deepgram and ElevenLabs options, including built-in models and connected providers.",
  },
  {
    icon: Gauge,
    t: "Measure speed & price",
    d: "See how long each step takes, how soon the bot starts replying, and the estimated cost of each conversation — displayed in your chosen currency.",
  },
  {
    icon: Columns2,
    t: "Compare side by side",
    d: "One message, two differently configured agents answering at the same time — in voice or text — so you can judge quality, latency and cost together.",
  },
  {
    icon: Radio,
    t: "Speech-to-speech calls",
    d: "Live voice models like OpenAI Realtime and Gemini Live answer with a single streaming model — no separate transcription or voice steps.",
  },
  {
    icon: BookOpen,
    t: "Scenarios & knowledge",
    d: "Run prebuilt industry scenarios — clinic, bank, online store — or write your own persona and attach knowledge bases the agent answers from.",
  },
  {
    icon: History,
    t: "Explore languages & voices",
    d: "Choose from each provider’s supported languages and voices. Hear how an agent sounds, judge its replies, and revisit saved playground sessions with their timing and costs.",
  },
];

function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 shrink-0" /> Conversational AI Flows Studio
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={user ? "/playground" : "/auth"}>{user ? "Playground" : "Sign in"}</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">For conversational AI builders</p>
        <h1 className="mt-4 w-full text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl">
          Compare conversational AI setups.
        </h1>
        <p className="mt-6 w-full text-lg text-muted-foreground">
          Talk or type once. Experience two AI agents side by side. Mix language models, speech-to-text and
          text-to-speech, then choose languages and voices to find the right setup for your product.
        </p>
        <p className="mt-3 text-base text-muted-foreground">
          Judge the replies yourself. Compare response speed and estimated cost on every turn — not just a model’s specifications.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/playground">Open the playground <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild variant="outline" size="lg"><Link to="/demo">Try the free demo</Link></Button>
          <Button asChild variant="outline" size="lg"><a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Chat on WhatsApp</a></Button>
          <Button asChild variant="outline" size="lg"><a href={PHONE_ASSISTANT_URL}><Phone className="h-4 w-4" />Call {PHONE_ASSISTANT_NUMBER}</a></Button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">Free demo: illustrative sample replies and metrics. Playground: real AI conversations after sign-in.</p>

        <div className="mt-16 w-full rounded-lg border border-border bg-card/70 font-mono text-sm">
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
