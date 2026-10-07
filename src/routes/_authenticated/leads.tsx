import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/leads")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Leads — Conversational AI Flows Studio" },
      { name: "description", content: "Visitors who asked to be contacted through the website assistant." },
      { property: "og:title", content: "Leads — Conversational AI Flows Studio" },
      { property: "og:description", content: "Visitors who asked to be contacted through the website assistant." },
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
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<"leads" | "whatsapp">("leads");
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
      <h1 className="text-2xl font-semibold">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Visitors who shared their details with Flo on the website or WhatsApp.
      </p>
      <div className="mt-4 flex gap-2" role="tablist">
        <Button size="sm" role="tab" aria-selected={tab === "leads"} variant={tab === "leads" ? "default" : "outline"} onClick={() => setTab("leads")}>Leads</Button>
        <Button size="sm" role="tab" aria-selected={tab === "whatsapp"} variant={tab === "whatsapp" ? "default" : "outline"} onClick={() => setTab("whatsapp")}>WhatsApp messages</Button>
      </div>
      {tab === "whatsapp" ? <WhatsAppMessages /> : <>
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
                  {new Date(l.created_at).toLocaleString()}
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

function Transcript({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["assistant-conversation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("assistant_conversations").select("messages").eq("id", id).single();
      if (error) throw error;
      return (data.messages ?? []) as { id: string; role: string; parts: { type: string; text?: string }[] }[];
    },
  });
  if (isLoading) return <div className="mt-3"><LoadingIndicator label="Loading chat…" /></div>;
  return (
    <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
      {data?.map((m) => {
        const text = m.parts.filter((p) => p.type === "text").map((p) => p.text).join(" ");
        if (!text) return null;
        return (
          <div key={m.id}>
            <span className="font-mono text-[11px] uppercase text-muted-foreground">{m.role === "user" ? "Visitor" : "Flo"}</span>
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        );
      })}
    </div>
  );
}

type WaMessage = {
  id: string; direction: string; phone: string; body: string; status: string;
  reply_state: string | null; reply_error: string | null; created_at: string; status_times: Record<string, string> | null;
};

const REPLY_LABEL: Record<string, string> = { pending: "Reply waiting", sending: "Replying…", sent: "Replied", failed: "Reply failed", unknown: "Reply needs review" };

function WhatsAppMessages() {
  const [phone, setPhone] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["whatsapp-messages"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_messages")
        .select("id,direction,phone,body,status,reply_state,reply_error,created_at,status_times")
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
        const last = msgs.at(-1)!;
        const open = phone === p;
        return (
          <div key={p} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <a className="font-medium text-primary hover:underline" href={`https://wa.me/${p}`} target="_blank" rel="noreferrer">+{p}</a>
                <p className="mt-1 truncate text-sm text-muted-foreground">{last.body}</p>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {msgs.length} messages · last {new Date(last.created_at).toLocaleString()}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPhone(open ? null : p)}>{open ? "Hide messages" : "View messages"}</Button>
            </div>
            {open && (
              <div className="mt-4 space-y-3 border-t border-border pt-3 text-sm">
                {msgs.map((m) => (
                  <div key={m.id} className={m.direction === "out" ? "pl-6" : "pr-6"}>
                    <div className="flex flex-wrap gap-x-2 font-mono text-[11px] uppercase text-muted-foreground">
                      <span>{m.direction === "in" ? "Visitor" : "Flo"}</span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                      <span className={m.status === "failed" || m.reply_state === "failed" ? "text-destructive" : ""}>
                        {m.direction === "out" ? m.status : m.reply_state ? REPLY_LABEL[m.reply_state] ?? m.reply_state : ""}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    {m.reply_error && m.reply_state !== "sent" && <p className="text-xs text-destructive">{m.reply_error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
