import { formatUsd } from "@/lib/catalog";
import type { TurnMetrics } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export const ms = (v?: number) => (v == null ? "—" : `${Math.round(v)} ms`);

function Cell({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="bg-background px-2.5 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className={cn("mt-0.5 font-mono text-sm tabular-nums", strong ? "text-primary" : "text-foreground")}>{v}</div>
    </div>
  );
}

export function MetricsStrip({ m, voice }: { m?: TurnMetrics; voice: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-6">
      <Cell k="STT" v={voice ? ms(m?.sttMs) : "—"} />
      <Cell k="LLM TTFB" v={ms(m?.llmTtfbMs)} />
      <Cell k="TTS TTFB" v={ms(m?.ttsTtfbMs)} />
      <Cell k={voice ? "Voice→voice" : "Reply start"} v={ms(m?.v2vMs)} strong />
      <Cell k="Tokens" v={m?.outputTokens != null ? `${m.inputTokens ?? 0}/${m.outputTokens}` : "—"} />
      <Cell k="Cost" v={m ? formatUsd(m.cost.total) : "—"} />
    </div>
  );
}

export function TurnMetricLine({ m }: { m: TurnMetrics }) {
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
