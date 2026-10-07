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
    if (error) return toast.error("Couldn't update the lead.");
    qc.invalidateQueries({ queryKey: ["leads"] });
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Visitors who shared their details with Flo, the website assistant.
      </p>
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
                    {s[0].toUpperCase() + s.slice(1)}
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
