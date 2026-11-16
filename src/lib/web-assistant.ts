/** Website text and voice share the same opening, independent of sample facts. */
export function webAssistantGreeting(businessName: string | null) {
  return businessName
    ? `Hi, I'm Mira, the 24/7 assistant for ${businessName}. How can I help you today?`
    : "Hi, I'm Mira, your 24/7 assistant. How can I help you today?";
}

export const WEB_GREETING_RULES = `WEBSITE WELCOME: Use a business-neutral introduction when no specific business is selected. Do not introduce yourself as Aura's assistant in the welcome. When discussing Aura's facts, fees, directions or simulated appointments, still explain that Aura is fictional. For a selected business, use only that business's name and never reference Aura. Do not repeat an introduction during an ongoing conversation.`;