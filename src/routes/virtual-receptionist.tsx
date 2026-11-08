import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarCheck,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/PublicSiteChrome";
import { Button } from "@/components/ui/button";
import {
  PHONE_ASSISTANT_DISPLAY,
  PHONE_ASSISTANT_URL,
  WHATSAPP_ASSISTANT_URL,
} from "@/lib/flo-voice";

const PAGE_URL = "https://conversationalaistudio.online/virtual-receptionist";
const PAGE_TITLE = "24/7 Virtual Receptionist & Phone Answering — Conversational Flows Studio";
const PAGE_DESCRIPTION =
  "Automate inbound business phone answering 24/7. Handle after-hours calls, triage clinic inquiries, and capture appointment requests without busy signals or missed callers.";

const COMPARISON_ROWS = [
  {
    feature: "Natural conversation",
    human: "Yes, when staff are available",
    ivr: "Rigid menus and keypad choices",
    studio: "Callers speak naturally and get direct answers",
  },
  {
    feature: "24/7 after-hours coverage",
    human: "Limited to staffed hours",
    ivr: "Often only a recorded message",
    studio: "Answers routine inquiries around the clock",
  },
  {
    feature: "Zero busy lines",
    human: "One caller can occupy the line",
    ivr: "Capacity depends on the phone setup",
    studio: "Designed to answer concurrent inbound calls",
  },
  {
    feature: "Automatic caller detail capture",
    human: "Staff write details down manually",
    ivr: "Usually needs a separate follow-up",
    studio: "Captures contact details and appointment requests",
  },
] as const;

const STEPS = [
  {
    icon: PhoneCall,
    title: "A patient calls your clinic number",
    description:
      "They use your existing number with call forwarding, or a dedicated clinic number. There are no menus to navigate and no “Press 1” prompts.",
  },
  {
    icon: MessageCircle,
    title: "Mira answers immediately in natural speech",
    description:
      "She answers routine questions about timings, doctors, fees and directions, then captures the caller’s details and preferred appointment slot.",
  },
  {
    icon: UserCheck,
    title: "Your staff reviews and confirms",
    description:
      "The request goes to your clinic team. A staff member checks availability and confirms the slot, keeping a person in control of the diary.",
  },
] as const;

const GUARDRAILS = [
  {
    icon: Clock3,
    title: "Hours and appointment requests",
    description:
      "Shares consultation hours, takes preferred dates and times, and makes clear that the appointment is a request until your staff confirms it.",
  },
  {
    icon: Stethoscope,
    title: "Doctors and consultation fees",
    description:
      "Answers from the doctor schedules, specialties and fees you provide. It does not invent availability or promise a confirmed booking.",
  },
  {
    icon: MapPin,
    title: "Location and directions",
    description:
      "Provides your clinic address, directions and the location details you choose to make available to callers.",
  },
  {
    icon: ShieldCheck,
    title: "A strict medical safety boundary",
    description:
      "Defers symptoms, diagnoses and medical advice to doctors. For urgent emergencies, it directs callers to call 108 immediately rather than continuing with routine triage.",
  },
] as const;

const FAQS = [
  {
    question: "Does a virtual receptionist replace our clinic staff?",
    answer:
      "No. It supports your staff by answering routine calls, capturing caller details and taking appointment requests. Your team remains in control of patient care, exceptions and appointment confirmation.",
  },
  {
    question: "Can callers use our existing phone number?",
    answer:
      "Yes. You can forward calls from your existing clinic or business number to the assistant. A dedicated number is also an option if you prefer to keep the service separate.",
  },
  {
    question: "How long does setup take?",
    answer:
      "A done-for-you setup typically takes 24–48 hours once we have your hours, doctors or team members, fees, location and call-handling instructions.",
  },
  {
    question: "Does the assistant confirm appointments automatically?",
    answer:
      "No. It captures the caller’s preferred slot and contact details as an appointment request. Your staff reviews availability and confirms the booking, so no appointment is promised without human confirmation.",
  },
] as const;

export const Route = createFileRoute("/virtual-receptionist")({
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
          "@graph": [
            {
              "@type": "Service",
              "@id": `${PAGE_URL}#service`,
              name: "24/7 Virtual Receptionist and Phone Answering",
              serviceType: "Virtual receptionist and inbound phone answering",
              url: PAGE_URL,
              description:
                "Done-for-you 24/7 phone answering for clinics and local businesses. Handles routine questions, after-hours inquiries, caller details and appointment requests. Defers medical advice, symptoms and diagnoses to doctors, directs urgent emergencies to 108, and leaves appointment confirmation to clinic staff.",
              provider: {
                "@type": "Organization",
                name: "Conversational Flows Studio",
                url: "https://conversationalaistudio.online/",
              },
              areaServed: { "@type": "Country", name: "India" },
              audience: {
                "@type": "BusinessAudience",
                name: "Clinics and appointment-based local businesses",
              },
              availableChannel: {
                "@type": "ServiceChannel",
                servicePhone: {
                  "@type": "ContactPoint",
                  telephone: "+91-7965481796",
                  contactType: "sales",
                },
              },
            },
            {
              "@type": "FAQPage",
              "@id": `${PAGE_URL}#faq`,
              mainEntity: FAQS.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: VirtualReceptionistPage,
});

function VirtualReceptionistPage() {
  return (
    <div className="min-h-screen">
      <PublicSiteHeader current="clinics" />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          24/7 phone answering
        </p>
        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[1.1] sm:text-5xl">
          24/7 Phone Answering &amp; Virtual Receptionist for Clinics and Local Businesses
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
          Mira answers routine calls in natural speech, captures caller details and takes appointment
          requests — during peak hours, after closing and whenever your team cannot pick up.
        </p>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">
          Your staff stays in control. They review every appointment request and confirm the slot with
          the caller.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="min-h-11">
            <a href={PHONE_ASSISTANT_URL}>
              <Phone className="h-4 w-4" />
              Call {PHONE_ASSISTANT_DISPLAY}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-11">
            <a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Try the WhatsApp demo
            </a>
          </Button>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Both demos use Aura Health Clinic, a hypothetical sample with made-up doctors, hours and fees.
          Ask Mira the questions your callers would ask.
        </p>

        <section aria-labelledby="comparison" className="mt-16">
          <h2 id="comparison" className="text-2xl font-semibold sm:text-3xl">
            A better way to answer every call
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Add round-the-clock coverage without replacing the people your callers already trust.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card/60">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Comparison of a human desk alone, traditional IVR, and Conversational Flows Studio
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="p-4 font-medium text-muted-foreground">
                    Call handling
                  </th>
                  <th scope="col" className="p-4 font-medium">
                    Human Desk Alone
                  </th>
                  <th scope="col" className="p-4 font-medium">
                    Traditional IVR (“Press 1 for…”)
                  </th>
                  <th scope="col" className="bg-primary/5 p-4 font-medium text-primary">
                    Conversational Flows Studio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row" className="p-4 font-medium">
                      {row.feature}
                    </th>
                    <td className="p-4 text-muted-foreground">{row.human}</td>
                    <td className="p-4 text-muted-foreground">{row.ivr}</td>
                    <td className="bg-primary/5 p-4">
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        {row.studio}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="how-it-works" className="mt-16">
          <h2 id="how-it-works" className="text-2xl font-semibold sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, description }, index) => (
              <li key={title} className="min-w-0 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">Step {index + 1}</span>
                </div>
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="guardrails" className="mt-16">
          <h2 id="guardrails" className="text-2xl font-semibold sm:text-3xl">
            Helpful with routine calls. Clear about its limits.
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Mira follows your approved business information and call-handling rules. She does not turn
            a routine inquiry into medical triage or a confirmed diagnosis.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {GUARDRAILS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="min-w-0 rounded-lg border border-border bg-card/60 p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex max-w-3xl items-start gap-2 text-sm text-muted-foreground">
            <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Appointment requests always wait for human review. Urgent emergencies are directed to 108.
          </p>
        </section>

        <section aria-labelledby="faq" className="mt-16">
          <h2 id="faq" className="text-2xl font-semibold sm:text-3xl">
            Virtual receptionist FAQs
          </h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {FAQS.map((item) => (
              <details key={item.question} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-medium [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-3xl pb-4 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="business-enquiry" className="mt-16 border-t border-border pt-10">
          <h2 id="business-enquiry" className="text-2xl font-semibold sm:text-3xl">
            Want 24/7 phone answering for your business?
          </h2>
          <p className="mb-4 mt-2 max-w-3xl text-sm text-muted-foreground">
            Tell us about your business and how you handle calls today. We’ll configure the assistant
            with your information, forwarding setup and staff confirmation process.
          </p>
          <LeadForm
            businessPlaceholder="e.g. dental clinic, diagnostic centre"
            submitLabel="Request a phone answering setup"
          />
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
