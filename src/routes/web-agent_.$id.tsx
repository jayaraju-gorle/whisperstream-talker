import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebAgentStorefront } from "@/components/WebAgentStorefront";
import { getClinicPublicInfo } from "@/lib/portal.functions";

export const Route = createFileRoute("/web-agent_/$id")({
  staticData: { sitemap: false },
  loader: async ({ params }) => {
    try {
      return await getClinicPublicInfo({ data: { id: params.id } });
    } catch {
      return null;
    }
  },
  head: ({ loaderData, params }) => {
    const clinicName = loaderData?.name?.trim();
    const title = clinicName
      ? `${clinicName} — 24/7 Appointment Assistant`
      : "Clinic not found — 24/7 Appointment Assistant";
    const description = clinicName
      ? loaderData?.notes?.trim() ||
        `Book appointments, check doctor timings, and chat 24/7 with ${clinicName}'s assistant.`
      : "The requested clinic storefront could not be found.";
    const url = `https://conversationalaistudio.online/web-agent/${encodeURIComponent(params.id)}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: DedicatedWebAgentPage,
});

function DedicatedWebAgentPage() {
  const { id } = Route.useParams();
  const initialClinic = Route.useLoaderData();
  const fetchClinic = useServerFn(getClinicPublicInfo);
  const { data: clinic, isLoading } = useQuery({
    queryKey: ["clinic-public-info", id],
    queryFn: () => fetchClinic({ data: { id } }),
    initialData: initialClinic ?? undefined,
    refetchInterval: 20000,
    retry: false,
  });

  useEffect(() => {
    if (clinic?.name?.trim()) {
      document.title = `${clinic.name.trim()} — 24/7 Appointment Assistant`;
    }
  }, [clinic?.name]);

  if (isLoading && !clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Loading clinic storefront…
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Stethoscope className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-semibold">Clinic not found</h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t find a clinic storefront matching{" "}
            <span className="font-mono text-foreground">{id}</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link to="/web-agent">View public clinic demo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Studio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <WebAgentStorefront clinic={clinic} />;
}
