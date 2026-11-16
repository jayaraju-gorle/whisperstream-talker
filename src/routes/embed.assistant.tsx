import { createFileRoute } from "@tanstack/react-router";
import { EmbeddedClinicAssistant } from "@/components/SiteAssistant";

export const Route = createFileRoute("/embed/assistant")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Mira · 24/7 Clinic Assistant" },
      { name: "description", content: "Talk with Mira, your 24/7 assistant for business questions and appointment inquiries." },
      { property: "og:title", content: "Mira · 24/7 Clinic Assistant" },
      { property: "og:description", content: "Talk with Mira, your 24/7 assistant for business questions and appointment inquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EmbedAssistantPage,
});

function EmbedAssistantPage() {
  return <EmbeddedClinicAssistant />;
}
