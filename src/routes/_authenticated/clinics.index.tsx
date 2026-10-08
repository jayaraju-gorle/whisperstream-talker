import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/LoadingIndicator";

export const Route = createFileRoute("/_authenticated/clinics/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Clinics — Conversational AI Flows Studio" },
      { name: "description", content: "Set up AI front-desk receptionists for client clinics and track their test calls." },
      { property: "og:title", content: "Clinics — Conversational AI Flows Studio" },
      { property: "og:description", content: "Set up AI front-desk receptionists for client clinics and track their test calls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clinics,
});

function Clinics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("id,name,phone,address,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clinics</h1>
          <p className="text-sm text-muted-foreground">AI front-desk receptionists you've set up for client clinics.</p>
        </div>
        <Button asChild><Link to="/clinics/new"><Plus className="h-4 w-4" /> New clinic</Link></Button>
      </div>
      {isLoading && <LoadingIndicator />}
      {isError && <p className="text-sm text-destructive">Couldn't load clinics.</p>}
      {data && !data.length && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No clinics yet. Start with the clinic's details, hours and fees — then run a test patient call.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((c) => (
          <Link key={c.id} to="/clinics/$id" params={{ id: c.id }} className="rounded-lg border border-border bg-card p-4 hover:border-primary">
            <div className="font-medium">{c.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.phone}{c.address ? ` · ${c.address}` : ""}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
