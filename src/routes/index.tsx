import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Globe,
  HeartPulse,
  Languages,
  Layers,
  MapPin,
  MessageCircle,
  Mic,
  Moon,
  Phone,
  PhoneMissed,
  ShieldCheck,
  Siren,
  Stethoscope,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/PublicSiteChrome";
import { Button } from "@/components/ui/button";
import {
  PHONE_ASSISTANT_DISPLAY,
  PHONE_ASSISTANT_URL,
  WHATSAPP_ASSISTANT_URL,
} from "@/lib/flo-voice";

const TITLE = "24/7 Appointment Assistant for Clinics — Phone, WhatsApp & Website";
const DESCRIPTION =
  "Mira answers your clinic's phone calls, WhatsApp messages and website chats 24/7 — shares doctor timings and fees, and captures appointment requests for your staff to confirm. Done-for-you setup.";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
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
              name: "Conversational Flows Studio",
              alternateName: ["Conversational AI Studio", "conversationalaistudio.online"],
              description:
                "Done-for-you 24/7 appointment assistant for clinics across phone, WhatsApp, and web.",
              inLanguage: "en",
              publisher: { "@id": "https://conversationalaistudio.online/#organization" },
            },
            {
              "@type": "ProfessionalService",
              "@id": "https://conversationalaistudio.online/#organization",
              name: "Conversational Flows Studio",
              alternateName: ["Conversational AI Studio", "conversationalaistudio.online"],
              url: "https://conversationalaistudio.online",
              description:
                "Done-for-you 24/7 appointment assistant for clinics across phone, WhatsApp, and web.",
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function openAssistant() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-site-assistant-toggle]");
  if (toggle && toggle.getAttribute("aria-label") !== "Close chat") toggle.click();
}

const PAINS = [
  {
    icon: Sun,
    t: "The morning OPD rush",
    d: "Your front desk is checking patients in while the phone keeps ringing. Callers hang up — and book elsewhere.",
  },
  {
    icon: Moon,
    t: "After-hours enquiries",
    d: "Parents message at 11 pm and call before you open. Without a reply, those appointments are lost.",
  },
  {
    icon: PhoneMissed,
    t: "Repetitive questions",
    d: "“What are the doctor's timings?” “What's the fee?” “Where are you located?” — dozens of times a day.",
  },
] as const;

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    text: "Patients message your WhatsApp number any time. Mira replies instantly, understands voice notes, and books requests.",
    action: { label: "Try on WhatsApp", href: WHATSAPP_ASSISTANT_URL, external: true },
  },
  {
    icon: Globe,
    title: "Website chat & voice",
    text: "A chat bubble on your clinic website. Visitors type or talk — no app download, works on any phone browser.",
    action: { label: "See it on a website", to: "/web-agent" as const },
  },
  {
    icon: Phone,
    title: "Phone line",
    text: "Mira picks up your clinic calls in a natural voice — during the rush and after hours — and takes appointment requests.",
    action: { label: `Call ${PHONE_ASSISTANT_DISPLAY}`, href: PHONE_ASSISTANT_URL },
  },
] as const;

const HANDLES = [
  {
    icon: CalendarCheck,
    t: "Appointment requests",
    d: "Collects patient name, phone, doctor and preferred slot.",
  },
  { icon: Clock3, t: "Doctor timings", d: "Shares each doctor's days and consulting hours." },
  { icon: Wallet, t: "Consultation fees", d: "Answers fee questions from your approved list." },
  { icon: MapPin, t: "Directions", d: "Sends your address and Google Maps link." },
  {
    icon: Layers,
    t: "One memory, three channels",
    d: "A patient who messaged on WhatsApp isn't asked again on the phone.",
  },
  {
    icon: Siren,
    t: "Emergency safe",
    d: "Directs emergencies to 108 — never gives medical advice.",
  },
] as const;

const STEPS = [
  {
    n: "1",
    t: "Share your clinic details",
    d: "A short call: doctors, timings, fees, address and how your team confirms appointments.",
  },
  {
    n: "2",
    t: "We set up Mira for you",
    d: "We configure your assistant and connect your phone number, WhatsApp and website. No software for you to learn.",
  },
  {
    n: "3",
    t: "Go live — your team stays in control",
    d: "Requests arrive in a simple staff portal. Your team calls back, confirms, or reschedules.",
  },
] as const;

const FAQS = [
  {
    q: "Does Mira confirm appointments by itself?",
    a: "No. Mira collects the request — patient name, phone, doctor and preferred time — and your staff confirm it. A request is never presented to the patient as a confirmed booking.",
  },
  {
    q: "Can we keep our existing clinic number and WhatsApp?",
    a: "Yes. For phone calls, your existing clinic number can forward busy, unanswered, or after-hours calls to Mira. For WhatsApp, you can keep using your WhatsApp Business app as usual and set an Away Message with a one-tap link to your 24/7 assistant (or connect a dedicated WhatsApp Business API number).",
  },
  {
    q: "Will it give medical advice?",
    a: "No. Mira only answers logistics from your approved information — timings, fees, directions and preparation notes. Symptoms and treatment questions go to your doctors; emergencies are directed to 108.",
  },
  {
    q: "Does it replace my receptionist?",
    a: "No — it supports them. Mira handles repetitive calls and messages during rush hours and after closing, so your team can focus on patients at the clinic.",
  },
  {
    q: "How do we update timings or fees?",
    a: "Tell us, or update them in your clinic dashboard. All three channels use the new information on the next conversation.",
  },
] as const;

function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <PublicSiteHeader />

      <main>
        {/* HERO */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_70%_0%,hsl(var(--primary)/0.18),transparent_70%)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:pb-20">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Stethoscope className="h-3.5 w-3.5" />
                Built for clinics &amp; doctors
              </p>
              <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Your clinic&apos;s <span className="text-primary">24/7 appointment assistant</span>{" "}
                — on WhatsApp, website &amp; phone.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Mira answers every patient WhatsApp message, website chat and phone call — shares
                doctor timings and fees, and captures appointment requests for your staff to
                confirm. Even at midnight. Even during the morning rush.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 text-base">
                  <a href="#get-started">
                    Get Mira for my clinic
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 text-base">
                  <Link to="/web-agent">
                    <Globe className="h-4 w-4" />
                    See the live demo
                  </Link>
                </Button>
              </div>
              <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                {["Done-for-you setup", "No new software", "Staff confirm every booking"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <HeroConversation />
          </div>

          {/* Channel strip */}
          <div className="border-y border-border bg-card/40">
            <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-border px-2 sm:px-6">
              {[
                { icon: MessageCircle, t: "WhatsApp" },
                { icon: Globe, t: "Website" },
                { icon: Phone, t: "Phone calls" },
              ].map(({ icon: Icon, t }) => (
                <div
                  key={t}
                  className="flex flex-col items-center gap-1.5 px-2 py-4 text-center sm:flex-row sm:justify-center sm:gap-2.5"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium sm:text-sm">{t}</span>
                  <span className="hidden text-xs text-muted-foreground md:inline">
                    · answered 24/7
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:space-y-24 sm:px-6 sm:py-20">
          {/* PROBLEM */}
          <section aria-labelledby="pains">
            <SectionEyebrow>The problem</SectionEyebrow>
            <h2 id="pains" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Every unanswered call is a patient who books somewhere else.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {PAINS.map(({ icon: Icon, t, d }) => (
                <div key={t} className="rounded-xl border border-border bg-card/60 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CHANNELS */}
          <section aria-labelledby="channels">
            <SectionEyebrow>The solution</SectionEyebrow>
            <h2 id="channels" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              One assistant. Three channels. Always on.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Patients reach your clinic however they like — Mira answers on all three with the same
              doctor timings, fees and booking rules.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {CHANNELS.map(({ icon: Icon, title, text, action }) => (
                <div
                  key={title}
                  className="flex flex-col rounded-xl border border-border bg-card p-6"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                  <Button asChild variant="outline" className="mt-5 h-11 w-full">
                    {"to" in action ? (
                      <Link to={action.to}>
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <a
                        href={action.href}
                        {...("external" in action
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* WHAT MIRA HANDLES */}
          <section
            aria-labelledby="handles"
            className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center"
          >
            <div>
              <SectionEyebrow>What Mira handles</SectionEyebrow>
              <h2 id="handles" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                The questions your front desk answers all day.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Mira answers only from the information you approve, and hands anything clinical back
                to your doctors.
              </p>
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">No medical advice, ever.</span>{" "}
                  Symptoms and treatment questions are deferred to your doctors; emergencies are
                  directed to 108.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {HANDLES.map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-3 rounded-xl border border-border bg-card/60 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">{t}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FOR DOCTORS & MANAGERS */}
          <section
            aria-labelledby="control"
            className="grid gap-10 rounded-2xl border border-border bg-card/50 p-6 sm:p-10 lg:grid-cols-2 lg:items-center"
          >
            <div>
              <SectionEyebrow>For chief doctors &amp; clinic managers</SectionEyebrow>
              <h2 id="control" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Your team stays in control of every booking.
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  {
                    icon: BellRing,
                    t: "Requests land in a simple staff portal",
                    d: "A private link for your front desk — open it on any phone. Call, WhatsApp, confirm or cancel in one tap.",
                  },
                  {
                    icon: Users,
                    t: "See every conversation",
                    d: "Read what patients asked on phone, WhatsApp and web — with timing and cost per reply.",
                  },
                  {
                    icon: HeartPulse,
                    t: "Your clinic, your rules",
                    d: "Doctors, timings, fees and instructions are yours to update whenever they change.",
                  },
                ].map(({ icon: Icon, t, d }) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button asChild variant="outline" className="h-11">
                  <Link to="/admin-portal">
                    Try Admin Portal demo (Admin &amp; Staff)
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <PortalPreview />
          </section>

          {/* HOW IT WORKS */}
          <section aria-labelledby="how">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 id="how" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Live in days, not months. We do the setup.
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map(({ n, t, d }) => (
                <li key={n} className="relative rounded-xl border border-border bg-card/60 p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">
                    {n}
                  </span>
                  <h3 className="mt-4 font-semibold">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* LIVE DEMO */}
          <section
            aria-labelledby="try"
            className="overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-10"
          >
            <SectionEyebrow>Try it yourself — right now</SectionEyebrow>
            <h2 id="try" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Talk to Mira as a patient would.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Our live demo runs{" "}
              <span className="font-medium text-foreground">Aura Health Clinic</span> — a fictional
              clinic with made-up doctors, hours and fees. Ask about timings, fees, or request an
              appointment.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button asChild size="lg" className="h-12">
                <a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-12" onClick={openAssistant}>
                <Mic className="h-4 w-4" />
                Chat or talk here
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <Link to="/web-agent">
                  <Globe className="h-4 w-4" />
                  Website demo
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <a href={PHONE_ASSISTANT_URL}>
                  <Phone className="h-4 w-4" />
                  Call {PHONE_ASSISTANT_DISPLAY}
                </a>
              </Button>
            </div>
          </section>

          {/* FAQ */}
          <section
            aria-labelledby="faq"
            className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
          >
            <div>
              <SectionEyebrow>Questions doctors ask us</SectionEyebrow>
              <h2 id="faq" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Frequently asked questions
              </h2>
            </div>
            <div className="divide-y divide-border rounded-xl border border-border bg-card/50">
              {FAQS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium">
                    {q}
                    <span className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* GET STARTED */}
          <section
            id="get-started"
            aria-labelledby="get-started-title"
            className="scroll-mt-20 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
          >
            <div>
              <SectionEyebrow>Get started</SectionEyebrow>
              <h2
                id="get-started-title"
                className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                Get a 24/7 assistant for your clinic.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Tell us about your clinic. We&apos;ll walk you through a live demo and set up Mira
                with your doctors, timings and fees.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {[
                  "Free walkthrough with your clinic details",
                  "Phone, WhatsApp and website — one setup",
                  "Your staff confirm every appointment",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <LeadForm
                businessPlaceholder="e.g. children's clinic, dental clinic"
                submitLabel="Request my free demo"
              />
            </div>
          </section>

          {/* TECH TEAMS (de-emphasised) */}
          <section aria-labelledby="lab" className="border-t border-border pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Languages className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <h2 id="lab" className="text-sm font-medium">
                    For technical teams
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Mira is tuned in our voice AI studio — compare speech, model and voice providers
                    with latency and cost per turn.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/demo">Studio demo</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/playground">
                    Playground <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{children}</p>;
}

function HeroConversation() {
  const lines: { from: "patient" | "mira"; text: string }[] = [
    { from: "patient", text: "Hi, is the doctor available tomorrow evening? My son has a fever." },
    {
      from: "mira",
      text: "Yes — Dr. Rao consults from 5 to 8 PM tomorrow. The fee is ₹600. Shall I request a slot?",
    },
    { from: "patient", text: "6 PM please. Name is Arjun." },
    {
      from: "mira",
      text: "Done ✅ I've sent your 6 PM request to the clinic team. They'll confirm on this number shortly.",
    },
  ];
  return (
    <div className="mx-auto w-full max-w-sm lg:max-w-none">
      <div className="relative">
        <div className="rounded-[1.75rem] border border-border bg-card p-3 pb-6 shadow-2xl">
          <div className="flex items-center gap-3 rounded-t-2xl border-b border-border px-3 pb-3 pt-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Your Clinic · Mira</p>
              <p className="text-[11px] text-primary">online · replies instantly</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              11:42 PM
            </span>
          </div>
          <div className="space-y-2.5 px-2 py-4">
            {lines.map((line, i) => (
              <div
                key={i}
                className={line.from === "patient" ? "flex justify-end" : "flex justify-start"}
              >
                <p
                  className={
                    line.from === "patient"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm"
                  }
                >
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 -mt-4 ml-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs shadow-lg">
          <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          New appointment request sent to staff
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Illustrative conversation
      </p>
    </div>
  );
}

function PortalPreview() {
  const requests = [
    { name: "Arjun K.", detail: "Dr. Rao · Tomorrow 6 PM", channel: "WhatsApp", status: "New" },
    { name: "Meena S.", detail: "Dr. Iyer · Sat 10:30 AM", channel: "Phone", status: "New" },
    { name: "Rahul P.", detail: "Dr. Rao · Today 7 PM", channel: "Website", status: "Confirmed" },
  ];
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-background p-4 shadow-xl lg:max-w-none">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Staff portal</p>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          2 new
        </span>
      </div>
      <p className="mt-1 font-semibold">Appointment requests</p>
      <ul className="mt-4 space-y-2.5">
        {requests.map((r) => (
          <li key={r.name} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
              </div>
              <span
                className={
                  r.status === "Confirmed"
                    ? "shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary"
                    : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px]"
                }
              >
                {r.status}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>via {r.channel}</span>
              {r.status === "New" && (
                <span className="rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground">
                  Confirm
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">Illustrative example</p>
    </div>
  );
}
