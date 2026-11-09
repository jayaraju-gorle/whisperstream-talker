import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Clock3, MapPin, MessageCircle, ShieldCheck, Stethoscope } from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/PublicSiteChrome";
import { Button } from "@/components/ui/button";
import { WHATSAPP_ASSISTANT_URL } from "@/lib/flo-voice";

const PAGE_PATH = "/whatsapp-appointment-booking";
const PAGE_URL = `https://conversationalaistudio.online${PAGE_PATH}`;
const PAGE_TITLE = "WhatsApp Appointment Booking — Conversational Flows Studio";
const PAGE_DESCRIPTION =
  "Enable 24/7 WhatsApp appointment requests for your clinic. Capture patient preferences, answer clinic questions, and confirm visits without staff overload.";

const FAQS = [
  {
    q: "Does this replace our clinic receptionists?",
    a: "No. The assistant handles routine, repetitive inquiries and gathers appointment-request details so your reception team can focus on in-person patients.",
  },
  {
    q: "How are appointments confirmed?",
    a: "Requests are queued for your staff to confirm by WhatsApp or a phone call. The assistant records the preferred slot and does not lock it on a calendar.",
  },
  {
    q: "What phone number is used?",
    a: "Your existing business phone number, or a dedicated WhatsApp Business number if you prefer to keep the line separate.",
  },
  {
    q: "How long does setup take?",
    a: "A done-for-you setup is typically ready within 24 to 48 hours, using your hours, doctors, fees, address, and preparation notes.",
  },
] as const;

const STEPS = [
  {
    n: "1",
    t: "Patient messages your clinic WhatsApp number",
    d: "They ask about timings, doctors, or a preferred slot — during the morning rush or after you have closed.",
  },
  {
    n: "2",
    t: "Assistant collects key details",
    d: "Mira asks for the patient name, phone number, preferred doctor or specialty, date, and reason for the visit.",
  },
  {
    n: "3",
    t: "Clinic staff reviews and confirms",
    d: "The inquiry is logged for your desk. Your team confirms the visit, so a slot is only promised after a person checks the diary.",
  },
];

const ANSWERS = [
  {
    icon: Clock3,
    t: "Consultation hours",
    d: "Opening hours you provide, including which sessions are morning or evening. The fictional Aura sample uses Monday–Saturday, 10 AM–1 PM and 5 PM–8 PM.",
  },
  {
    icon: MapPin,
    t: "Clinic address",
    d: "Directions and the address you want patients to use. Aura’s sample address is a made-up suite in Hyderabad, so the live demo never sends someone to a real clinic.",
  },
  {
    icon: Stethoscope,
    t: "Doctors, availability, and fees",
    d: "Which doctor sees which specialty, on which days, and the consultation fee. Aura’s sample lists Dr. Anika Rao for family medicine and Dr. Rohan Mehta for child health.",
  },
  {
    icon: ShieldCheck,
    t: "Preparation notes, with a firm limit",
    d: "Notes you add, such as fasting before a lab test. Mira politely defers symptoms, treatment, and other medical advice to the doctor. She does not diagnose.",
  },
];

const CHAT = [
  { from: "patient" as const, name: "Patient", text: "Hi, can I see Dr. Anika Rao tomorrow morning?" },
  {
    from: "mira" as const,
    name: "Mira",
    text: "Hello, I’m Mira at Aura Health Clinic, a fictional sample clinic. I can take an appointment request for the team to confirm. May I have your name and phone number?",
  },
  { from: "patient" as const, name: "Patient", text: "Ananya Sharma, 98XXX XXXXX. It’s a follow-up visit." },
  {
    from: "mira" as const,
    name: "Mira",
    text: "Thank you, Ananya. I’ve noted a request for Dr. Anika Rao, family medicine, tomorrow morning, follow-up visit. Sample hours are Monday–Saturday, 10 AM–1 PM and 5 PM–8 PM, and the sample fee is ₹600. Your clinic team reviews this and confirms by WhatsApp or phone. It is not booked yet, and I can’t advise on symptoms — please ask the doctor.",
  },
];

export const Route = createFileRoute("/whatsapp-appointment-booking")({
  staticData: { sitemap: true, sitemapPriority: 0.8 },
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  component: WhatsAppAppointmentBookingPage,
});

function WhatsAppAppointmentBookingPage() {
  return (
    <div className="min-h-screen">
      <PublicSiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">WhatsApp for clinics</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.1] sm:text-5xl">
          Capture Clinic Appointment Requests 24/7 on WhatsApp
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
          Clinics miss patient calls and messages during peak hours and after closing. Mira handles those
          inquiries straight away on WhatsApp — hours, doctors, fees, and the details of an appointment request.
        </p>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">
          She captures the request, the patient details, and the preferred slot. Your clinic team reviews and
          confirms the visit. Mira does not guarantee an instant calendar booking, and she does not diagnose.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="min-h-11">
            <a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Try Aura on WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-11">
            <a href="#clinic-setup">Get one for your clinic</a>
          </Button>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          The WhatsApp button opens a live demo of fictional Aura Health Clinic. Send “TRY AURA” and ask Mira
          the way a patient would. Doctors, hours, and fees in that chat are made up.
        </p>

        <section aria-labelledby="how-it-works" className="mt-16">
          <h2 id="how-it-works" className="text-2xl font-semibold sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="min-w-0 border-t border-border pt-4">
                <p className="font-mono text-xs text-primary">Step {step.n}</p>
                <h3 className="mt-2 font-medium">{step.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="preview" className="mt-16">
          <h2 id="preview" className="text-2xl font-semibold sm:text-3xl">
            A sample appointment request
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            An illustrative WhatsApp conversation with Mira at Aura Health Clinic. Your clinic’s assistant uses
            your own hours, doctors, and fees instead of this sample.
          </p>
          <figure className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-border bg-card p-4">
            <figcaption className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Aura Health Clinic</p>
                <p className="text-xs text-muted-foreground">Mira · fictional sample</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-primary">Sample chat</span>
            </figcaption>
            <ol className="mt-4 space-y-3">
              {CHAT.map((message, index) => (
                <li
                  key={index}
                  className={
                    message.from === "patient"
                      ? "ml-8 rounded-lg bg-secondary px-3 py-2"
                      : "mr-8 rounded-lg border border-border bg-background px-3 py-2"
                  }
                >
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{message.name}</p>
                  <p className="mt-1 text-sm leading-relaxed">{message.text}</p>
                </li>
              ))}
            </ol>
          </figure>
        </section>

        <section aria-labelledby="answers" className="mt-16">
          <h2 id="answers" className="text-2xl font-semibold sm:text-3xl">
            What Mira answers out of the box
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            We load the facts your front desk already repeats. The live demo shows the same kind of answers with
            fictional Aura Health Clinic details.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ANSWERS.map(({ icon: Icon, t, d }) => (
              <div key={t} className="min-w-0 rounded-lg border border-border bg-card/60 p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-medium">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-16">
          <h2 id="faq" className="text-2xl font-semibold sm:text-3xl">
            Questions clinics ask
          </h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {FAQS.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-3xl pb-4 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="clinic-setup" aria-labelledby="clinic-enquiry" className="mt-16 scroll-mt-8">
          <h2 id="clinic-enquiry" className="text-2xl font-semibold sm:text-3xl">
            Get one for your clinic
          </h2>
          <p className="mt-1 mb-4 max-w-3xl text-sm text-muted-foreground">
            Tell us about your clinic and we’ll configure a 24/7 WhatsApp front-desk assistant with your hours,
            doctors, fees, and location. Setup is done for you, usually within 24 to 48 hours. Appointment
            requests still wait for your team to confirm.
          </p>
          <LeadForm
            businessPlaceholder="e.g. dental clinic, diagnostic centre"
            submitLabel="Request a clinic setup"
          />
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
