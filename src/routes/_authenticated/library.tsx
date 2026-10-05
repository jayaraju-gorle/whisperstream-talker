import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, FileUp, Play, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLibrary } from "@/hooks/use-library";
import type { CustomScenario, KnowledgeBase } from "@/lib/library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/library")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Scenarios & knowledge — Conversational AI Flows Studio" },
      { name: "description", content: "Create custom scenarios with caller lines and manage knowledge bases for your agents." },
      { property: "og:title", content: "Scenarios & knowledge — Conversational AI Flows Studio" },
      { property: "og:description", content: "Create custom scenarios with caller lines and manage knowledge bases for your agents." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LibraryPage,
});

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{children}</span>
);

function LibraryPage() {
  const { user } = Route.useRouteContext();
  const lib = useLibrary();
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <h1 className="text-xl font-semibold tracking-tight">Scenarios & knowledge</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Write your own scenarios with caller lines for the simulator, and keep reference knowledge your agents can answer from.
      </p>
      <Tabs defaultValue="scenarios" className="mt-5">
        <TabsList>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge bases</TabsTrigger>
        </TabsList>
        <TabsContent value="scenarios">
          <ScenarioEditor userId={user.id} items={lib.scenarios} kbs={lib.kbs} refresh={lib.refresh} />
        </TabsContent>
        <TabsContent value="knowledge">
          <KbEditor userId={user.id} items={lib.kbs} refresh={lib.refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ListPane<T extends { id: string }>({
  items, selected, onSelect, onNew, name, empty,
}: { items: T[]; selected: string | null; onSelect: (id: string) => void; onNew: () => void; name: (t: T) => string; empty: string }) {
  return (
    <div className="space-y-1">
      <Button size="sm" variant="secondary" className="mb-2 w-full" onClick={onNew}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> New
      </Button>
      {items.length === 0 && <p className="px-1 text-xs text-muted-foreground">{empty}</p>}
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn("block w-full truncate rounded px-2.5 py-1.5 text-left text-sm", selected === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")}
        >
          {name(t)}
        </button>
      ))}
    </div>
  );
}

function ScenarioEditor({ userId, items, kbs, refresh }: { userId: string; items: CustomScenario[]; kbs: KnowledgeBase[]; refresh: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lines, setLines] = useState("");
  const [kbIds, setKbIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = items.find((x) => x.id === sel);
    setLabel(s?.label ?? "");
    setPrompt(s?.prompt ?? "");
    setLines(s?.sample.join("\n") ?? "");
    setKbIds(s?.kb_ids ?? []);
  }, [sel, items]);

  async function save() {
    if (!label.trim()) return void toast.error("Give the scenario a name.");
    setSaving(true);
    const row = {
      user_id: userId,
      label: label.trim().slice(0, 120),
      prompt: prompt.slice(0, 6000),
      sample: lines.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 50),
      kb_ids: kbIds,
      updated_at: new Date().toISOString(),
    };
    const res = sel
      ? await supabase.from("custom_scenarios").update(row).eq("id", sel).select("id").single()
      : await supabase.from("custom_scenarios").insert(row).select("id").single();
    setSaving(false);
    if (res.error) return void toast.error("Couldn't save the scenario");
    setSel(res.data.id);
    refresh();
    toast.success("Scenario saved");
  }

  async function remove() {
    if (!sel || !confirm("Delete this scenario?")) return;
    const { error } = await supabase.from("custom_scenarios").delete().eq("id", sel);
    if (error) return void toast.error("Couldn't delete");
    setSel(null);
    refresh();
  }

  return (
    <div className="mt-3 grid gap-5 md:grid-cols-[220px_1fr]">
      <ListPane items={items} selected={sel} onSelect={setSel} onNew={() => setSel(null)} name={(s) => s.label} empty="No custom scenarios yet." />
      <div className="space-y-4 rounded-md border border-border p-4">
        <label className="block space-y-1">
          <Label>Name</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Dental clinic reception" maxLength={120} />
        </label>
        <label className="block space-y-1">
          <Label>Agent instructions</Label>
          <Textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={6000}
            placeholder="You are the receptionist at Smile Dental. Help callers book, move or cancel appointments…" />
          <span className="text-[11px] text-muted-foreground">Short spoken-reply rules are added automatically.</span>
        </label>
        <label className="block space-y-1">
          <Label>Caller lines (one per line)</Label>
          <Textarea rows={6} value={lines} onChange={(e) => setLines(e.target.value)} className="font-mono text-xs"
            placeholder={"Hi, I'd like to book a cleaning.\nMy name is Priya.\nAny morning next week works."} />
          <span className="text-[11px] text-muted-foreground">The simulator plays these one at a time, waiting for each reply.</span>
        </label>
        <div className="space-y-1.5">
          <Label>Attached knowledge</Label>
          {kbs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No knowledge bases yet — add one in the Knowledge bases tab.</p>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {kbs.map((k) => (
                <label key={k.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={kbIds.includes(k.id)} onCheckedChange={(c) => setKbIds(c ? [...kbIds, k.id] : kbIds.filter((x) => x !== k.id))} />
                  {k.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button size="sm" onClick={save} disabled={saving}><Save className="mr-1.5 h-3.5 w-3.5" /> {sel ? "Save changes" : "Create scenario"}</Button>
          {sel && <Button size="sm" variant="ghost" onClick={remove}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>}
          <Button size="sm" variant="outline" asChild className="ml-auto">
            <Link to="/playground"><Play className="mr-1.5 h-3.5 w-3.5" /> Run in playground</Link>
          </Button>
        </div>
        {sel && <p className="text-[11px] text-muted-foreground">In the playground, pick this under Scenario → "My scenarios", then press Simulate scenario.</p>}
      </div>
    </div>
  );
}

function KbEditor({ userId, items, refresh }: { userId: string; items: KnowledgeBase[]; refresh: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const k = items.find((x) => x.id === sel);
    setName(k?.name ?? "");
    setContent(k?.content ?? "");
  }, [sel, items]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 200_000) return void toast.error("File is too large (max 200 KB of text).");
    const text = await f.text();
    setContent(text.slice(0, 60000));
    if (!name) setName(f.name.replace(/\.[^.]+$/, "").slice(0, 120));
  }

  async function save() {
    if (!name.trim()) return void toast.error("Give the knowledge base a name.");
    setSaving(true);
    const row = { user_id: userId, name: name.trim().slice(0, 120), content: content.slice(0, 60000), updated_at: new Date().toISOString() };
    const res = sel
      ? await supabase.from("knowledge_bases").update(row).eq("id", sel).select("id").single()
      : await supabase.from("knowledge_bases").insert(row).select("id").single();
    setSaving(false);
    if (res.error) return void toast.error("Couldn't save");
    setSel(res.data.id);
    refresh();
    toast.success("Knowledge saved");
  }

  async function remove() {
    if (!sel || !confirm("Delete this knowledge base?")) return;
    const { error } = await supabase.from("knowledge_bases").delete().eq("id", sel);
    if (error) return void toast.error("Couldn't delete");
    setSel(null);
    refresh();
  }

  return (
    <div className="mt-3 grid gap-5 md:grid-cols-[220px_1fr]">
      <ListPane items={items} selected={sel} onSelect={setSel} onNew={() => setSel(null)} name={(k) => k.name} empty="No knowledge bases yet." />
      <div className="space-y-4 rounded-md border border-border p-4">
        <label className="block space-y-1">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Clinic FAQ & prices" maxLength={120} />
        </label>
        <label className="block space-y-1">
          <div className="flex items-center justify-between">
            <Label>Content</Label>
            <span className="font-mono text-[10px] text-muted-foreground">{content.length.toLocaleString()} / 60,000</span>
          </div>
          <Textarea rows={14} value={content} onChange={(e) => setContent(e.target.value)} maxLength={60000} className="font-mono text-xs"
            placeholder="Paste FAQs, prices, opening hours, policies…" />
        </label>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button size="sm" onClick={save} disabled={saving}><Save className="mr-1.5 h-3.5 w-3.5" /> {sel ? "Save changes" : "Create"}</Button>
          <Button size="sm" variant="outline" asChild>
            <label className="cursor-pointer">
              <FileUp className="mr-1.5 h-3.5 w-3.5" /> Load text file
              <input type="file" accept=".txt,.md,.csv,.json,text/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </Button>
          {sel && <Button size="sm" variant="ghost" onClick={remove}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>}
        </div>
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <BookOpen className="mt-0.5 h-3 w-3 shrink-0" />
          Attach it to a scenario, or pick it from "Knowledge" in the playground for any conversation. Longer knowledge means more input tokens per turn.
        </p>
      </div>
    </div>
  );
}
