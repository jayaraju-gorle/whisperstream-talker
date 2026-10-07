import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest } from "@lovable.dev/webhooks-js";

// Signed WhatsApp callbacks from the connector. Stores each delivery durably, then Flo processing
// runs after the response (src/server.ts schedules drainWhatsApp) to stay within the 5s budget.
export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["WHATSAPP_API_KEY"];
        if (!secret) return new Response("Not configured", { status: 500 });
        let payload: unknown;
        try {
          ({ payload } = await verifyWebhookRequest({ req: request, secret, maxBodyBytes: 4 * 1024 * 1024 }));
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }
        const deliveryId = request.headers.get("X-Lovable-Delivery")?.trim();
        const event = request.headers.get("X-Lovable-Event")?.trim();
        if (!deliveryId || !event) return new Response("Missing delivery headers", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("whatsapp_webhook_events")
          .upsert({ delivery_id: deliveryId, event, payload: payload as never }, { onConflict: "delivery_id", ignoreDuplicates: true });
        if (error) {
          console.error("whatsapp inbox write failed", error);
          return new Response("Storage failed", { status: 500 });
        }
        // Process this and any earlier pending events before answering, so multi-step replies (lead
        // saving, email alert) finish inside the request. A gateway retry of a slow delivery is safe:
        // the event is deduplicated and the reply is claimed, so it is never sent twice.
        const { drainWhatsApp } = await import("@/lib/server/whatsapp.server");
        await drainWhatsApp().catch((e: unknown) => console.error("whatsapp drain failed", e));
        return new Response("ok", { status: 200 });
      },
    },
  },
});
