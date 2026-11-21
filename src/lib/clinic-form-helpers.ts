export type StructuredAddress = {
  street: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
};

export type ClinicFaqItem = {
  question: string;
  answer: string;
};

export type CommonClinicFaq = {
  question: string;
  defaultAnswer: string;
  quickAnswers: readonly string[];
};

export const COMMON_CLINIC_FAQS: readonly CommonClinicFaq[] = [
  {
    question: "Is parking available at the clinic?",
    defaultAnswer: "Yes, free two-wheeler and car parking is available right outside the clinic.",
    quickAnswers: [
      "Yes, free two-wheeler and car parking is available right outside the clinic.",
      "Two-wheeler parking is available outside; street parking nearby for cars.",
      "Street parking is available nearby.",
    ],
  },
  {
    question: "Do you accept walk-in patients?",
    defaultAnswer:
      "Yes, walk-in patients are welcome, though booking an appointment reduces wait time.",
    quickAnswers: [
      "Yes, walk-in patients are welcome, though booking an appointment reduces wait time.",
      "Appointments are preferred, and limited walk-in slots are available daily.",
      "By appointment only — please book ahead via WhatsApp, phone, or our website.",
    ],
  },
  {
    question: "What payment methods are accepted (UPI, cards, cash)?",
    defaultAnswer: "We accept UPI (GPay, PhonePe, Paytm), debit/credit cards, and cash.",
    quickAnswers: [
      "We accept UPI (GPay, PhonePe, Paytm), debit/credit cards, and cash.",
      "We accept UPI and cash.",
      "We accept UPI, cards, cash, and major health insurance.",
    ],
  },
  {
    question: "Should I bring previous prescriptions or reports?",
    defaultAnswer:
      "Yes, please bring any previous prescriptions, X-rays, or medical reports if available.",
    quickAnswers: [
      "Yes, please bring any previous prescriptions, X-rays, or medical reports if available.",
      "Not mandatory for first visits, but helpful if you have recent reports.",
    ],
  },
  {
    question: "Is emergency care available?",
    defaultAnswer:
      "Yes, urgent cases are prioritized during clinic hours. Please call ahead before arriving.",
    quickAnswers: [
      "Yes, urgent cases are prioritized during clinic hours. Please call ahead before arriving.",
      "For after-hours emergencies, please call our emergency number or visit the nearest hospital.",
    ],
  },
] as const;

export const COMMON_CLINIC_FAQ_PROMPTS = COMMON_CLINIC_FAQS.map((f) => f.question);

const PIN_RE = /(?:[-–,\s]+)?(\d{6})\s*$/;

export function parseStructuredAddress(raw: string): StructuredAddress {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { street: "", locality: "", city: "", state: "", pincode: "" };
  }

  let pincode = "";
  let rest = trimmed;
  const pinMatch = rest.match(PIN_RE);
  if (pinMatch?.[1]) {
    pincode = pinMatch[1];
    rest = rest
      .slice(0, pinMatch.index)
      .replace(/[-–,\s]+$/, "")
      .trim();
  }

  const parts = rest
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { street: "", locality: "", city: "", state: "", pincode };
  }
  if (parts.length === 1) {
    return { street: parts[0]!, locality: "", city: "", state: "", pincode };
  }
  if (parts.length === 2) {
    return { street: parts[0]!, locality: "", city: parts[1]!, state: "", pincode };
  }
  if (parts.length === 3) {
    return { street: parts[0]!, locality: parts[1]!, city: parts[2]!, state: "", pincode };
  }

  const state = parts[parts.length - 1]!;
  const city = parts[parts.length - 2]!;
  const prefix = parts.slice(0, -2);
  const street = prefix.length >= 3 ? prefix.slice(0, 2).join(", ") : prefix[0]!;
  const locality = prefix.length >= 3 ? prefix.slice(2).join(", ") : prefix.slice(1).join(", ");

  return { street, locality, city, state, pincode };
}

export function formatStructuredAddress(addr: StructuredAddress): string {
  const statePin = [addr.state.trim(), addr.pincode.trim()].filter(Boolean).join(" ");
  return [addr.street.trim(), addr.locality.trim(), addr.city.trim(), statePin]
    .filter(Boolean)
    .join(", ");
}

export function extractCoordsFromMapUrl(url: string): { lat: number; lng: number } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const patterns = [
    /[?&](?:query|q|ll)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/i,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
  ];

  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m?.[1] && m[2]) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export function googleMapsPinUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

const FAQ_HEADER_RE = /(?:^|\n)FAQs:\s*\n/i;

export function parseClinicNotes(raw: string): { overview: string; faqs: ClinicFaqItem[] } {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return { overview: "", faqs: [] };

  let overview = normalized;
  let faqBlock = "";

  const headerMatch = normalized.match(FAQ_HEADER_RE);
  if (headerMatch && headerMatch.index !== undefined) {
    overview = normalized.slice(0, headerMatch.index).trim();
    faqBlock = normalized.slice(headerMatch.index + headerMatch[0].length).trim();
  } else if (/^Q:\s*/i.test(normalized)) {
    overview = "";
    faqBlock = normalized;
  }

  if (!faqBlock) return { overview, faqs: [] };

  const faqs: ClinicFaqItem[] = [];
  const entries = faqBlock.split(/\n(?=Q:\s*)/i);
  for (const entry of entries) {
    const match = entry.trim().match(/^Q:\s*([\s\S]*?)(?:\nA:\s*([\s\S]*))?$/i);
    if (!match) continue;
    const question = (match[1] ?? "").trim();
    const answer = (match[2] ?? "").trim();
    if (question || answer) {
      faqs.push({ question, answer });
    }
  }

  return { overview, faqs };
}

export function formatClinicNotes(overview: string, faqs: ClinicFaqItem[]): string {
  const cleanOverview = overview.trim();
  const cleanFaqs = faqs
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
    .filter((f) => f.question || f.answer);

  if (!cleanFaqs.length) return cleanOverview;

  const faqText = cleanFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

  return cleanOverview ? `${cleanOverview}\n\nFAQs:\n${faqText}` : `FAQs:\n${faqText}`;
}
