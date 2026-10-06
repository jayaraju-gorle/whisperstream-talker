import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { KnowledgeBase } from "@/lib/library";
import { activeKbIds, type CustomScenario } from "@/lib/library";

export function KnowledgePicker({
  kbs,
  value,
  onChange,
  disabled,
  scenarioId,
  scenarios = [],
  onManage,
}: {
  kbs: KnowledgeBase[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  scenarioId?: string;
  scenarios?: CustomScenario[];
  onManage?: () => void;
}) {
  const attached = scenarioId ? activeKbIds(scenarioId, scenarios, []) : [];
  const count = [...new Set([...attached, ...value])].filter((id) => kbs.some((k) => k.id === id)).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} title="Knowledge used in this session">
          <BookOpen className="mr-1.5 h-3.5 w-3.5" />
          Knowledge{count ? ` · ${count}` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Knowledge for this session</div>
        {kbs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No knowledge bases yet.</p>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {kbs.map((k) => (
              <label key={k.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={attached.includes(k.id) || value.includes(k.id)}
                  disabled={attached.includes(k.id)}
                  onCheckedChange={(c) => onChange(c ? [...value, k.id] : value.filter((x) => x !== k.id))}
                />
                <span className="truncate">{k.name}</span>
                {attached.includes(k.id) && <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">Attached</span>}
              </label>
            ))}
          </div>
        )}
        <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
          Added on top of any knowledge attached to the scenario.{" "}
          {onManage ? <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onManage}>Manage library</Button> : <Link to="/library" className="text-primary underline-offset-2 hover:underline">Manage library</Link>}
        </p>
      </PopoverContent>
    </Popover>
  );
}
