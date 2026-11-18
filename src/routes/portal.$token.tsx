import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { ClinicPortalView } from "@/components/clinic/ClinicPortalView";
import { getPortal, savePortalClinic, setPortalStatus } from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/$token")({
  staticData: { sitemap: false },
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    admin: typeof search["admin"] === "string" ? search["admin"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Assistant portal — Conversational Flows Studio" },
      {
        name: "description",
        content: "Review and confirm incoming appointment requests for your business.",
      },
      { property: "og:title", content: "Assistant portal — Conversational Flows Studio" },
      {
        property: "og:description",
        content: "Review and confirm incoming appointment requests for your business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Portal,
});

function Portal() {
  const { token } = Route.useParams();
  const { admin } = Route.useSearch();
  const load = useServerFn(getPortal);
  const updateStatus = useServerFn(setPortalStatus);
  const saveDetails = useServerFn(savePortalClinic);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["portal", token, admin ?? "staff"],
    queryFn: () => load({ data: { token, adminKey: admin } }),
    refetchInterval: 20000,
    retry: false,
  });

  if (q.isLoading) {
    return (
      <main className="p-6">
        <LoadingIndicator />
      </main>
    );
  }
  if (q.isError || !q.data) {
    return (
      <main className="mx-auto max-w-md p-6 text-center text-sm text-destructive">
        This portal link is invalid or has been replaced. Ask your business admin for the current
        link.
      </main>
    );
  }

  return (
    <ClinicPortalView
      clinicName={q.data.clinic.name}
      role={q.data.role}
      requests={q.data.requests}
      details={q.data.details}
      onStatusChange={async (id, status) => {
        await updateStatus({ data: { token, id, status } });
        await qc.invalidateQueries({ queryKey: ["portal", token] });
      }}
      onSaveDetails={
        q.data.role === "admin" && admin
          ? async (clinic) => {
              await saveDetails({ data: { token, adminKey: admin, clinic } });
              await qc.invalidateQueries({ queryKey: ["portal", token] });
            }
          : undefined
      }
    />
  );
}
