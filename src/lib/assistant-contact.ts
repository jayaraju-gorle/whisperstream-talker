import { z } from "zod";

export const ContactDetailsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).nullable(),
  company: z.string().trim().max(160).nullable(),
  interest: z.string().trim().max(2000).nullable(),
});

export type ContactDetails = z.infer<typeof ContactDetailsSchema>;

export function contactDetails(input: unknown): ContactDetails | null {
  const parsed = ContactDetailsSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    phone: parsed.data.phone || null,
    company: parsed.data.company || null,
    interest: parsed.data.interest || null,
  };
}

export function contactUpdateMessage(details: ContactDetails) {
  return `Please update my shared contact details to the following (blank optional fields should be removed):\nName: ${details.name}\nEmail: ${details.email}\nPhone: ${details.phone || ""}\nCompany: ${details.company || ""}\nWhat I need: ${details.interest || ""}`;
}