import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { findLlm, findStt, findTts } from "@/lib/catalog";
import { TurnMetricLine } from "@/components/playground/MetricsStrip";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/LoadingIndicator";

export const Route = createFileRoute("/_authenticated/history/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Session — Conversational Flow Studio" },
      { name: "description", content: "Transcript and per-turn metrics for a saved session." },
      { property: "og:title", content: "Session — Conversational Flow Studio" },
      { property: "og:description", content: "Transcript and per-turn metrics for a saved session." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { data, isError } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const [c, t] = await Promise.all([
        supabase.from("conversations").select("*").eq("id", id).single(),
        supabase.from("turns").select("*").eq("conversation_id", id).order("created_at"),
      ]);
      if (c.error) throw c.error;
      return { conv: c.data, turns: t.data ?? [] };
    },
  });

  const sessionTitle = data?.conv.title;
  useEffect(() => {
    if (sessionTitle) document.title = `${sessionTitle} — Session — Conversational Flow Studio`;
  }, [sessionTitle]);

  if (isError) return <main className="p-8 text-destructive">Couldn't load this session. <Link to="/history" className="underline">Back to history</Link></main>;
  if (!data) return <main className="p-8"><LoadingIndicator label="Loading session…" /></main>;
  const agents = data.conv.compare ? ["A", "B"] : ["A"];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <Link to="/history" aria-label="Back to history" className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="min-w-0 break-words text-xl font-semibold">{data.conv.title}</h1>
        <Button
          variant="ghost"
          size="sm"
          loading={deleting} loadingLabel="Deleting…"
          className="ml-auto text-muted-foreground"
          onClick={async () => {
            setDeleting(true);
            try {
              const { error } = await supabase.from("conversations").delete().eq("id", id);
              if (error) throw error;
              await navigate({ to: "/history" });
            } catch {
              toast.error("Couldn't delete this session. Please try again.");
            } finally {
              setDeleting(false);
            }
          }}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
        </Button>
      </div>
      <div className={`mt-6 grid gap-6 ${agents.length > 1 ? "md:grid-cols-2" : ""}`}>
        {agents.map((a) => {
          const list = data.turns.filter((t) => t.agent === a);
          const cfg = (list[0]?.metrics as any)?.config;
          return (
            <section key={a} className="min-w-0 break-words rounded-lg border border-border bg-card/50 p-4">
              <div className={`font-mono text-sm font-bold ${a === "A" ? "text-agent-a" : "text-agent-b"}`}>AGENT {a}</div>
              {cfg && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {findStt(cfg.sttId)?.label} → {findLlm(cfg.llmId)?.label} → {findTts(cfg.ttsId)?.label}
                </p>
              )}
              <div className="mt-4 space-y-4">
                {list.map((t) => (
                  <div key={t.id} className="space-y-2">
                    <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-secondary px-3 py-2 text-sm">{t.user_text}</div>
                    <p className="text-sm">{t.assistant_text}</p>
                    <TurnMetricLine m={t.metrics as any} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
