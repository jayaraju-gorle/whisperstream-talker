import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, ChevronDown, Clock3, MapPin, MessageCircle, Phone, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";
import clinicImage from "@/assets/clinic-assistant.jpg";
import { LeadForm } from "@/components/LeadForm";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/PublicSiteChrome";
import { Button } from "@/components/ui/button";
import { PHONE_ASSISTANT_DISPLAY, PHONE_ASSISTANT_URL, WHATSAPP_ASSISTANT_URL } from "@/lib/flo-voice";

const PAGE_URL = "https://conversationalaistudio.online/clinics";
const PAGE_TITLE = "24/7 Clinic Assistant — Phone & WhatsApp for Doctors & Clinics";
const PAGE_DESCRIPTION = "A done-for-you 24/7 assistant that answers clinic phone calls and WhatsApp messages, handles appointment requests, and shares doctor timings without front-desk overload.";

const FAQS = [
  { question: "Do we have to choose between phone and WhatsApp?", answer: "No. This is one done-for-you clinic assistant service covering both phone calls and WhatsApp messages simultaneously. Both channels use your approved clinic information and appointment-request rules." },
  { question: "How long does setup take?", answer: "We configure the assistant after reviewing your clinic hours, doctor schedules, fees, directions, preparation notes and staff confirmation process. Contact us to agree a setup timeline for your phone and WhatsApp connections." },
  { question: "Can we use our existing clinic numbers?", answer: "We review your current phone and WhatsApp setup with you. Phone coverage can use call forwarding where your provider supports it, or a dedicated number. WhatsApp connection options depend on your current business account and number; we confirm compatibility before setup." },
  { question: "Does Mira replace our reception staff?", answer: "No. Mira supports your staff by handling repetitive calls and messages during busy periods and after hours. Your team remains responsible for patient care, exceptions and appointment confirmation." },
  { question: "Are appointment requests automatically confirmed?", answer: "No. Mira collects the patient name, contact details, doctor preference and preferred slot. Staff review availability and confirm the appointment. A request is not a confirmed booking." },
  { question: "What questions can the assistant answer?", answer: "Mira answers logistical questions using your approved clinic information: opening hours, doctor timings, consultation fees, directions and pre-visit instructions. Symptoms, diagnoses, treatment and medical advice are deferred to the doctor; emergencies are directed to 108." },
  { question: "Can we update timings and doctor information?", answer: "Yes. Your clinic information can be updated as schedules, fees and instructions change. The assistant uses that approved information on both phone and WhatsApp." },
  { question: "Is Aura Health Clinic a real clinic?", answer: "No. Aura Health Clinic is a fictional live demonstration with illustrative clinic information. The demo does not book real medical appointments. Your custom assistant is configured with your own clinic details." },
] as const;

const BENEFITS = [
  { icon: Clock3, title: "Morning rush. Evening calls. Night-time messages.", text: "During peak morning OPD hours, your team can focus on patients in the clinic while Mira handles routine inquiries. After hours, callers and WhatsApp visitors still get a response." },
  { icon: Stethoscope, title: "The answers patients ask for most", text: "Share clinic hours, doctor timings and consultation fees from your approved information — without your staff repeating the same details on every call and message." },
  { icon: MapPin, title: "A clearer path to the visit", text: "Answer directions and location questions, and share clinic-approved pre-visit instructions. Medical questions remain with your doctors." },
] as const;

export const Route = createFileRoute("/clinics")({
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
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Service", "@id": `${PAGE_URL}#service`, url: PAGE_URL,
            name: "24/7 Clinic Assistant — Phone & WhatsApp", serviceType: "Clinic phone answering and WhatsApp messaging",
            description: "One done-for-you 24/7 assistant for clinic phone calls and WhatsApp messages. Answers operational inquiries and captures appointment requests for human confirmation; does not provide medical advice and directs emergencies to 108.",
            provider: { "@type": "Organization", name: "Conversational Flows Studio", url: "https://conversationalaistudio.online/" },
            areaServed: { "@type": "Country", name: "India" },
            audience: { "@type": "BusinessAudience", name: "Doctors and clinics" },
            availableChannel: [
              { "@type": "ServiceChannel", serviceUrl: PHONE_ASSISTANT_URL, servicePhone: { "@type": "ContactPoint", telephone: "+917965481796", contactType: "live fictional clinic demo" } },
              { "@type": "ServiceChannel", serviceUrl: WHATSAPP_ASSISTANT_URL },
            ],
          },
          { "@type": "FAQPage", "@id": `${PAGE_URL}#faq`, mainEntity: FAQS.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
          {
            "@type": "WebPage", "@id": PAGE_URL, url: PAGE_URL, name: PAGE_TITLE,
            mainEntity: { "@id": `${PAGE_URL}#service` },
            about: { "@type": "Thing", name: "24/7 operational assistance for medical clinics" },
            mentions: { "@type": "MedicalClinic", "@id": `${PAGE_URL}#fictional-demo`, name: "Aura Health Clinic — fictional demonstration", description: "A hypothetical clinic used only to demonstrate phone and WhatsApp assistance. Not a real medical business; no real appointments are booked." },
          },
        ],
      }),
    }],
  }),
  component: ClinicsPage,
});

function ClinicsPage() {
  return (
    <div className="min-h-screen">
      <PublicSiteHeader current="clinics" />
      <main>
        <section aria-labelledby="clinic-title" className="relative isolate overflow-hidden border-y border-border">
          <img src={clinicImage} alt="Illustrative clinic reception area with a telephone and appointment notebook" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 -z-10 bg-background/85" />
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">For doctors &amp; clinics</p>
            <h1 id="clinic-title" className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">A 24/7 Phone &amp; WhatsApp Assistant for Your Clinic</h1>
            <p className="mt-6 max-w-2xl text-lg text-foreground">One assistant. Both channels. Done for you.</p>
            <p className="mt-3 max-w-2xl text-base text-foreground">Mira answers clinic calls and WhatsApp messages simultaneously, shares doctor timings and captures appointment requests — while your staff focuses on patients and confirms every visit.</p>
            <Button asChild size="lg" className="mt-6 min-h-11"><a href="#clinic-setup">Get an assistant for my clinic</a></Button>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <section aria-labelledby="live-demos" className="mt-12">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Live fictional clinic demo</p>
            <h2 id="live-demos" className="mt-3 text-2xl font-semibold sm:text-3xl">Two channels, one assistant</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">Meet Mira at Aura Health Clinic, a hypothetical clinic with illustrative doctors, hours and fees. Try a phone call and a WhatsApp conversation. These are demonstrations, not real medical appointments.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="flex min-w-0 flex-col rounded-lg border border-border bg-card/60 p-5 sm:p-6">
                <Phone className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold">Phone channel</h3>
                <p className="mb-5 mt-2 text-sm text-muted-foreground">Ask about doctor timings, consultation fees or a preferred appointment slot in a natural conversation.</p>
                <Button asChild size="lg" className="mt-auto h-auto min-h-11 whitespace-normal py-3 text-center"><a href={PHONE_ASSISTANT_URL}><Phone className="h-4 w-4 shrink-0" />Call Mira live on {PHONE_ASSISTANT_DISPLAY}</a></Button>
              </article>
              <article className="flex min-w-0 flex-col rounded-lg border border-border bg-card/60 p-5 sm:p-6">
                <MessageCircle className="h-6 w-6 text-agent-b" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold">WhatsApp channel</h3>
                <p className="mb-5 mt-2 text-sm text-muted-foreground">Send TRY AURA to start the same fictional clinic experience. Ask for timings, directions or an appointment request.</p>
                <Button asChild variant="outline" size="lg" className="mt-auto h-auto min-h-11 whitespace-normal py-3 text-center"><a href={WHATSAPP_ASSISTANT_URL} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 shrink-0" />Message Mira on WhatsApp</a></Button>
              </article>
            </div>
          </section>

          <section aria-labelledby="bottlenecks" className="mt-16">
            <h2 id="bottlenecks" className="text-2xl font-semibold sm:text-3xl">Less reception overload. More time for patients.</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, text }) => <article key={title} className="min-w-0 border-t border-border pt-5"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{text}</p></article>)}
            </div>
          </section>

          <section aria-labelledby="staff-confirmation" className="mt-16 border-y border-border py-8">
            <h2 id="staff-confirmation" className="text-2xl font-semibold sm:text-3xl">Mira takes the request. Your team confirms the visit.</h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              <li className="min-w-0"><MessageCircle className="h-5 w-5 text-agent-b" /><h3 className="mt-3 font-semibold">1. Patient calls or messages</h3><p className="mt-2 text-sm text-muted-foreground">Mira answers logistical questions using your approved clinic information, on either channel.</p></li>
              <li className="min-w-0"><CalendarCheck className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">2. Mira gathers the preferences</h3><p className="mt-2 text-sm text-muted-foreground">Patient name, contact details, doctor preference and preferred date or slot are captured as an appointment request.</p></li>
              <li className="min-w-0"><UserCheck className="h-5 w-5 text-success" /><h3 className="mt-3 font-semibold">3. Staff reviews and confirms</h3><p className="mt-2 text-sm text-muted-foreground">Your team checks the diary and confirms availability. No slot is promised before human review.</p></li>
            </ol>
          </section>

          <aside aria-labelledby="medical-safety" className="mt-12 border-l-4 border-primary bg-secondary/50 p-5 sm:p-6">
            <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-primary" /><h2 id="medical-safety" className="text-xl font-semibold">Clinic logistics, not medical advice</h2></div>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">Mira handles operational and logistical inquiries only. Symptoms, diagnosis, treatment and medical advice are deferred to the doctor. Pre-visit instructions come from your clinic, not from an independent medical recommendation.</p>
            <p className="mt-3 text-sm font-medium">For an emergency, call 108 immediately. Do not wait for an appointment request to be reviewed.</p>
          </aside>

          <section aria-labelledby="clinic-faq" className="mt-16">
            <h2 id="clinic-faq" className="text-2xl font-semibold sm:text-3xl">Questions clinics ask</h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {FAQS.map(({ question, answer }) => <details key={question} className="group"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" /></summary><p className="max-w-3xl pb-4 text-sm text-muted-foreground">{answer}</p></details>)}
            </div>
          </section>

          <section id="clinic-setup" aria-labelledby="clinic-enquiry" className="mt-16 scroll-mt-8 border-t border-border pt-10">
            <h2 id="clinic-enquiry" className="text-2xl font-semibold sm:text-3xl">Get one for your clinic</h2>
            <p className="mb-6 mt-3 max-w-3xl text-muted-foreground">Tell us about your clinic and how your team handles calls and WhatsApp today. We’ll discuss a done-for-you setup covering both channels, with your own timings, doctors, fees and staff confirmation process.</p>
            <LeadForm businessPlaceholder="e.g. dental clinic, diagnostic centre" submitLabel="Request my Phone & WhatsApp assistant" />
          </section>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}