import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ClinicAdminEditor } from "@/components/clinic/ClinicPortalView";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { supabase } from "@/integrations/supabase/client";
import { toClinicInput } from "@/lib/clinic";
import { CLINIC_COLUMNS, saveClinic, type ClinicRow } from "@/lib/clinic-store";
import { PUBLIC_SAMPLE_BUSINESS_ID } from "@/lib/public-clinic-demo";

export const Route = createFileRoute("/_authenticated/clinics/$id/edit")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Business settings — Conversational Flows Studio" },
      {
        name: "description",
        content: "Update business details, OPD timings, doctors, fees, and FAQs.",
      },
      { property: "og:title", content: "Business settings — Conversational Flows Studio" },
      {
        property: "og:description",
        content: "Update business details, OPD timings, doctors, fees, and FAQs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditClinic,
});

function EditClinic() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["clinics", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select(CLINIC_COLUMNS)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as ClinicRow;
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-4 pb-24 sm:p-6">
      <div className="space-y-1">
        <Link
          to="/clinics/$id"
          params={{ id }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {data?.name ?? "business"}
        </Link>
        <h1 className="text-2xl font-semibold">
          {data?.name ? `${data.name} — Edit setup` : "Business settings"}
        </h1>
        {id === PUBLIC_SAMPLE_BUSINESS_ID && (
          <p className="text-sm text-muted-foreground">
            Aura Health Clinic · Public fictional sample. Saved hours, doctors, fees and details
            apply to Mira&apos;s next website, WhatsApp and phone replies. Keep all sample
            information hypothetical.
          </p>
        )}
      </div>
      {isLoading && <LoadingIndicator />}
      {isError && (
        <p className="text-center text-sm text-destructive">Couldn&apos;t load this clinic.</p>
      )}
      {data && (
        <ClinicAdminEditor
          key={JSON.stringify({ updated: data.updated_at, code: data.test_code })}
          initial={toClinicInput(data)}
          initialShortCode={data.test_code ?? ""}
          onSave={async (clinic, shortCode) => {
            await saveClinic(user.id, clinic, data, {
              ...(shortCode ? { shortCode } : {}),
              updatedBy: "Super Admin",
            });
            await qc.invalidateQueries({ queryKey: ["clinics"] });
            await qc.invalidateQueries({ queryKey: ["clinics", id] });
          }}
        />
      )}
    </main>
  );
}
