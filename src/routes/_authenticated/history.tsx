import { createFileRoute, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoadingIndicator } from "@/components/LoadingIndicator";

export const Route = createFileRoute("/_authenticated/history")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Session History — Conversational Flows Studio" },
      { name: "description", content: "Past voice agent sessions with latency and cost per turn." },
      { property: "og:title", content: "Session History — Conversational Flows Studio" },
      { property: "og:description", content: "Past voice agent sessions with latency and cost per turn." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const child = useMatch({ from: "/_authenticated/history/$id", shouldThrow: false });
  const navigate = useNavigate();
  useEffect(() => {
    if (!child) void navigate({ to: "/playground", search: { tab: "history" }, replace: true });
  }, [child, navigate]);
  if (child) return <Outlet />;
  return <main className="p-8"><LoadingIndicator label="Opening Session History…" /></main>;
}
