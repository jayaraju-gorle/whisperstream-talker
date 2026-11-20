import type { UIMessage } from "ai";
import { clinicVisitorKey, CLINIC_VISITOR_PREFIX } from "@/lib/clinic";
import { DEMO_BUSINESS_SETTING_KEY, parseDemoBusinessId } from "@/lib/demo-business";
import { PUBLIC_SAMPLE_BUSINESS_ID } from "@/lib/public-clinic-demo";
import { activeClinicCommand } from "@/lib/server/clinic-mode.server";

export const WEB_CLINIC_VISITOR_PREFIX = "web_c_";

export type PortalConversationMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type PortalConversation = {
  id: string;
  channel: "WhatsApp" | "Phone" | "Browser";
  contact: string;
  preview: string;
  messageCount: number;
  hasAppointment: boolean;
  updated_at: string;
  messages: PortalConversationMessage[];
};

type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

function extractMessages(raw: UIMessage[]): {
  messages: PortalConversationMessage[];
  hasAppointment: boolean;
} {
  const out: PortalConversationMessage[] = [];
  let hasAppointment = false;
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i];
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    const parts = Array.isArray(m.parts) ? m.parts : [];
    if (parts.some((p) => p?.type === "tool-request_appointment")) {
      hasAppointment = true;
    }
    const text = parts
      .map((p) => (p?.type === "text" && typeof p.text === "string" ? p.text : ""))
      .join("")
      .trim();
    if (!text) continue;
    out.push({
      id: typeof m.id === "string" && m.id ? m.id : `msg-${i}`,
      role: m.role,
      text,
    });
  }
  return { messages: out, hasAppointment };
}

function channelForVisitor(visitorId: string): "WhatsApp" | "Phone" | "Browser" {
  if (visitorId.startsWith("whatsapp_") || visitorId.startsWith(CLINIC_VISITOR_PREFIX)) {
    return "WhatsApp";
  }
  if (visitorId.startsWith("bolna_")) return "Phone";
  return "Browser";
}

function contactForVisitor(visitorId: string, phoneByVisitor: Map<string, string>): string {
  if (visitorId.startsWith("whatsapp_")) return visitorId.slice("whatsapp_".length);
  if (visitorId.startsWith(CLINIC_VISITOR_PREFIX)) {
    const parts = visitorId.split("_");
    return parts.slice(3).join("_") || "WhatsApp visitor";
  }
  if (visitorId.startsWith("bolna_")) return phoneByVisitor.get(visitorId) ?? "Phone caller";
  return "Website visitor";
}

export async function loadClinicConversations(
  db: Db,
  clinic: { id: string; testCode: string },
): Promise<PortalConversation[]> {
  const key = clinicVisitorKey(clinic.id);
  const waPrefix = `${CLINIC_VISITOR_PREFIX}${key}_`;
  const webPrefix = `${WEB_CLINIC_VISITOR_PREFIX}${key}_`;
  const normalizedCode = clinic.testCode.trim().toUpperCase();

  const [settingRes, assistantRes, studioRes] = await Promise.all([
    db.from("app_settings").select("value").eq("key", DEMO_BUSINESS_SETTING_KEY).maybeSingle(),
    db
      .from("assistant_conversations")
      .select("id,visitor_id,messages,updated_at")
      .order("updated_at", { ascending: false })
      .limit(150),
    db
      .from("conversations")
      .select("id,title,created_at,turns(id,user_text,assistant_text,created_at)")
      .eq("clinic_id", clinic.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const activeDemoId = parseDemoBusinessId(settingRes.data?.value);
  const isDefaultDemo =
    clinic.id === activeDemoId || (!activeDemoId && clinic.id === PUBLIC_SAMPLE_BUSINESS_ID);

  const assistantRows = assistantRes.data ?? [];
  const bolnaIds = assistantRows
    .map((r) => r.visitor_id)
    .filter((v) => typeof v === "string" && v.startsWith("bolna_"));

  const phoneByVisitor = new Map<string, string>();
  if (bolnaIds.length) {
    const { data: links } = await db
      .from("phone_call_links")
      .select("visitor_id,phone")
      .in("visitor_id", bolnaIds);
    for (const link of links ?? []) {
      if (link.visitor_id && link.phone) phoneByVisitor.set(link.visitor_id, link.phone);
    }
  }

  const out: PortalConversation[] = [];

  for (const row of assistantRows) {
    const visitorId = row.visitor_id ?? "";
    const raw = (Array.isArray(row.messages) ? row.messages : []) as unknown as UIMessage[];
    const directMatch = visitorId.startsWith(waPrefix) || visitorId.startsWith(webPrefix);
    const cmd = activeClinicCommand(raw);
    let scopedMessages = raw;

    if (!directMatch) {
      if (cmd.code) {
        if (cmd.code !== normalizedCode) continue;
        scopedMessages = raw.slice(cmd.index + 1);
      } else {
        if (!isDefaultDemo || cmd.index >= 0) continue;
      }
    }

    const { messages, hasAppointment } = extractMessages(scopedMessages);
    if (!messages.length) continue;

    const firstUser = messages.find((m) => m.role === "user");
    const preview = (firstUser?.text ?? messages[0]?.text ?? "Conversation").slice(0, 120);

    out.push({
      id: row.id,
      channel: channelForVisitor(visitorId),
      contact: contactForVisitor(visitorId, phoneByVisitor),
      preview,
      messageCount: messages.length,
      hasAppointment,
      updated_at: row.updated_at,
      messages,
    });
  }

  for (const c of studioRes.data ?? []) {
    const turns = Array.isArray(c.turns) ? c.turns : [];
    const messages: PortalConversationMessage[] = [];
    for (const t of turns) {
      if (t.user_text?.trim()) {
        messages.push({ id: `${t.id}-u`, role: "user", text: t.user_text.trim() });
      }
      if (t.assistant_text?.trim()) {
        messages.push({ id: `${t.id}-a`, role: "assistant", text: t.assistant_text.trim() });
      }
    }
    if (!messages.length) continue;
    const latestTurnAt = turns[turns.length - 1]?.created_at ?? c.created_at;
    out.push({
      id: `studio-${c.id}`,
      channel: "Browser",
      contact: "Voice preview",
      preview: (messages[0]?.text ?? c.title ?? "Voice session").slice(0, 120),
      messageCount: messages.length,
      hasAppointment: false,
      updated_at: latestTurnAt,
      messages,
    });
  }

  return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 100);
}
