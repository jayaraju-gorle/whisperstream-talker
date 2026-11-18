import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe, Layers, MessageCircle, Mic, Phone, Sparkles } from "lucide-react";
import { EmbeddedClinicAssistant } from "@/components/SiteAssistant";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/PublicSiteChrome";
import { Button } from "@/components/ui/button";
import { PHONE_ASSISTANT_DISPLAY, PHONE_ASSISTANT_URL, WHATSAPP_ASSISTANT_URL } from "@/lib/flo-voice";

const PAGE_URL = "https://conversationalaistudio.online/web-agent";
const PAGE_TITLE = "24/7 Web Agent Demo — Website, WhatsApp & Phone Assistant";
const PAGE_DESCRIPTION =
  "Live demonstration of how our 24/7 conversational widget integrates into your website alongside WhatsApp and phone calls with shared context.";

const CHANNELS = [
  {
    icon: Globe,
    title: "1. Website Widget (Text & Voice)",
    description:
      "Embeds directly on your clinic or business website. Visitors can type questions or click Talk to Mira for instant browser voice — no app download needed.",
    badge: "Live on this page",
  },
  {
    icon: MessageCircle,
    title: "2. WhatsApp Business",
    description:
      "Answers patient messages and voice notes 24/7 on WhatsApp, shares timings and fees, and collects appointment requests automatically.",
    badge: "24/7 Messaging",
  },
  {
    icon: Phone,
    title: "3. Phone Receptionist",
    description:
      "Picks up incoming phone calls in natural spoken voice, handles routine inquiries during busy hours, and continues recent WhatsApp or web conversations.",
    badge: "Inbound Voice",
  },
] as const;

export const Route = createFileRoute("/web-agent")({
  staticData: { sitemap: true, sitemapPriority: 0.9 },
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: WebAgentDemo,
});

function WebAgentDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicSiteHeader />

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Interactive Web Agent Demo · 3-Channel Integration
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One 24/7 assistant across your Website, WhatsApp, and Phone.
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground">
              See exactly how our conversational widget looks and works once embedded on a clinic or business website.
              It shares the same hours, doctor profiles, and live conversation context with your WhatsApp and phone
              channels.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <a
                href="#widget-preview"
                className="rounded-xl border border-primary/40 bg-primary/5 p-3.5 transition-colors hover:bg-primary/10"
              >
                <Globe className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-medium">Web Widget</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Try live chat &amp; voice →</p>
              </a>
              <a
                href={WHATSAPP_ASSISTANT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-accent/50"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-medium">WhatsApp</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Open WhatsApp chat ↗</p>
              </a>
              <a
                href={PHONE_ASSISTANT_URL}
                className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-accent/50"
              >
                <Phone className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-medium">Phone Call</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{PHONE_ASSISTANT_DISPLAY}</p>
              </a>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Layers className="h-4 w-4 text-primary" />
                Shared context across every channel
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                If a visitor messages on WhatsApp, calls your clinic number, and later opens the website widget with
                their phone number, Mira keeps the conversation continuous without making them repeat themselves.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/clinics">
                  Get this for your clinic
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/tiny-stars">View sample clinic storefront</Link>
              </Button>
            </div>
          </div>

          <div
            id="widget-preview"
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Mic className="h-3.5 w-3.5 text-primary" />
                Integrated Website Widget Preview
              </span>
              <span>Text &amp; Voice</span>
            </div>
            <EmbeddedClinicAssistant className="h-[580px]" />
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">How the 3 channels work together</h2>
            <p className="text-sm text-muted-foreground">
              Every channel uses your approved business hours, fees, and appointment-request rules.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {CHANNELS.map((channel) => (
              <div key={channel.title} className="space-y-3 rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <channel.icon className="h-5 w-5 text-primary" />
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {channel.badge}
                  </span>
                </div>
                <h3 className="font-semibold">{channel.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{channel.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
