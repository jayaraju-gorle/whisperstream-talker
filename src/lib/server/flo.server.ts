import { z } from "zod";
import { tool } from "ai";
import { contactDetails } from "@/lib/assistant-contact";

// Shared Mira behaviour for the website chat and WhatsApp: lead tool + new-lead email alert.
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

const LEAD_ALERT_TO = "gorlej2015@email.iimcal.ac.in";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function notifyNewLead(lead: {
  name: string; email: string; phone: string | null; company: string | null; interest: string | null; channel?: string | undefined;
}) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!apiKey || !resendKey) return;
  const row = (label: string, value: string | null | undefined) =>
    value ? `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${label}</td><td>${esc(value)}</td></tr>` : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px">
    <h2 style="margin:0 0 12px">New lead from Mira</h2>
    <table style="border-collapse:collapse;font-size:14px">
      ${row("Name", lead.name)}${row("Email", lead.email)}${row("Phone", lead.phone)}${row("Company", lead.company)}${row("Channel", lead.channel ?? "Website")}
    </table>
    ${lead.interest ? `<p style="font-size:14px"><strong>What they need:</strong><br>${esc(lead.interest)}</p>` : ""}
    <p style="font-size:12px;color:#888">View all leads in your studio's Leads page.</p>
  </div>`;
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": resendKey },
    body: JSON.stringify({
      from: "Conversational AI Flows Studio <onboarding@resend.dev>",
      to: [LEAD_ALERT_TO],
      subject: `New lead${lead.channel ? ` (${lead.channel})` : ""}: ${lead.name} (${lead.email})`,
      html,
    }),
  });
  if (!res.ok) console.error(`lead alert email failed [${res.status}]: ${await res.text()}`);
}

export function floTools(db: Db, conversationId: string, channel?: string) {
  return {
    save_lead: tool({
      description: "Save or update the visitor's shared contact details so we can get back to them. Preserve unchanged fields; phone is optional.",
      inputSchema: z.object({
        name: z.string().min(1).max(120),
        email: z.string().max(254),
        phone: z.string().max(40).nullable(),
        company: z.string().max(160).nullable(),
        interest: z.string().max(2000).nullable().describe("What they need, in one or two sentences"),
      }),
      execute: async (input) => {
        const details = contactDetails(input);
        if (!details) return { saved: false, reason: "Ask the visitor to check their name and email address." };
        const { data: existing, error: lookupError } = await db.from("leads")
          .select("id").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (lookupError) return { saved: false, reason: "Couldn't load the shared details. Please try again." };
        const { error } = existing
          ? await db.from("leads").update(details).eq("id", existing.id).eq("conversation_id", conversationId)
          : await db.from("leads").insert({ conversation_id: conversationId, ...details });
        if (error) {
          console.error("lead insert failed", error);
          return { saved: false, reason: "Saving failed; apologise and suggest trying again shortly." };
        }
        if (!existing) await notifyNewLead({ ...details, channel }).catch((e: unknown) => console.error("lead alert email failed", e));
        return { saved: true, updated: Boolean(existing) };
      },
    }),
  };
}

export const FLO_PROVIDER_OPTIONS = {
  openai: {
    store: false,
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    include: ["reasoning.encrypted_content"],
  },
} as const;
