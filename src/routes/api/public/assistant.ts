import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/assistant")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleAssistantGet } = await import("@/lib/server/assistant-handler.server");
        return handleAssistantGet({ request });
      },
      POST: async ({ request }) => {
        const { handleAssistantPost } = await import("@/lib/server/assistant-handler.server");
        return handleAssistantPost({ request });
      },
    },
  },
});
