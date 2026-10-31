import { MapPin } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { ClinicTestCall } from "@/components/clinic/ClinicTestCall";
import { CLINIC_VISITOR_PREFIX, clinicVisitorKey, hoursLine, toClinicInput } from "@/lib/clinic";
import { CLINIC_COLUMNS, type ClinicRow } from "@/lib/clinic-store";
import { floTurnCostUsd } from "@/lib/flo-models";
import { useCurrency } from "@/hooks/use-currency";

export const Route = createFileRoute("/_authenticated/clinics/$id/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Business dashboard — Conversational Flows Studio" },
      { name: "description", content: "Business setup, call history, appointment requests, cost and response speed." },
      { property: "og:title", content: "Business dashboard — Conversational Flows Studio" },
      { property: "og:description", content: "Business setup, call history, appointment requests, cost and response speed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type Call = { key: string; channel: "Browser" | "WhatsApp"; at: string; title: string; turns: number; cost: number | null; speedMs: number[]; historyId?: string };

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function Dashboard() {
  const { id } = Route.useParams();
  const { fmt } = useCurrency();
  const clinic = useQuery({
    queryKey: ["clinics", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select(CLINIC_COLUMNS).eq("id", id).single();
      if (error) throw error;
      return data as unknown as ClinicRow;
    },
  });
  const calls = useQuery({
    queryKey: ["clinics", id, "calls"],
    refetchInterval: 20000,
    queryFn: async (): Promise<Call[]> => {
      const [browser, wa] = await Promise.all([
        supabase.from("conversations").select("id,title,created_at,turns(metrics)").eq("clinic_id", id).order("created_at", { ascending: false }).limit(100),
        supabase.from("assistant_conversations").select("id,updated_at,messages").like("visitor_id", `${CLINIC_VISITOR_PREFIX}${clinicVisitorKey(id)}_%`).order("updated_at", { ascending: false }).limit(100),
      ]);
      if (browser.error) throw browser.error;
      if (wa.error) throw wa.error;
      const waIds = (wa.data ?? []).map((c) => c.id);
      const logs = waIds.length
        ? await supabase.from("assistant_turn_logs").select("conversation_id,model,first_token_ms,input_tokens,output_tokens,ok").in("conversation_id", waIds)
        : { data: [], error: null };
      if (logs.error) throw logs.error;
      const out: Call[] = (browser.data ?? []).map((c) => {
        const ms = (c.turns ?? []).map((t) => t.metrics as { cost?: { total?: number }; v2vMs?: number; llmTtfbMs?: number });
        return {
          key: c.id, channel: "Browser", at: c.created_at, title: c.title, turns: ms.length, historyId: c.id,
          cost: ms.reduce((s, m) => s + (m.cost?.total ?? 0), 0),
          speedMs: ms.map((m) => m.v2vMs ?? m.llmTtfbMs).filter((x): x is number => typeof x === "number"),
        };
      });
      for (const c of wa.data ?? []) {
        const mine = (logs.data ?? []).filter((l) => l.conversation_id === c.id && l.ok);
        const costs = mine.map((l) => floTurnCostUsd(l.model, l.input_tokens, l.output_tokens));
        const msgs = Array.isArray(c.messages) ? (c.messages as { role?: string; parts?: { text?: string }[] }[]) : [];
        out.push({
          key: c.id, channel: "WhatsApp", at: c.updated_at, turns: mine.length,
          title: msgs.find((m) => m.role === "user")?.parts?.[0]?.text?.slice(0, 80) ?? "WhatsApp test",
          cost: costs.some((x) => x == null) ? null : costs.reduce<number>((s, x) => s + (x ?? 0), 0),
          speedMs: mine.map((l) => l.first_token_ms).filter((x): x is number => typeof x === "number"),
        });
      }
      return out.sort((a, b) => b.at.localeCompare(a.at));
    },
  });

  if (clinic.isLoading) return <main className="p-6"><LoadingIndicator /></main>;
  if (clinic.isError || !clinic.data) return <main className="p-6 text-sm text-destructive">Couldn't load this clinic.</main>;
  const c = toClinicInput(clinic.data);
  const list = calls.data ?? [];
  const turns = list.reduce((s, x) => s + x.turns, 0);
  const known = list.filter((x) => x.cost != null);
  const totalCost = known.reduce((s, x) => s + (x.cost ?? 0), 0);
  const knownTurns = known.reduce((s, x) => s + x.turns, 0);
  const speeds = list.flatMap((x) => x.speedMs);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/clinics" className="text-xs text-muted-foreground hover:text-foreground">← Businesses</Link>
          <h1 className="text-2xl font-semibold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">{c.phone}{c.address ? ` · ${c.address}` : ""}</p>
          {c.map_url && <a href={c.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"><MapPin className="h-4 w-4" /> View on Google Maps</a>}
        </div>
        <div className="flex flex-wrap gap-2">
          {clinic.data.portal_token && <Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/portal/${clinic.data.portal_token}`); toast.success("Assistant portal link copied — share it only with the business's team or owner."); }}>Copy assistant link</Button>}
          <Button asChild variant="secondary"><Link to="/clinics/$id/edit" params={{ id }}><Pencil className="h-4 w-4" /> Edit setup</Link></Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Test calls" value={String(list.length)} />
        <Stat label="Replies" value={String(turns)} />
        <Stat label="Total cost" value={known.length ? fmt(totalCost) : "—"} />
        <Stat label="Avg cost per reply" value={knownTurns ? fmt(totalCost / knownTurns) : "—"} />
        <Stat label="Avg response time" value={speeds.length ? `${(avg(speeds)! / 1000).toFixed(1)} s` : "—"} hint="Browser: end of speech to first spoken word. WhatsApp: time to first words." />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Test the receptionist</h2>
        <ClinicTestCall clinicId={id} code={clinic.data.test_code} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">Clinic setup</h2>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Opening hours</h3>
            <ul className="mt-1 space-y-0.5 text-sm">{c.hours.map((h) => <li key={h.day} className={h.open ? "" : "text-muted-foreground"}>{hoursLine(h)}</li>)}</ul>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Doctors & fees</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {c.doctors.map((d, i) => (
                <li key={i} className="flex justify-between gap-3"><span className="min-w-0">{d.name}{d.specialty ? <span className="text-muted-foreground"> · {d.specialty}</span> : null}{d.days ? <span className="block text-xs text-muted-foreground">{d.days}</span> : null}</span><span className="shrink-0 font-mono">{d.fee}</span></li>
              ))}
            </ul>
          </div>
          {c.emergency_phone && <p className="text-sm"><span className="text-muted-foreground">Emergency:</span> {c.emergency_phone}</p>}
          {c.insurance && <p className="text-sm"><span className="text-muted-foreground">Insurance:</span> {c.insurance}</p>}
        </section>

        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">Call history</h2>
          {calls.isLoading && <LoadingIndicator />}
          {calls.isError && <p className="text-sm text-destructive">Couldn't load calls.</p>}
          {calls.data && !list.length && <p className="text-sm text-muted-foreground">No test calls yet.</p>}
          <ul className="divide-y divide-border">
            {list.map((x) => (
              <li key={x.key} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="min-w-0">
                  <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase">{x.channel}</span>
                  {x.historyId ? <Link to="/history/$id" params={{ id: x.historyId }} className="hover:underline">{x.title}</Link> : x.title}
                  <div className="text-xs text-muted-foreground">{new Date(x.at).toLocaleString()} · {x.turns} replies</div>
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  {x.cost != null ? fmt(x.cost) : "—"}
                  {x.speedMs.length ? ` · ${(avg(x.speedMs)! / 1000).toFixed(1)} s` : ""}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Appointments clinicId={id} />
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3" title={hint}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg">{value}</div>
    </div>
  );
}

const STATUSES = ["new", "confirmed", "cancelled"] as const;

function Appointments({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const key = ["clinics", clinicId, "appointments"];
  const [form, setForm] = useState({ patient_name: "", phone: "", doctor: "", preferred_time: "", reason: "" });
  const [adding, setAdding] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_appointment_requests").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  async function add() {
    if (!form.patient_name.trim()) return void toast.error("Add the patient's name.");
    setAdding(true);
    const { error } = await supabase.from("clinic_appointment_requests").insert({ ...form, clinic_id: clinicId, channel: "Browser" });
    setAdding(false);
    if (error) return void toast.error("Couldn't save the request.");
    setForm({ patient_name: "", phone: "", doctor: "", preferred_time: "", reason: "" });
    void qc.invalidateQueries({ queryKey: key });
  }
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("clinic_appointment_requests").update({ status }).eq("id", id);
    if (error) return void toast.error("Couldn't update the request.");
    void qc.invalidateQueries({ queryKey: key });
  }
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="font-semibold">Appointment requests</h2>
        <p className="text-xs text-muted-foreground">WhatsApp requests are saved automatically. Log requests from browser test calls here.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        {(["patient_name", "phone", "doctor", "preferred_time", "reason"] as const).map((k) => (
          <Input key={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={{ patient_name: "Patient name", phone: "Phone", doctor: "Doctor", preferred_time: "Preferred time", reason: "Reason" }[k]} />
        ))}
        <Button onClick={add} loading={adding} loadingLabel="Adding…">Add</Button>
      </div>
      {isLoading && <LoadingIndicator />}
      {isError && <p className="text-sm text-destructive">Couldn't load requests.</p>}
      {data && !data.length && <p className="text-sm text-muted-foreground">No requests yet.</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <tbody className="divide-y divide-border">
            {data?.map((r) => (
              <tr key={r.id}>
                <td className="py-2 pr-3">{r.patient_name}<div className="text-xs text-muted-foreground">{r.phone}</div></td>
                <td className="pr-3">{r.doctor}<div className="text-xs text-muted-foreground">{r.preferred_time}</div></td>
                <td className="pr-3 text-muted-foreground">{r.reason}</td>
                <td className="pr-3 text-xs text-muted-foreground">{r.channel} · {new Date(r.created_at).toLocaleString()}</td>
                <td>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} aria-label="Request status"
                    className="rounded border border-border bg-background px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
