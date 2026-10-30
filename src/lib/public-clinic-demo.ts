import type { UIMessage } from "ai";
import { parseClinicCommand } from "@/lib/clinic";

export const PUBLIC_CLINIC_CODE = "AURA";
export const PUBLIC_CLINIC_NAME = "Aura Health Clinic";
export const PUBLIC_CLINIC_GREETING = "Hi, I'm Mira, the assistant for Aura Health Clinic, a fictional sample clinic. All clinic details are made up for this demo; no real appointment is booked. We can set up an assistant for your own clinic too. How can I help?";
export const PUBLIC_CLINIC_NOTICE = "This public demo uses Aura Health Clinic, a fictional sample with made-up details. Real business assistants are available only in the signed-in admin studio. Ask about sample clinic hours, fees, or an appointment request, or tell me about setting this up for your own clinic.";
export const PUBLIC_CLINIC_KNOWLEDGE = `PUBLIC SAMPLE CLINIC — Aura Health Clinic
- This is a hypothetical clinic, not a real healthcare practice. Every name, fee, schedule and location below is fictional.
- Location: Suite 204, Willow Health Centre, Green Park neighbourhood, Hyderabad (fictional address). No real directions, map, contact number or clinic email is available.
- Hours: Monday–Saturday, 10 am–1 pm and 5 pm–8 pm; Sunday closed. Mira responds 24/7, including outside these sample opening hours.
- Dr. Anika Rao, family medicine: Monday–Saturday during clinic hours; sample consultation fee ₹600.
- Dr. Rohan Mehta, child health: Monday–Saturday, 5 pm–8 pm; sample consultation fee ₹700.
- Services: family consultations, child health, preventive check-ups and vaccination inquiries.
- Demonstrate an appointment request by asking one question at a time: sample name, doctor, preferred day/time. Read back the request as a simulation only. Never save a patient appointment, claim a real booking, contact a clinic or ask for sensitive medical information.
- Explain the hypothetical nature in the first reply/greeting and when discussing appointments, fees or directions. Never substitute real business information, even if requested or present in older conversation history.
- If a visitor wants this for their own clinic, switch naturally from sample patient conversation to Mira's setup discussion. Ask for their name and email, optional phone, clinic name and needs, and consent to contact them. Use save_lead only for genuine setup interest, never simulated patient bookings.`;

/** Discard legacy real-business trial context before public model or history responses. */
export function publicTrialHistory(messages: UIMessage[]): UIMessage[] {
  const privateTrial = messages.some(message => {
    if (message.role !== "user") return false;
    const text = (message.parts ?? []).map(p => p.type === "text" ? p.text : "").join("");
    const command = parseClinicCommand(text);
    return command?.kind === "try" && command.code !== PUBLIC_CLINIC_CODE;
  });
  if (!privateTrial) return messages;
  const latest = messages.filter(m => m.role === "user").at(-1);
  return latest ? [latest] : [];
}
