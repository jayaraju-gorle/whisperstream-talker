import { createFileRoute, Link, Outlet, useMatch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatUsd } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Cascade Lab" },
      { name: "description", content: "Past voice agent sessions with latency and cost per turn." },
      { property: "og:title", content: "History — Cascade Lab" },
      { property: "og:description", content: "Past voice agent sessions with latency and cost per turn." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const child = useMatch({ from: "/_authenticated/history/$id", shouldThrow: false });
  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,title,mode,compare,created_at,turns(metrics)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
  if (child) return <Outlet />;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Session history</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every saved turn, with its latency and estimated cost.</p>
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Session</th>
              <th className="px-3 py-2 text-left">Mode</th>
              <th className="px-3 py-2 text-right">Turns</th>
              <th className="px-3 py-2 text-right">Avg latency</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2 text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {data?.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No sessions yet.</td></tr>
            )}
            {data?.map((c) => {
              const ms = (c.turns as { metrics: any }[]).map((t) => t.metrics);
              const lat = ms.map((m) => m?.v2vMs).filter((v): v is number => typeof v === "number");
              const avg = lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null;
              const cost = ms.reduce((s, m) => s + (m?.cost?.total ?? 0), 0);
              return (
                <tr key={c.id} className="border-t border-border hover:bg-card/60">
                  <td className="px-3 py-2">
                    <Link to="/history/$id" params={{ id: c.id }} className="hover:text-primary">{c.title}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.mode}{c.compare ? " · compare" : ""}</td>
                  <td className="px-3 py-2 text-right font-mono">{ms.length}</td>
                  <td className="px-3 py-2 text-right font-mono">{avg != null ? `${avg} ms` : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatUsd(cost)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
