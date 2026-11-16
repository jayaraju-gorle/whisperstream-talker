import { createFileRoute } from "@tanstack/react-router";
import { handlePhoneCaller } from "@/lib/server/phone-caller.server";

export const Route = createFileRoute("/api/public/bolna/caller")({
  staticData: { sitemap: false },
  server: { handlers: { GET: ({ request }) => handlePhoneCaller(request) } },
});