import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { WebAgentStorefront } from "@/components/WebAgentStorefront";
import { getAuraPublicInfo } from "@/lib/portal.functions";

const PAGE_URL = "https://conversationalaistudio.online/web-agent";
const PAGE_TITLE = "Sample Clinic Website — 24/7 Web Assistant Bubble Demo";
const PAGE_DESCRIPTION =
  "Interactive preview of a clinic website with our 24/7 expandable Web Assistant bubble at the bottom right, connected with WhatsApp and Phone.";

export const Route = createFileRoute("/web-agent")({
  staticData: { sitemap: true, sitemapPriority: 0.9 },
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: WebAgentDemo,
});

function WebAgentDemo() {
  const fetchAura = useServerFn(getAuraPublicInfo);
  const { data: clinic } = useQuery({
    queryKey: ["aura-public-info"],
    queryFn: () => fetchAura(),
    refetchInterval: 20000,
    retry: false,
  });

  return <WebAgentStorefront clinic={clinic} isDemoPreview />;
}
