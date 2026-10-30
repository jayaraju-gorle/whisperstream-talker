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
  Users,
  Moon,
  CalendarCheck,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PHONE_ASSISTANT_NUMBER, PHONE_ASSISTANT_URL, WHATSAPP_ASSISTANT_URL } from "@/lib/flo-voice";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Mira — 24/7 virtual front desk for clinics | Phone, WhatsApp & web" },
      {
        name: "description",
        content:
          "Mira answers patient calls, WhatsApp messages and website chat around the clock, handles peak-hour surges and captures appointment requests. Done for you — no technical setup.",
      },
      { property: "og:title", content: "Mira — 24/7 virtual front desk for clinics | Phone, WhatsApp & web" },
      {
        property: "og:description",
        content:
          "A 24/7 conversational front desk for health clinics across phone, WhatsApp and website chat. Try Mira now.",
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

const PAINS = [
  { icon: Users, t: "Peak-hour surges", d: "Mornings and evening OPD rush bring more calls and WhatsApp messages than reception can answer. Mira picks up every one at once, so patients never hear a busy tone or wait on read receipts." },
  { icon: Moon, t: "Nights and early mornings", d: "Patients message at 11 pm and call before you open. Mira replies 24/7 with hours, doctors, fees and directions, and records appointment requests for your team." },
  { icon: CalendarCheck, t: "No request left unanswered", d: "Every inquiry and booking request is logged and shared with your front desk, ready to confirm when the clinic opens." },
];

const CHANNELS = [
  { icon: Phone, t: "Phone calls", d: "A natural voice that answers your clinic line and speaks with callers in real time." },
  { icon: MessageCircle, t: "WhatsApp", d: "Instant replies on the channel your patients already use, at any hour." },
  { icon: Globe, t: "Website chat & voice", d: "A chat bubble on your website where patients can type or talk." },
];

const NEXT = ["Chartered accountants", "Law firms", "Automobile dealerships"];

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
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">For health clinics and healthcare practices</p>
        <h1 className="mt-4 w-full text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl">
          Meet Mira, your clinic’s 24/7 virtual front desk.
        </h1>
        <p className="mt-6 w-full text-lg text-muted-foreground">
          Mira answers patient calls, WhatsApp messages and website chats — during the busiest clinic hours and
          long after your staff go home — so no patient inquiry or appointment request goes unanswered.
        </p>
        <p className="mt-3 text-base text-muted-foreground">
          Done for you: we set Mira up with your doctors, timings, fees and location. No technical skills, no new software to learn.
        </p>

        <section aria-labelledby="try" className="mt-8 rounded-lg border border-primary/40 bg-card/70 p-4 sm:p-6">
          <h2 id="try" className="text-lg font-semibold">Talk to Mira right now</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try a sample clinic: type or say <span className="font-mono text-foreground">TRY IVY</span> on WhatsApp or in the chat bubble.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="lg"><a href={PHONE_ASSISTANT_URL}><Phone className="h-4 w-4" />Call {PHONE_ASSISTANT_NUMBER}</a></Button>
            <Button asChild variant="outline" size="lg"><a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />Chat on WhatsApp</a></Button>
            <Button variant="outline" size="lg" onClick={() => document.querySelector<HTMLButtonElement>('[data-site-assistant-toggle]')?.click()}><Mic className="h-4 w-4" />Chat or talk on this site</Button>
          </div>
        </section>

        <section aria-labelledby="pains" className="mt-16">
          <h2 id="pains" className="text-2xl font-semibold sm:text-3xl">The calls your reception can’t always take</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {PAINS.map(({ icon: Icon, t, d }) => (
              <div key={t} className="border-t border-border pt-4">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-medium">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="channels" className="mt-16">
          <h2 id="channels" className="text-2xl font-semibold sm:text-3xl">One assistant, every channel patients use</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {CHANNELS.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-lg border border-border bg-card/60 p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-medium">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="done" className="mt-16 grid gap-6 md:grid-cols-2">
          <div>
            <h2 id="done" className="text-2xl font-semibold sm:text-3xl">Done for you, start to finish</h2>
            <p className="mt-3 text-muted-foreground">Share your clinic details once. We configure Mira, connect your phone line and WhatsApp, add the website bubble, and keep everything updated. Your team simply receives the appointment requests.</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Coming next</h2>
            <p className="mt-3 text-muted-foreground">The same always-on front desk for professional services:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {NEXT.map((n) => <li key={n} className="rounded-full border border-border px-3 py-1 text-sm">{n}</li>)}
            </ul>
          </div>
        </section>

        <section aria-labelledby="lab" className="mt-24 border-t border-border pt-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">For technical teams</p>
          <h2 id="lab" className="mt-2 text-2xl font-semibold">The studio: architecture, latency and voice benchmarking</h2>
          <p className="mt-2 text-sm text-muted-foreground">Mira is built and tuned in our open lab. Compare speech, model and voice providers side by side and see speed and cost on every turn.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link to="/demo">Try the free demo</Link></Button>
            <Button asChild variant="ghost"><Link to="/playground">Open the playground <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
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
        </section>
      </main>
    </div>
  );
}
