import { useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { findLlm, findStt, findTts, type AgentConfig, type ConnectionId } from "@/lib/catalog";
import type { TurnMetrics } from "@/lib/pipeline";
import { AgentConfigForm } from "./AgentConfigForm";
import { MetricsStrip, TurnMetricLine, ms } from "./MetricsStrip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingIndicator } from "@/components/LoadingIndicator";

export type PlaygroundTurn = { id: string; user: string; assistant: string; metrics?: TurnMetrics; pending: boolean };
export type PlaygroundStatus = "transcribing" | "thinking" | "speaking" | "idle";

export function AgentPanel(props: {
  label: string;
  config: AgentConfig;
  onConfig: (c: AgentConfig) => void;
  available: Partial<Record<ConnectionId, boolean>>;
  customScenarios: { id: string; label: string }[];
  turns: PlaygroundTurn[];
  status: PlaygroundStatus;
  voice: boolean;
  /** This flow transcribes spoken input (voice mode only). */
  stt: boolean;
  /** This flow speaks replies (voice mode, or text mode with "Speak replies"). */
  tts: boolean;
  muted: boolean;
  onMute: () => void;
  wide: boolean;
  sample?: boolean;
}) {
  const { label, config, turns, status, voice } = props;
  const { fmt: formatUsd } = useCurrency();
  const last = [...turns].reverse().find((t) => t.metrics)?.metrics;
  const done = turns.filter((t) => t.metrics && !t.pending);
  const total = done.reduce((s, t) => s + (t.metrics?.cost.total ?? 0), 0);
  const v2vs = done.map((t) => t.metrics?.v2vMs).filter((v): v is number => v != null);
  const avg = v2vs.length ? v2vs.reduce((a, b) => a + b, 0) / v2vs.length : undefined;
  const color = label === "A" ? "text-agent-a" : "text-agent-b";
  const chain = [
    props.stt ? findStt(config.sttId)?.label : null,
    findLlm(config.llmId)?.label,
    props.tts ? findTts(config.ttsId)?.label : null,
  ].filter(Boolean).join(" → ");
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  return (
    <section className="flex min-h-[60vh] min-w-0 flex-col bg-background">
      <div className={cn("grid gap-4 border-b border-border p-4", props.wide && "lg:grid-cols-[minmax(0,420px)_1fr]")}>
        <div className="min-w-0">
          <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <span className={cn("shrink-0 whitespace-nowrap font-mono text-sm font-bold", color)}>AGENT {label}</span>
            <span className="truncate text-xs text-muted-foreground">{chain}</span>
            {props.tts && (
              <Button variant="ghost" size="icon" onClick={props.onMute} className="h-9 w-9 shrink-0 text-muted-foreground" aria-label={props.muted ? "Unmute agent" : "Mute agent"}>
                {props.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <AgentConfigForm config={config} onChange={props.onConfig} available={props.available} customScenarios={props.customScenarios} sample={props.sample ?? false} showStt={props.stt} showTts={props.tts} />
        </div>
        <div className="min-w-0 space-y-2 self-end">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", status === "idle" ? "bg-muted-foreground/40" : status === "speaking" ? "animate-pulse bg-success" : "animate-pulse bg-primary")} />
              {status === "idle" ? "idle" : status}
            </span>
            <span className="text-right">
              {done.length} turns · avg {voice ? "v2v" : "reply"} {ms(avg)} · total {formatUsd(total)}
            </span>
          </div>
          <MetricsStrip m={last} voice={voice} />
          <p className="font-mono text-[10px] text-muted-foreground/70">{props.sample ? "Illustrative timing and cost estimates · no credits used." : "Costs are estimates based on list prices."}</p>
        </div>
      </div>
      <div ref={scroller} className="min-w-0 flex-1 space-y-4 overflow-y-auto break-words p-4" style={{ maxHeight: "55vh" }}>
        {turns.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            {voice ? "Turn on the mic below and say hello." : "Send a message to start."}
          </p>
        )}
        {turns.map((t) => (
          <div key={t.id} className="space-y-2">
            <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-secondary px-3 py-2 text-sm">{t.user}</div>
            {(t.assistant || t.pending) && (
              <div className="max-w-[90%]">
                <p className="text-sm leading-relaxed">
                  {t.assistant || <LoadingIndicator label={status === "transcribing" ? "Recognizing speech…" : "Preparing reply…"} />}
                </p>
                {t.metrics && <TurnMetricLine m={t.metrics} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
