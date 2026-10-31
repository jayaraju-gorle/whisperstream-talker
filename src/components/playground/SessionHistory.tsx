import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/use-currency";
import { useTimezone } from "@/hooks/use-timezone";
import { TIMEZONES } from "@/lib/timezone";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SessionHistory() {
  const { fmt: formatUsd } = useCurrency();
  const { format, zone, setZone, saving } = useTimezone();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["playground-sessions"],
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

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8" aria-labelledby="session-history-title">
      <h1 id="session-history-title" className="text-2xl font-semibold">Session History</h1>
      <div className="mt-4 space-y-1">
        <span className="text-xs text-muted-foreground">Timestamps in</span>
        <Select value={zone} onValueChange={v => void setZone(v)} disabled={saving}>
          <SelectTrigger aria-label="Session history timezone" className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{TIMEZONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-card font-mono text-[11px] uppercase text-muted-foreground">
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
            {isLoading && <tr><td colSpan={6} className="px-3 py-6 text-center"><LoadingIndicator label="Loading sessions…" /></td></tr>}
            {isError && <tr><td colSpan={6} className="px-3 py-6 text-center text-destructive">Couldn't load sessions. Please try again.</td></tr>}
            {data?.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No sessions yet.</td></tr>}
            {data?.map(c => {
              const metrics = (c.turns as { metrics: any }[]).map(t => t.metrics);
              const latencies = metrics.map(m => m?.v2vMs).filter((v): v is number => typeof v === "number");
              const average = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
              const cost = metrics.reduce((sum, m) => sum + (m?.cost?.total ?? 0), 0);
              return <tr key={c.id} className="border-t border-border hover:bg-card/60">
                <td className="px-3 py-2"><Link to="/history/$id" params={{ id: c.id }} className="hover:text-primary">{c.title}</Link></td>
                <td className="px-3 py-2 text-muted-foreground">{c.mode}{c.compare ? " · compare" : ""}</td>
                <td className="px-3 py-2 text-right font-mono">{metrics.length}</td>
                <td className="px-3 py-2 text-right font-mono">{average != null ? `${average} ms` : "—"}</td>
                <td className="px-3 py-2 text-right font-mono">{formatUsd(cost)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{format(c.created_at)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}