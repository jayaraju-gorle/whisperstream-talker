import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClinicWizard } from "@/components/clinic/ClinicWizard";
import { BusinessCallSettings } from "@/components/clinic/BusinessCallSettings";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { supabase } from "@/integrations/supabase/client";
import { toClinicInput } from "@/lib/clinic";
import { CLINIC_COLUMNS, type ClinicRow } from "@/lib/clinic-store";

export const Route = createFileRoute("/_authenticated/clinics/$id/edit")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Business settings — Conversational AI Flows Studio" },
      { name: "description", content: "Update business details, team, fees and assistant call settings." },
      { property: "og:title", content: "Business settings — Conversational AI Flows Studio" },
      { property: "og:description", content: "Update business details, team, fees and assistant call settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditClinic,
});

function EditClinic() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["clinics", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select(CLINIC_COLUMNS).eq("id", id).single();
      if (error) throw error;
      return data as unknown as ClinicRow;
    },
  });
  return (
    <main className="w-full space-y-8 p-4 sm:p-6">
      <h1 className="mx-auto mb-6 max-w-3xl text-2xl font-semibold">Business settings</h1>
      {isLoading && <LoadingIndicator />}
      {isError && <p className="text-center text-sm text-destructive">Couldn't load this clinic.</p>}
      {data && <ClinicWizard userId={user.id} initial={toClinicInput(data)} existing={data} />}
      {data && <BusinessCallSettings key={data.id} businessId={data.id} initial={data.call_settings} businessHours={toClinicInput(data).hours} />}
    </main>
  );
}
