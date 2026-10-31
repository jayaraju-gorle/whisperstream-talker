type LeadIndicators = { name: string; email: string; company?: string | null; interest?: string | null };

export function isLikelyTestLead(lead: LeadIndicators): boolean {
  const email = lead.email.trim().toLowerCase();
  const domain = email.split("@").at(-1) ?? "";
  if (domain === "example.com" || domain.endsWith(".example.com")) return true;
  const fields = [lead.name, email.split("@")[0] ?? "", lead.company ?? "", lead.interest ?? ""];
  return fields.some(value => /playwright/i.test(value) || /(?:^|[\s._+\-])(?:test(?:ing)?|e2e|qa)(?=$|[\s._+\-\d])/i.test(value));
}