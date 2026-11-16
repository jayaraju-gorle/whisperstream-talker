import { verifyBolnaBearer } from "./bolna.server";
import { loadRecentWhatsAppContext, normalizeCallerPhone, phoneContextToken, phoneVisitorId } from "./phone-context.server";

/** Bolna inbound caller lookup: returns only a signed reference, never private conversation text. */
export async function handlePhoneCaller(request: Request) {
  const denied = verifyBolnaBearer(request);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const phone = normalizeCallerPhone(params.get("contact_number") ?? undefined);
  const execution = params.get("execution_id");
  if (!phone || !execution || execution.length > 200) return Response.json({ error: "Valid caller number and execution_id required" }, { status: 400 });
  const secret = process.env["BOLNA_API_TOKEN"];
  if (!secret) return Response.json({ error: "Phone integration unavailable" }, { status: 503 });
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const visitorId = await phoneVisitorId(execution);
  try {
    const { data: existing, error } = await db.from("assistant_conversations").select("messages").eq("visitor_id", visitorId).maybeSingle();
    if (error) throw new Error("Could not load phone conversation");
    if (!existing) {
      const messages = await loadRecentWhatsAppContext(db, phone);
      const { error: saveError } = await db.from("assistant_conversations").upsert({ visitor_id: visitorId, messages: messages as never }, { onConflict: "visitor_id", ignoreDuplicates: true });
      if (saveError) throw new Error("Could not save phone context");
    }
    return Response.json({ mira_context_token: await phoneContextToken(visitorId, secret) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not prepare caller context" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}