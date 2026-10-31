import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, MessageCircle, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { getPortal, setPortalStatus } from "@/lib/portal.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/$token")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Assistant portal — Conversational Flow Studio" },
      { name: "description", content: "Review and confirm incoming appointment requests for your business." },
      { property: "og:title", content: "Assistant portal — Conversational Flow Studio" },
      { property: "og:description", content: "Review and confirm incoming appointment requests for your business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Portal,
});

type Filter = "new" | "confirmed" | "cancelled" | "all";

function Portal() {
  const { token } = Route.useParams();
  const load = useServerFn(getPortal);
  const update = useServerFn(setPortalStatus);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("new");
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["portal", token], queryFn: () => load({ data: { token } }), refetchInterval: 20000, retry: false });

  async function act(id: string, status: "confirmed" | "cancelled" | "new") {
    setBusy(id + status);
    try {
      await update({ data: { token, id, status } });
      await qc.invalidateQueries({ queryKey: ["portal", token] });
      toast.success(status === "confirmed" ? "Appointment confirmed" : status === "cancelled" ? "Request cancelled" : "Moved back to new");
    } catch { toast.error("Couldn't update. Please try again."); } finally { setBusy(null); }
  }

  if (q.isLoading) return <main className="p-6"><LoadingIndicator /></main>;
  if (q.isError || !q.data) return <main className="mx-auto max-w-md p-6 text-center text-sm text-destructive">This portal link is invalid or has been replaced. Ask your business admin for the current link.</main>;

  const all = q.data.requests;
  const list = filter === "all" ? all : all.filter((r) => r.status === filter);
  const count = (f: Filter) => (f === "all" ? all.length : all.filter((r) => r.status === f).length);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 p-4 pb-16">
      <header>
        <p className="text-xs text-muted-foreground">Assistant portal</p>
        <h1 className="text-xl font-semibold">{q.data.clinic.name}</h1>
      </header>
      <div className="grid grid-cols-4 gap-1 rounded-lg border border-border p-1 text-xs">
        {(["new", "confirmed", "cancelled", "all"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={cn("min-h-11 rounded-md capitalize", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {f} ({count(f)})
          </button>
        ))}
      </div>
      {!list.length && <p className="py-10 text-center text-sm text-muted-foreground">No {filter === "all" ? "" : filter} requests.</p>}
      <ul className="space-y-3">
        {list.map((r) => {
          const digits = r.phone.replace(/[^\d]/g, "");
          return (
            <li key={r.id} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{r.patient_name}</p>
                  <p className="text-sm text-muted-foreground">{[r.doctor, r.preferred_time].filter(Boolean).join(" · ") || "No preference given"}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs capitalize",
                  r.status === "confirmed" ? "bg-primary/15 text-primary" : r.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-muted text-foreground")}>{r.status}</span>
              </div>
              {r.reason && <p className="text-sm">{r.reason}</p>}
              <p className="text-xs text-muted-foreground">{r.channel} · {new Date(r.created_at).toLocaleString()}{r.phone ? ` · ${r.phone}` : ""}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {r.phone && <Button asChild variant="secondary"><a href={`tel:${r.phone.replace(/\s/g, "")}`}><Phone className="h-4 w-4" /> Call</a></Button>}
                {digits && <Button asChild variant="secondary"><a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></Button>}
                {r.status !== "confirmed" && <Button onClick={() => act(r.id, "confirmed")} loading={busy === r.id + "confirmed"} loadingLabel="Confirming…"><Check className="h-4 w-4" /> Confirm</Button>}
                {r.status === "new" && <Button variant="ghost" onClick={() => act(r.id, "cancelled")} loading={busy === r.id + "cancelled"} loadingLabel="Cancelling…"><X className="h-4 w-4" /> Cancel</Button>}
                {r.status !== "new" && <Button variant="ghost" onClick={() => act(r.id, "new")} loading={busy === r.id + "new"} loadingLabel="Undoing…">Undo</Button>}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
