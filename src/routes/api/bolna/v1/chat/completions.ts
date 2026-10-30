import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bolna/v1/chat/completions")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const { handleBolnaChat } = await import("@/lib/server/bolna.server");
    return handleBolnaChat(request);
  } } },
});