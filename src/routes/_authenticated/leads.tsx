import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FLO_MODELS, FLO_MODEL_SETTING_KEY, floTurnCostUsd, resolveFloModel } from "@/lib/flo-models";
import { useCurrency } from "@/hooks/use-currency";
import { useTimezone } from "@/hooks/use-timezone";
import { TIMEZONES } from "@/lib/timezone";
import { ASSISTANT_VOICE_MODEL, ASSISTANT_VOICE_NAME } from "@/lib/assistant-voice-config";
import { CurrencySelect } from "@/components/CurrencySelect";
import { matchWhatsAppMetrics } from "@/lib/whatsapp-metrics";

export const Route = createFileRoute("/_authenticated/leads")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Assistant — Conversational Flows Studio" },
      { name: "description", content: "Manage Mira's leads, web, WhatsApp and phone conversations, voice and model settings." },
      { property: "og:title", content: "Assistant — Conversational Flows Studio" },
      { property: "og:description", content: "Manage Mira's leads, web, WhatsApp and phone conversations, voice and model settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Leads,
});

type Lead = {
  id: string;
  conversation_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  interest: string | null;
  status: string;
  created_at: string;
};

function Leads() {
  const { format, zone, setZone, saving: timezoneSaving } = useTimezone();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<"leads" | "web" | "whatsapp" | "phone" | "model">("leads");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leads", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    setUpdating(null);
    if (error) {
      toast.error("Couldn't update the lead.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["leads"] });
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Assistant</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Mira's conversations, leads and model settings.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1"><span className="text-xs text-muted-foreground">Timestamps in</span>
          <Select value={zone} onValueChange={v => void setZone(v)} disabled={timezoneSaving}>
            <SelectTrigger aria-label="Timestamp timezone" className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{TIMEZONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div><CurrencySelect />
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Assistant views">
        <Button size="sm" role="tab" aria-selected={tab === "leads"} variant={tab === "leads" ? "default" : "outline"} onClick={() => setTab("leads")}>Leads</Button>
        <Button size="sm" role="tab" aria-selected={tab === "web"} variant={tab === "web" ? "default" : "outline"} onClick={() => setTab("web")}>Web conversations</Button>
        <Button size="sm" role="tab" aria-selected={tab === "whatsapp"} variant={tab === "whatsapp" ? "default" : "outline"} onClick={() => setTab("whatsapp")}>WhatsApp</Button>
        <Button size="sm" role="tab" aria-selected={tab === "phone"} variant={tab === "phone" ? "default" : "outline"} onClick={() => setTab("phone")}>Phone conversations</Button>
        <Button size="sm" role="tab" aria-selected={tab === "model"} variant={tab === "model" ? "default" : "outline"} onClick={() => setTab("model")}>Mira model</Button>
      </div>
      {tab === "phone" ? <WebConversations leads={data ?? []} phone /> : tab === "model" ? <FloModelSettings /> : tab === "whatsapp" ? <WhatsAppMessages /> : tab === "web" ? <WebConversations leads={data ?? []} /> : <>
      {isLoading && <div className="mt-8"><LoadingIndicator label="Loading leads…" /></div>}
      {isError && <p className="mt-8 text-sm text-destructive">You don't have access to leads, or they couldn't load.</p>}
      {data && data.length === 0 && <p className="mt-8 text-sm text-muted-foreground">No leads yet.</p>}
      <div className="mt-6 space-y-3">
        {data?.map((l) => (
          <div key={l.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">
                  {l.name} {l.company && <span className="text-muted-foreground">· {l.company}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                  <a className="text-primary hover:underline" href={`mailto:${l.email}`}>{l.email}</a>
                  {l.phone && <a className="text-primary hover:underline" href={`tel:${l.phone}`}>{l.phone}</a>}
                </div>
                {l.interest && <p className="mt-2 text-sm text-muted-foreground">{l.interest}</p>}
                <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {format(l.created_at)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {["new", "contacted", "closed"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={l.status === s ? "default" : "outline"}
                    disabled={updating === l.id}
                    onClick={() => setStatus(l.id, s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
                {l.conversation_id && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === l.id ? null : l.id)}>
                    {openId === l.id ? "Hide chat" : "View chat"}
                  </Button>
                )}
              </div>
            </div>
            {openId === l.id && l.conversation_id && <Transcript id={l.conversation_id} />}
          </div>
        ))}
      </div>
      </>}
    </main>
  );
}

function WebConversations({ leads, phone = false }: { leads: Lead[]; phone?: boolean }) {
  const { format } = useTimezone();
  const title = phone ? "Phone conversations" : "Web conversations";
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["assistant-conversations", phone ? "phone" : "web", page],
    refetchInterval: 15_000,
    queryFn: async () => {
      let query = supabase.from("assistant_conversations")
        .select("id,created_at,updated_at", { count: "exact" })
        .not("visitor_id", "like", "whatsapp\\_%")
        .not("visitor_id", "like", "wa\\_c\\_%")
        ;
      query = phone ? query.like("visitor_id", "bolna\\_%") : query.not("visitor_id", "like", "bolna\\_%");
      const { data, count, error } = await query.order("updated_at", { ascending: false }).order("id", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return { conversations: data, total: count ?? 0 };
    },
  });
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">{title}{data ? ` · ${data.total}` : ""}</h2>
        <Button size="sm" variant="outline" loading={isFetching} loadingLabel="Refreshing…" onClick={() => void refetch()}>Refresh</Button>
      </div>
      {isLoading && <div className="mt-4"><LoadingIndicator label={`Loading ${title.toLowerCase()}…`} /></div>}
      {isError && <p className="mt-4 text-sm text-destructive">{title} couldn't load. Please try refreshing.</p>}
      {data?.total === 0 && <p className="mt-4 text-sm text-muted-foreground">No {title.toLowerCase()} yet.</p>}
      <div className="mt-4 space-y-3">
        {data?.conversations.map((conversation) => {
          const lead = leads.find((l) => l.conversation_id === conversation.id);
          const open = openId === conversation.id;
          return (
            <div key={conversation.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 break-words">
                  <h3 className="font-medium">{lead?.name ?? `${phone ? "Phone call" : "Website visitor"} · ${conversation.id.slice(0, 8)}`}</h3>
                  {lead && <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                    <a className="text-primary hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>
                    {lead.phone && <a className="text-primary hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a>}
                    {lead.company && <span className="text-muted-foreground">{lead.company}</span>}
                  </div>}
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground">
                    <p>Started {format(conversation.created_at)}</p>
                    <p>Last activity {format(conversation.updated_at)}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" aria-expanded={open} onClick={() => setOpenId(open ? null : conversation.id)}>{open ? "Hide chat" : "View chat"}</Button>
              </div>
              {open && <Transcript id={conversation.id} phone={phone} />}
            </div>
          );
        })}
      </div>
      {data && data.total > pageSize && <div className="mt-4 flex items-center justify-between gap-3">
        <Button size="sm" variant="outline" disabled={page === 0 || isFetching} onClick={() => { setPage((p) => p - 1); setOpenId(null); }}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {page + 1} of {Math.ceil(data.total / pageSize)}</span>
        <Button size="sm" variant="outline" disabled={(page + 1) * pageSize >= data.total || isFetching} onClick={() => { setPage((p) => p + 1); setOpenId(null); }}>Next</Button>
      </div>}
    </div>
  );
}

function Transcript({ id, phone = false }: { id: string; phone?: boolean }) {
  const { format } = useTimezone();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["assistant-conversation", id, phone],
    refetchInterval: 15_000,
    queryFn: async () => {
      const [{ data, error }, { data: logs }] = await Promise.all([
        supabase.from("assistant_conversations").select("messages").eq("id", id).single(),
        supabase.from("assistant_turn_logs").select("model,first_token_ms,total_ms,ok,created_at").eq("conversation_id", id).eq("channel", phone ? "Bolna" : "Website").order("created_at"),
      ]);
      if (error) throw error;
      return {
        messages: (data.messages ?? []) as { id: string; role: string; parts: { type: string; text?: string }[] }[],
        logs: logs ?? [],
      };
    },
  });
  if (isLoading) return <div className="mt-3"><LoadingIndicator label="Loading chat…" /></div>;
  if (isError) return <p className="mt-3 text-sm text-destructive">This conversation couldn't load.</p>;
  // Timing is logged per Mira reply; older replies from before logging started have none.
  const replies = data?.messages.filter((m) => m.role !== "user").length ?? 0;
  const offset = replies - (data?.logs.length ?? 0);
  let replyIndex = -1;
  const secs = (ms: number | null) => (ms == null ? "–" : `${(ms / 1000).toFixed(1)} s`);
  return (
    <div className="mt-4 space-y-2 break-words border-t border-border pt-3 text-sm">
      {data?.messages.length === 0 && <p className="text-muted-foreground">No messages saved yet.</p>}
      {data?.messages.map((m) => {
        const isFlo = m.role !== "user";
        if (isFlo) replyIndex++;
        const log = isFlo ? data.logs[replyIndex - offset] : undefined;
        const text = m.parts.filter((p) => p.type === "text").map((p) => p.text).join(" ");
        if (!text) return null;
        return (
          <div key={m.id}>
            <span className="font-mono text-[11px] uppercase text-muted-foreground">{isFlo ? "Mira" : "Visitor"}</span>
            <p className="whitespace-pre-wrap">{text}</p>
            {log && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {format(log.created_at)} · {log.model.split("/").pop()} · first words {secs(log.first_token_ms)} · full reply {secs(log.total_ms)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

type WaMessage = {
  id: string; direction: string; phone: string; body: string; status: string;
  reply_state: string | null; reply_error: string | null; created_at: string; status_times: Record<string, string> | null;
  conversation_id: string | null;
};

const REPLY_LABEL: Record<string, string> = { pending: "Reply waiting", sending: "Replying…", sent: "Replied", failed: "Reply failed", unknown: "Reply needs review", expired: "Not answered (too old)" };

function WaThread({ msgs }: { msgs: WaMessage[] }) {
  const { format } = useTimezone();
  const conversationIds = [...new Set(msgs.flatMap((m) => m.conversation_id ? [m.conversation_id] : []))].sort();
  const { data: logs, isError: metricsError } = useQuery({
    queryKey: ["whatsapp-turn-logs", conversationIds],
    enabled: conversationIds.length > 0,
    refetchInterval: 15_000,
    queryFn: async () => {
      if (!conversationIds.length) return [];
      const { data, error } = await supabase.from("assistant_turn_logs")
        .select("id,conversation_id,channel,model,first_token_ms,total_ms,ok,created_at")
        .in("conversation_id", conversationIds).eq("channel", "WhatsApp").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const secs = (ms: number | null) => (ms == null ? "–" : `${(ms / 1000).toFixed(1)} s`);
  const metrics = matchWhatsAppMetrics(msgs, logs ?? []);
  return (
    <div className="mt-4 space-y-3 border-t border-border pt-3 text-sm">
      {metricsError && <p className="text-destructive">Reply timings couldn't load. Please try again.</p>}
      {msgs.map((m) => {
        const isFlo = m.direction === "out";
        const log = metrics.get(m.id);
        return (
          <div key={m.id} className={isFlo ? "pl-6" : "pr-6"}>
            <div className="flex flex-wrap gap-x-2 font-mono text-[11px] uppercase text-muted-foreground">
              <span>{isFlo ? "Mira" : "Visitor"}</span>
              <span>{format(m.created_at)}</span>
              <span className={m.status === "failed" || m.reply_state === "failed" ? "text-destructive" : ""}>
                {isFlo ? m.status : m.reply_state ? REPLY_LABEL[m.reply_state] ?? m.reply_state : ""}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{m.body}</p>
            {log && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {format(log.created_at)} · {log.model.split("/").pop()} · first words {secs(log.first_token_ms)} · full reply {secs(log.total_ms)}
              </p>
            )}
            {m.reply_error && m.reply_state !== "sent" && <p className="text-xs text-destructive">{m.reply_error}</p>}
          </div>
        );
      })}
    </div>
  );
}

function WhatsAppMessages() {
  const { format } = useTimezone();
  const [phone, setPhone] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["whatsapp-messages"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_messages")
        .select("id,direction,phone,body,status,reply_state,reply_error,created_at,status_times,conversation_id")
        .order("created_at", { ascending: true }).limit(2000);
      if (error) throw error;
      return data as WaMessage[];
    },
  });
  if (isLoading) return <div className="mt-8"><LoadingIndicator label="Loading WhatsApp messages…" /></div>;
  if (isError) return <p className="mt-8 text-sm text-destructive">WhatsApp messages couldn't load.</p>;
  const threads = new Map<string, WaMessage[]>();
  for (const m of data ?? []) threads.set(m.phone, [...(threads.get(m.phone) ?? []), m]);
  const list = [...threads.entries()].sort((a, b) => (b[1].at(-1)?.created_at ?? "").localeCompare(a[1].at(-1)?.created_at ?? ""));
  if (list.length === 0) return <p className="mt-8 text-sm text-muted-foreground">No WhatsApp messages yet.</p>;
  return (
    <div className="mt-6 space-y-3">
      {list.map(([p, msgs]) => {
        const last = msgs.at(-1);
        if (!last) return null;
        const open = phone === p;
        return (
          <div key={p} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <a className="font-medium text-primary hover:underline" href={`https://wa.me/${p}`} target="_blank" rel="noreferrer">+{p}</a>
                <p className="mt-1 truncate text-sm text-muted-foreground">{last.body}</p>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {msgs.length} messages · last {format(last.created_at)}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPhone(open ? null : p)}>{open ? "Hide messages" : "View messages"}</Button>
            </div>
            {open && <WaThread msgs={msgs} />}
          </div>
        );
      })}
    </div>
  );
}

type TurnLog = { id: string; channel: string; model: string; first_token_ms: number | null; total_ms: number; input_tokens: number | null; output_tokens: number | null; ok: boolean; error: string | null; created_at: string };

const modelLabel = (id: string) => FLO_MODELS.find((m) => m.id === id)?.label ?? id;
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

function FloModelSettings() {
  const { format } = useTimezone();
  const qc = useQueryClient();
  const { fmt } = useCurrency();
  const [saving, setSaving] = useState(false);
  const setting = useQuery({
    queryKey: ["app-settings", FLO_MODEL_SETTING_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", FLO_MODEL_SETTING_KEY).maybeSingle();
      if (error) throw error;
      return resolveFloModel(data?.value).id;
    },
  });
  const logs = useQuery({
    queryKey: ["assistant-turn-logs"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("assistant_turn_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as TurnLog[];
    },
  });
  const save = async (model: string) => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: FLO_MODEL_SETTING_KEY, value: { model }, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error("Couldn't save the model."); return; }
    toast.success(`Mira now uses ${modelLabel(model)}.`);
    qc.invalidateQueries({ queryKey: ["app-settings"] });
  };
  const vendors = [...new Set(FLO_MODELS.map((m) => m.vendor))];
  const byModel = new Map<string, TurnLog[]>();
  for (const l of logs.data ?? []) byModel.set(l.model, [...(byModel.get(l.model) ?? []), l]);

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-medium">AI model for Mira</h2>
        <p className="mt-1 text-sm text-muted-foreground">Used for website chat, WhatsApp, phone replies through Bolna, and delegated answers during website voice calls. Changes apply to the next reply.</p>
        {setting.isLoading ? <div className="mt-3"><LoadingIndicator label="Loading…" /></div> : setting.isError ? (
          <p className="mt-3 text-sm text-destructive">Couldn't load the current setting.</p>
        ) : (
          <div className="mt-3 max-w-xs">
            <Select value={setting.data ?? ""} onValueChange={save} disabled={saving}>
              <SelectTrigger aria-label="Mira model"><SelectValue /></SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectGroup key={v}>
                    <SelectLabel className="text-[10px] uppercase tracking-wider">{v}</SelectLabel>
                    {FLO_MODELS.filter((m) => m.vendor === v).map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      <section className="border-t border-border pt-4">
        <h2 className="font-medium">Website voice</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Live speech model</dt><dd>OpenAI GPT Live 1 <span className="font-mono text-xs">({ASSISTANT_VOICE_MODEL})</span></dd></div>
          <div><dt className="text-muted-foreground">Voice</dt><dd className="capitalize">{ASSISTANT_VOICE_NAME}</dd></div>
          <div><dt className="text-muted-foreground">Speech recognition & spoken replies</dt><dd>Handled together by the live speech model; no separate STT or TTS model.</dd></div>
          <div><dt className="text-muted-foreground">Knowledge & contact capture</dt><dd>{setting.data ? modelLabel(setting.data) : "Current Mira model"} handles delegated questions and tools.</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Phone speech is configured separately in Bolna; its speech models are not reported by the chat connection. Reply costs below cover the assistant LLM, not voice or phone charges.</p>
      </section>
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-medium">Performance by model</h2>
        <p className="mt-1 text-sm text-muted-foreground">Median times from the last 500 replies. "First words" is how long until Mira starts writing. Costs are estimates from list prices.</p>
        {logs.isLoading && <div className="mt-3"><LoadingIndicator label="Loading…" /></div>}
        {logs.data && logs.data.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No replies recorded yet.</p>}
        {byModel.size > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[11px] uppercase text-muted-foreground">
                <tr><th className="py-1 pr-4">Model</th><th className="pr-4">Replies</th><th className="pr-4">First words</th><th className="pr-4">Full reply</th><th className="pr-4">Avg tokens in/out</th><th className="pr-4">Total cost</th><th className="pr-4">Avg cost / reply</th><th className="pr-4">Per 1,000 replies</th><th>Failed</th></tr>
              </thead>
              <tbody>
                {[...byModel.entries()].map(([m, ls]) => {
                  const ok = ls.filter((l) => l.ok);
                  const ft = median(ok.flatMap((l) => (l.first_token_ms == null ? [] : [l.first_token_ms])));
                  const tt = median(ok.map((l) => l.total_ms));
                  const out = ok.filter((l) => l.output_tokens != null);
                  const costs = ls.flatMap((l) => { const c = floTurnCostUsd(l.model, l.input_tokens, l.output_tokens); return c == null ? [] : [c]; });
                  const total = costs.reduce((a, c) => a + c, 0);
                  const avg = costs.length ? total / costs.length : null;
                  const avgIn = out.length ? Math.round(out.reduce((a, l) => a + (l.input_tokens ?? 0), 0) / out.length) : null;
                  return (
                    <tr key={m} className="border-t border-border">
                      <td className="py-2 pr-4">{modelLabel(m)}</td><td className="pr-4">{ls.length}</td>
                      <td className="pr-4">{ft == null ? "—" : `${ft} ms`}</td><td className="pr-4">{tt == null ? "—" : `${tt} ms`}</td>
                      <td className="pr-4">{out.length ? `${avgIn}/${Math.round(out.reduce((a, l) => a + (l.output_tokens ?? 0), 0) / out.length)}` : "—"}</td>
                      <td className="pr-4">{costs.length ? fmt(total) : "—"}</td>
                      <td className="pr-4">{avg == null ? "—" : fmt(avg)}</td>
                      <td className="pr-4">{avg == null ? "—" : fmt(avg * 1000)}</td>
                      <td>{ls.length - ok.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {logs.data && logs.data.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium">Recent replies</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground"><tr>{["Date & time", "Channel", "LLM model", "First response", "Total response", "Estimated cost", "Status"].map(label => <th key={label} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">{label}</th>)}</tr></thead>
              <tbody>{logs.data.slice(0, 50).map(l => {
                const cost = floTurnCostUsd(l.model, l.input_tokens, l.output_tokens);
                return <tr key={l.id} className={`border-t border-border ${l.ok ? "" : "text-destructive"}`}>
                  <td className="whitespace-nowrap px-3 py-2">{format(l.created_at)}</td><td className="px-3">{l.channel === "Bolna" ? "Phone" : l.channel}</td><td className="whitespace-nowrap px-3">{modelLabel(l.model)}</td>
                  <td className="whitespace-nowrap px-3">{l.first_token_ms == null ? "—" : `${l.first_token_ms} ms`}</td><td className="whitespace-nowrap px-3">{l.total_ms} ms</td><td className="whitespace-nowrap px-3">{cost == null ? "—" : fmt(cost)}</td><td className="px-3">{l.ok ? "Success" : l.error ?? "Failed"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
