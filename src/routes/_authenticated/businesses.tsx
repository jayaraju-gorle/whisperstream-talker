import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { readLastUpdatedBy } from "@/lib/clinic-store";
import { PUBLIC_SAMPLE_BUSINESS_ID } from "@/lib/public-clinic-demo";
import { DEMO_BUSINESS_SETTING_KEY, parseDemoBusinessId } from "@/lib/demo-business";

export const Route = createFileRoute("/_authenticated/businesses")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Businesses — Conversational Flows Studio" },
      {
        name: "description",
        content: "Set up AI assistants for client businesses and track their calls.",
      },
      { property: "og:title", content: "Businesses — Conversational Flows Studio" },
      {
        property: "og:description",
        content: "Set up AI assistants for client businesses and track their calls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clinics,
});

function Clinics() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("id,name,phone,address,created_at,updated_at,call_settings,test_code")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const demoQuery = useQuery({
    queryKey: ["demo-business-default"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", DEMO_BUSINESS_SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return parseDemoBusinessId(data?.value);
    },
  });
  const demoMutation = useMutation({
    mutationFn: async (clinicId: string | null) => {
      const { error } = await supabase.from("app_settings").upsert({
        key: DEMO_BUSINESS_SETTING_KEY,
        value: { clinic_id: clinicId },
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return clinicId;
    },
    onSuccess: (clinicId) => {
      queryClient.setQueryData(["demo-business-default"], clinicId);
      const name = data?.find((clinic) => clinic.id === clinicId)?.name;
      toast.success(
        name
          ? `${name} is now the default demo on website, WhatsApp and phone.`
          : "Public demos are back to Aura Health Clinic on every channel.",
      );
    },
    onError: () => toast.error("Couldn't change the demo business. Please try again."),
  });

  const defaultId = demoQuery.data ?? null;
  const defaultName = data?.find((clinic) => clinic.id === defaultId)?.name;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Businesses</h1>
          <p className="text-sm text-muted-foreground">
            AI assistants you've set up for client businesses — clinics, firms and more.
          </p>
        </div>
        <Button asChild>
          <Link to="/clinics/new">
            <Plus className="h-4 w-4" /> New business
          </Link>
        </Button>
      </div>

      <section
        className="rounded-lg border border-border bg-card p-4"
        aria-labelledby="demo-default-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h2 id="demo-default-heading" className="flex items-center gap-2 font-medium">
              <Radio className="h-4 w-4 text-primary" /> Default public demo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn on one business below to make it the starting assistant on website chat and
              voice, WhatsApp, and phone. Turn it off to return every channel to Aura. TRY codes
              still work during a demo; EXIT or TRY AURA returns that conversation to Aura.
            </p>
            {defaultName && (
              <p className="mt-2 text-sm font-medium text-primary">Currently live: {defaultName}</p>
            )}
          </div>
          {defaultId && (
            <Button
              variant="outline"
              size="sm"
              disabled={demoMutation.isPending}
              onClick={() => demoMutation.mutate(null)}
            >
              Return all channels to Aura
            </Button>
          )}
        </div>
        {demoQuery.isError && (
          <p className="mt-3 text-sm text-destructive">
            Couldn't load the current demo setting. Refresh before changing it.
          </p>
        )}
      </section>

      {isLoading && <LoadingIndicator />}
      {isError && <p className="text-sm text-destructive">Couldn't load businesses.</p>}
      {data && !data.length && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No businesses yet. Start with the business's details, hours and fees — then run a practice
          call.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((c) => {
          const isDefault = defaultId === c.id;
          return (
            <article
              key={c.id}
              className={`rounded-lg border bg-card transition-colors ${isDefault ? "border-primary" : "border-border"}`}
            >
              <Link
                to="/clinics/$id"
                params={{ id: c.id }}
                className="block p-4 pb-3 hover:text-primary"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Live default
                    </span>
                  )}
                </div>
                {c.id === PUBLIC_SAMPLE_BUSINESS_ID && (
                  <p className="mt-1 text-xs text-primary">
                    Public fictional sample · Mira across all channels
                  </p>
                )}
                <div className="mt-1 text-sm text-muted-foreground">
                  {c.phone}
                  {c.address ? ` · ${c.address}` : ""}
                </div>
                {(() => {
                  const updatedBy = readLastUpdatedBy(c.call_settings);
                  const updatedAt = c.updated_at || c.created_at;
                  const byClinicAdmin = updatedBy === "Clinic Admin";
                  return (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Updated{" "}
                        {new Date(updatedAt).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span
                        className={
                          byClinicAdmin
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200"
                            : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        }
                      >
                        by {updatedBy ?? "Super Admin"}
                      </span>
                    </div>
                  );
                })()}
              </Link>
              {c.id !== PUBLIC_SAMPLE_BUSINESS_ID && (
                <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                  <div>
                    <label htmlFor={`demo-${c.id}`} className="text-sm font-medium">
                      Use as default demo
                    </label>
                    <p className="text-xs text-muted-foreground">Web, WhatsApp &amp; phone</p>
                  </div>
                  <Switch
                    id={`demo-${c.id}`}
                    aria-label={`Use ${c.name} as the default demo on all public channels`}
                    checked={isDefault}
                    disabled={demoMutation.isPending || demoQuery.isLoading || demoQuery.isError}
                    onCheckedChange={(checked) => demoMutation.mutate(checked ? c.id : null)}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
