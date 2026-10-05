import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrency } from "@/hooks/use-currency";
import type { TurnMetrics } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export const ms = (v?: number) => (v == null ? "—" : `${Math.round(v)} ms`);

function Cell({ k, v, hint, strong }: { k: string; v: string; hint: string; strong?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${k}: ${v}. What does this mean?`}
          className="group bg-background px-2.5 py-2 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {k}
            <Info className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" aria-hidden />
          </div>
          <div className={cn("mt-0.5 font-mono text-sm tabular-nums", strong ? "text-primary" : "text-foreground")}>{v}</div>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 p-3 text-xs leading-relaxed">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
        {hint}
      </PopoverContent>
    </Popover>
  );
}

export function MetricsStrip({ m, voice }: { m?: TurnMetrics | undefined; voice: boolean }) {
  const { fmt: formatUsd } = useCurrency();
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-6">
      <Cell k="STT" v={voice ? ms(m?.sttMs) : "—"} hint="Speech-to-text time: how long it took to turn your spoken words into text. Empty in text mode." />
      <Cell k="LLM TTFB" v={ms(m?.llmTtfbMs)} hint="Time until the AI model started writing its reply (time to first token)." />
      <Cell k="TTS TTFB" v={ms(m?.ttsTtfbMs)} hint="Time until the voice model produced the first bit of audio. Empty when replies aren't spoken." />
      <Cell
        k={voice ? "Voice→voice" : "Reply start"}
        v={ms(m?.v2vMs)}
        strong
        hint={voice ? "Total wait from when you stopped talking until you heard the agent start speaking." : "Total wait from sending your message until the reply started appearing (or playing)."}
      />
      <Cell
        k="Tokens in/out"
        v={m?.outputTokens != null ? `${m.inputTokens ?? 0}/${m.outputTokens}` : "—"}
        hint="Input tokens (scenario instructions + conversation so far) / output tokens (the agent's reply). Input grows each turn as history builds up."
      />
      <Cell k="Cost" v={m ? formatUsd(m.cost.total) : "—"} hint="Estimated cost of this turn (speech-to-text + AI model + voice), based on list prices." />
    </div>
  );
}

export function TurnMetricLine({ m }: { m: TurnMetrics }) {
  const { fmt: formatUsd } = useCurrency();
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
      {m.sttMs != null && <span>stt {ms(m.sttMs)}</span>}
      {m.llmTtfbMs != null && <span>llm {ms(m.llmTtfbMs)}</span>}
      {m.ttsTtfbMs != null && <span>tts {ms(m.ttsTtfbMs)}</span>}
      {m.v2vMs != null && <span className="text-primary">v2v {ms(m.v2vMs)}</span>}
      <span>
        {formatUsd(m.cost.total)} (stt {formatUsd(m.cost.stt)} · llm {formatUsd(m.cost.llm)} · tts {formatUsd(m.cost.tts)})
      </span>
    </div>
  );
}
