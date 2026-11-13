import { createFileRoute } from "@tanstack/react-router";
import { EmbeddedClinicAssistant } from "@/components/SiteAssistant";

export const Route = createFileRoute("/embed/assistant")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Mira · 24/7 Clinic Assistant" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EmbedAssistantPage,
});

function EmbedAssistantPage() {
  return <EmbeddedClinicAssistant />;
}
