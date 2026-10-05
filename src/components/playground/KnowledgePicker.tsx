import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { KnowledgeBase } from "@/lib/library";

export function KnowledgePicker({
  kbs,
  value,
  onChange,
  disabled,
}: {
  kbs: KnowledgeBase[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const count = value.filter((id) => kbs.some((k) => k.id === id)).length;
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
                  checked={value.includes(k.id)}
                  onCheckedChange={(c) => onChange(c ? [...value, k.id] : value.filter((x) => x !== k.id))}
                />
                <span className="truncate">{k.name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
          Added on top of any knowledge attached to the scenario.{" "}
          <Link to="/library" className="text-primary underline-offset-2 hover:underline">Manage library</Link>
        </p>
      </PopoverContent>
    </Popover>
  );
}
