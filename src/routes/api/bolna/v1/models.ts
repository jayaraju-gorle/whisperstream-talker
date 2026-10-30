import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bolna/v1/models")({
  staticData: { sitemap: false },
  server: { handlers: { GET: async ({ request }) => {
    const { handleBolnaModels } = await import("@/lib/server/bolna.server");
    return handleBolnaModels(request);
  } } },
});