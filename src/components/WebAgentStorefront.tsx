import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarCheck,
  Clock3,
  ExternalLink,
  Globe,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { assistantClock } from "@/lib/assistant-speech";
import { DAYS, type ClinicInput } from "@/lib/clinic";
import {
  PHONE_ASSISTANT_DISPLAY,
  PHONE_ASSISTANT_URL,
  WHATSAPP_ASSISTANT_URL,
} from "@/lib/flo-voice";

const DEFAULT_DOCTORS = [
  {
    name: "Dr. Anika Rao",
    specialty: "Family Medicine & General Physician",
    days: "Mon–Sat · 10:00 AM – 1:00 PM, 5:00 PM – 8:00 PM",
    fee: "₹600",
  },
  {
    name: "Dr. Rohan Mehta",
    specialty: "Child Health & Paediatrics",
    days: "Mon–Sat · 5:00 PM – 8:00 PM",
    fee: "₹700",
  },
];

const DEFAULT_HOURS = DAYS.map((day) => ({
  day,
  open: day !== "Sunday",
  slots: [
    { from: "10:00", to: "13:00" },
    { from: "17:00", to: "20:00" },
  ],
}));

const SERVICES = [
  {
    icon: Stethoscope,
    title: "Outpatient Consultations",
    text: "Routine check-ups, acute care, and follow-up visits with clear doctor schedules and transparent fees.",
  },
  {
    icon: ShieldCheck,
    title: "Preventive Care & Treatments",
    text: "Dedicated care plans, specialist guidance, and timely answers to common patient questions.",
  },
  {
    icon: CalendarCheck,
    title: "24/7 Appointment Requests",
    text: "Patients can request slots any time via the website bubble, WhatsApp, or phone.",
  },
] as const;

function openAssistantBubble() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-site-assistant-toggle]");
  if (toggle && toggle.getAttribute("aria-label") !== "Close chat") toggle.click();
}

function whatsappAssistantHref(shortCode?: string) {
  const clean = shortCode?.trim().toUpperCase();
  if (!clean) return WHATSAPP_ASSISTANT_URL;
  return `https://wa.me/916302392274?text=${encodeURIComponent(`TRY ${clean}`)}`;
}

export function WebAgentStorefront({
  clinic,
  isDemoPreview = false,
}: {
  clinic?: (Partial<ClinicInput> & { shortCode?: string }) | undefined;
  isDemoPreview?: boolean;
}) {
  const doctors = clinic?.doctors?.length ? clinic.doctors : DEFAULT_DOCTORS;
  const hours = clinic?.hours?.length ? clinic.hours : DEFAULT_HOURS;
  const clinicName = clinic?.name?.trim() || "Your Clinic Website";
  const address =
    clinic?.address?.trim() ||
    "Suite 204, Willow Health Centre, Green Park Neighbourhood, Hyderabad (Illustrative address)";
  const mapUrl = clinic?.map_url?.trim();
  const clinicPhone = clinic?.phone?.trim();
  const shortCode = clinic?.shortCode?.trim();
  const waHref = isDemoPreview ? WHATSAPP_ASSISTANT_URL : whatsappAssistantHref(shortCode);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {isDemoPreview && (
        <div className="border-b border-primary/30 bg-primary/10 px-4 py-2.5 text-xs sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Placeholder clinic website preview — click the{" "}
                <button
                  type="button"
                  onClick={openAssistantBubble}
                  className="underline decoration-primary underline-offset-4 hover:text-primary"
                >
                  Ask Mira bubble at the bottom right
                </button>{" "}
                to test chat &amp; voice.
              </span>
            </p>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link to="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Studio
              </Link>
            </Button>
          </div>
        </div>
      )}

      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{clinicName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {isDemoPreview
                  ? `Fictional preview${shortCode ? ` · Code: ${shortCode}` : ""}`
                  : address}
              </p>
            </div>
          </div>
          <nav
            aria-label="Clinic website"
            className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex"
          >
            <a href="#services" className="hover:text-foreground">
              Services
            </a>
            <a href="#doctors" className="hover:text-foreground">
              Doctors
            </a>
            <a href="#visit" className="hover:text-foreground">
              Hours &amp; Location
            </a>
          </nav>
          <Button size="sm" className="shrink-0" onClick={openAssistantBubble}>
            <MessageCircle className="h-4 w-4" />
            Book / Ask
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 pb-28 pt-10 sm:px-6 sm:pt-14">
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-primary" />
              {isDemoPreview
                ? "Sample clinic storefront · Fictional details"
                : `${shortCode ? `Code: ${shortCode} · ` : ""}24/7 Appointment Assistant`}
            </p>
            <h1 className="text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              {isDemoPreview
                ? "Compassionate family care, with 24/7 appointment assistance."
                : `${clinicName} — 24/7 appointment assistance.`}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {isDemoPreview
                ? "This is how your clinic's own website looks once our assistant is embedded. Patients can tap the expandable chat & voice bubble in the bottom-right corner at any hour — or reach you on WhatsApp and phone."
                : clinic?.notes?.trim() ||
                  `Ask about doctor timings, consultation fees, or request an appointment at ${clinicName} anytime via the web assistant bubble, WhatsApp, or phone.`}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="h-12" onClick={openAssistantBubble}>
                <Mic className="h-4 w-4" />
                Open Web Assistant Bubble
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  {isDemoPreview ? "Try on WhatsApp" : "Chat on WhatsApp"}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <a href={PHONE_ASSISTANT_URL}>
                  <Phone className="h-4 w-4" />
                  Call {PHONE_ASSISTANT_DISPLAY}
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              {isDemoPreview ? "How to test this page" : "How to book or ask"}
            </p>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                  1
                </span>
                <span>
                  Tap the <strong className="text-foreground">Ask Mira</strong> bubble in the
                  bottom-right corner to expand it.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                  2
                </span>
                <span>
                  Ask about doctor timings, fees, or tap{" "}
                  <strong className="text-foreground">Talk to Mira</strong> for live browser voice.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                  3
                </span>
                <span>
                  Share your phone number to see WhatsApp and phone call context carry over
                  seamlessly.
                </span>
              </li>
            </ol>
          </div>
        </section>

        <section id="services" className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">Clinic Services</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="space-y-2.5 rounded-xl border border-border bg-card/70 p-5"
              >
                <service.icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{service.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{service.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="doctors" className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {isDemoPreview ? "Consulting Doctors (Sample)" : "Consulting Doctors"}
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {doctors.map((doc) => (
                <li
                  key={doc.name}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{doc.days}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-medium">{doc.fee}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="visit" className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {isDemoPreview ? "Hours & Location (Sample)" : "Hours & Location"}
              </h2>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <strong className="font-medium text-foreground">{h.day}:</strong>
                  <span className="text-right">
                    {h.open
                      ? h.slots
                          .map((s) => `${assistantClock(s.from)} – ${assistantClock(s.to)}`)
                          .join(", ")
                      : "Closed (24/7 assistant still captures requests)"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p>{address}</p>
                  {!isDemoPreview && mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Open in Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              {!isDemoPreview && clinicPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`tel:${clinicPhone}`} className="hover:text-foreground hover:underline">
                    {clinicPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
