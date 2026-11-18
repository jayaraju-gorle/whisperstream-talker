import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, CalendarCheck, Clock3, MapPin, MessageCircle, Mic, Phone, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { EmbeddedClinicAssistant } from "@/components/SiteAssistant";
import { PublicSiteFooter } from "@/components/PublicSiteChrome";
import { Button } from "@/components/ui/button";
import { hoursLine } from "@/lib/clinic";
import { TINY_STARS_PRESET } from "@/lib/clinic-presets";
import { PHONE_ASSISTANT_DISPLAY, PHONE_ASSISTANT_URL, WHATSAPP_ASSISTANT_URL } from "@/lib/flo-voice";

const PAGE_URL = "https://conversationalaistudio.online/tiny-stars";
const PAGE_TITLE = "Tiny Stars Children Clinic — Sample Storefront & Web Agent Demo";
const PAGE_DESCRIPTION =
  "Sample paediatric clinic storefront demonstrating Mira's 24/7 Web chat and voice agent alongside WhatsApp and phone call continuity.";

const SERVICES = [
  {
    icon: Baby,
    title: "Newborn & Well-Baby Care",
    text: "Routine growth tracking, feeding guidance, jaundice screening, and early developmental milestone checks.",
  },
  {
    icon: ShieldCheck,
    title: "Childhood Immunisations",
    text: "IAP-aligned vaccination schedules, catch-up doses, and digital reminders for parents.",
  },
  {
    icon: Stethoscope,
    title: "Same-Day Paediatric Visits",
    text: "Walk-in and scheduled consultations for fever, ear infections, respiratory care, allergies, and nebulisation.",
  },
] as const;

export const Route = createFileRoute("/tiny-stars")({
  staticData: { sitemap: true, sitemapPriority: 0.7 },
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
  component: TinyStarsStorefront,
});

function TinyStarsStorefront() {
  const clinic = TINY_STARS_PRESET;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{clinic.name}</p>
              <p className="text-xs text-muted-foreground">Paediatrics &amp; Newborn Care · Sample Storefront</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="#web-agent">Try Web Agent</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/clinics">Back to Studio</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <section id="web-agent" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Sample clinic storefront · Live Web Channel Agent
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Gentle, round-the-clock care for your little ones.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Welcome to <strong className="text-foreground">{clinic.name}</strong>. Parents can ask about doctor
              timings, vaccination visits, consultation fees, or request an appointment 24/7 using the live Web Agent on
              this page — or continue seamlessly on WhatsApp and phone.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={PHONE_ASSISTANT_URL}>
                  <Phone className="h-4 w-4" />
                  Call {PHONE_ASSISTANT_DISPLAY}
                </a>
              </Button>
            </div>

            <div className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-xs text-muted-foreground">{clinic.address}</p>
                  {clinic.map_url && (
                    <a
                      href={clinic.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Clinic Desk</p>
                  <p className="text-xs text-muted-foreground">
                    Appointments: {clinic.phone}
                    {clinic.emergency_phone ? ` · Urgent: ${clinic.emergency_phone}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Testing the Web Channel Agent</p>
              <p className="mt-1">
                Type a question in the assistant panel on the right, or click <strong>Talk to Mira</strong> for live
                browser voice. Share your phone number in chat (or book an appointment) to test shared context across
                Web, WhatsApp, and Phone.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Mic className="h-3.5 w-3.5 text-primary" />
                Web Channel Agent (Text &amp; Voice)
              </span>
              <span>Live demo</span>
            </div>
            <EmbeddedClinicAssistant className="h-[580px]" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Paediatric Services</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service.title} className="space-y-2 rounded-xl border border-border bg-card p-5">
                <service.icon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Our Paediatricians &amp; Fees</h2>
            </div>
            <ul className="divide-y divide-border">
              {clinic.doctors.map((doctor) => (
                <li key={doctor.name} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{doctor.days}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-medium">{doctor.fee}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Opening Hours &amp; Insurance</h2>
            </div>
            <ul className="space-y-1.5 text-sm">
              {clinic.hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{h.day}</span>
                  <span className="font-mono text-xs">{hoursLine(h).replace(`${h.day}: `, "")}</span>
                </li>
              ))}
            </ul>
            {clinic.insurance && (
              <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Insurance &amp; TPA</p>
                <p className="mt-1">{clinic.insurance}</p>
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>Appointment requests submitted through Mira are confirmed by clinic staff.</span>
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
