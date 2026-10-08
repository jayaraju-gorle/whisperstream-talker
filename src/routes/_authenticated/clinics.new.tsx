import { createFileRoute } from "@tanstack/react-router";
import { ClinicWizard } from "@/components/clinic/ClinicWizard";
import { emptyClinic } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/clinics/new")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "New clinic — Conversational AI Flows Studio" },
      { name: "description", content: "Onboard a clinic: details, opening hours, doctors and fees, then a test patient call." },
      { property: "og:title", content: "New clinic — Conversational AI Flows Studio" },
      { property: "og:description", content: "Onboard a clinic: details, opening hours, doctors and fees, then a test patient call." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewClinic,
});

function NewClinic() {
  const { user } = Route.useRouteContext();
  return (
    <main className="w-full p-4 sm:p-6">
      <h1 className="mx-auto mb-6 max-w-3xl text-2xl font-semibold">Set up a clinic</h1>
      <ClinicWizard userId={user.id} initial={emptyClinic()} />
    </main>
  );
}
