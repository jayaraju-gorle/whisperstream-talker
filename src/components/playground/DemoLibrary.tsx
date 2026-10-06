import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SCENARIOS } from "@/lib/catalog";
import { activeKbIds, type CustomScenario, type KnowledgeBase } from "@/lib/library";

export function DemoLibrary({ open, onOpenChange, scenarios, kbs, onScenarios, onKbs, onRun }: {
  open: boolean; onOpenChange: (v: boolean) => void; scenarios: CustomScenario[]; kbs: KnowledgeBase[];
  onScenarios: (v: CustomScenario[]) => void; onKbs: (v: KnowledgeBase[]) => void; onRun: (id: string) => void;
}) {
  const [tab, setTab] = useState<"scenarios" | "knowledge">("scenarios");
  const [id, setId] = useState("builtin:general");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [lines, setLines] = useState("");
  const [attached, setAttached] = useState<string[]>([]);
  const reference = id.startsWith("builtin:");
  function select(value: string, kind = tab) {
    setId(value);
    if (kind === "scenarios") {
      const built = value.startsWith("builtin:") ? SCENARIOS.find((s) => `builtin:${s.id}` === value) : undefined;
      const custom = scenarios.find((s) => s.id === value);
      const s = built ?? custom;
      setName(s?.label ?? ""); setContent(s?.prompt ?? ""); setLines(s?.sample.join("\n") ?? "");
      setAttached(built ? activeKbIds(built.id, [], []) : custom?.kb_ids ?? []);
    } else {
      const kb = kbs.find((k) => k.id === value);
      setName(kb?.name ?? ""); setContent(kb?.content ?? "");
    }
  }
  function save() {
    if (!name.trim() || !content.trim()) return;
    const key = id || crypto.randomUUID();
    if (tab === "scenarios") onScenarios([...scenarios.filter((s) => s.id !== key), { id: key, label: name.trim(), prompt: content, sample: lines.split("\n").filter((l) => l.trim()), kb_ids: attached }]);
    else onKbs([...kbs.filter((k) => k.id !== key), { id: key, name: name.trim(), content }]);
    setId(key);
  }
  const built = SCENARIOS.find((s) => `builtin:${s.id}` === id);
  const shownName = reference && tab === "scenarios" ? built?.label ?? "" : name;
  const shownContent = reference && tab === "scenarios" ? built?.prompt ?? "" : content;
  const shownLines = reference && tab === "scenarios" ? built?.sample.join("\n") ?? "" : lines;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Demo library</DialogTitle></DialogHeader>
    <p className="text-xs text-muted-foreground">Changes stay in this demo until you refresh. Sign in to save your own scenarios and knowledge.</p>
    <div className="flex flex-wrap gap-2">{(["scenarios", "knowledge"] as const).map((t) => <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => { setTab(t); select(t === "scenarios" ? "builtin:general" : kbs[0]?.id ?? "", t); }}>{t === "scenarios" ? "Scenarios" : "Knowledge bases"}</Button>)}<Button variant="ghost" onClick={() => select("")}><Plus /> New</Button></div>
    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]"><div className="space-y-1">
      {(tab === "scenarios" ? [...SCENARIOS.map((s) => ({ id: `builtin:${s.id}`, name: s.label })), ...scenarios.map((s) => ({ id: s.id, name: s.label }))] : kbs).map((item) => <Button key={item.id} variant={id === item.id ? "secondary" : "ghost"} className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => select(item.id)}>{item.name}</Button>)}
    </div><div className="min-w-0 space-y-3">
      <label className="block space-y-1 text-xs">Name<Input value={shownName} onChange={(e) => setName(e.target.value)} readOnly={reference} maxLength={120} /></label>
      <label className="block space-y-1 text-xs">{tab === "scenarios" ? "Agent instructions" : "Knowledge content"}<Textarea value={shownContent} onChange={(e) => setContent(e.target.value)} readOnly={reference} rows={7} maxLength={tab === "scenarios" ? 6000 : 60000} /></label>
      {tab === "scenarios" && <><label className="block space-y-1 text-xs">Caller lines — one per line<Textarea value={shownLines} onChange={(e) => setLines(e.target.value)} readOnly={reference} rows={5} /></label>
        <div className="space-y-2">{kbs.map((kb) => <label key={kb.id} className="flex items-center gap-2 text-xs"><Checkbox disabled={reference} checked={reference && built ? activeKbIds(built.id, [], []).includes(kb.id) : attached.includes(kb.id)} onCheckedChange={(v) => setAttached(v ? [...attached, kb.id] : attached.filter((x) => x !== kb.id))} />{kb.name}</label>)}</div></>}
      <div className="flex flex-wrap gap-2">{!reference && <><Button disabled={!name.trim() || !content.trim()} onClick={save}>Save in demo</Button>{id && <Button variant="destructive" onClick={() => { if (tab === "scenarios") onScenarios(scenarios.filter((s) => s.id !== id)); else onKbs(kbs.filter((k) => k.id !== id)); select(""); }}><Trash2 /> Delete</Button>}</>}
        {tab === "scenarios" && id && <Button variant="outline" onClick={() => { onRun(reference ? id.replace("builtin:", "") : `custom:${id}`); onOpenChange(false); }}>Use in playground</Button>}
      </div>
    </div></div>
  </DialogContent></Dialog>;
}