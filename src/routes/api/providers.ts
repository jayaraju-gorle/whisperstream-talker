import { createFileRoute } from "@tanstack/react-router";
import { PROVIDERS, type ConnectionId, type ProviderId } from "@/lib/catalog";
import { json, providerKey, verifyRequest } from "@/lib/server/auth.server";

export const Route = createFileRoute("/api/providers")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await verifyRequest(request);
        if (auth instanceof Response) return auth;
        const out = {} as Record<ConnectionId, boolean>;
        for (const [id, p] of Object.entries(PROVIDERS) as [ProviderId, (typeof PROVIDERS)[ProviderId]][]) {
          out[id] = p.secret ? !!providerKey(p.secret) : !!providerKey("LOVABLE_API_KEY");
        }
        out.lovable = !!providerKey("LOVABLE_API_KEY");
        return json(out);
      },
    },
  },
});
