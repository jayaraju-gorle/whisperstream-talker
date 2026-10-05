// Browser-orchestrated cascade: STT -> streamed LLM -> sentence chunks -> streamed TTS.
import { supabase } from "@/integrations/supabase/client";
import { computeCost, SCENARIOS, type AgentConfig, type CostBreakdown } from "./catalog";
import { getAudioContext, PcmPlayer } from "./audio/engine";
import { SentenceChunker } from "./sentence-chunker";

export type TurnMetrics = {
  sttMs?: number | undefined;
  llmTtfbMs?: number | undefined;
  llmTotalMs?: number | undefined;
  ttsTtfbMs?: number | undefined;
  v2vMs?: number | undefined; // end of user speech (or send) -> first agent audio
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  ttsChars?: number | undefined;
  audioSeconds?: number | undefined;
  cost: CostBreakdown;
};

export type Message = { role: "user" | "assistant"; content: string };

export type TurnCallbacks = {
  onUserText?: (text: string) => void;
  onDelta?: (fullText: string) => void;
  onMetrics?: (m: TurnMetrics) => void;
  onStatus?: (s: "transcribing" | "thinking" | "speaking" | "idle") => void;
};

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function readError(res: Response, fallback: string) {
  try {
    const j = await res.json();
    return j?.error ?? fallback;
  } catch {
    return fallback;
  }
}

export class AgentRunner {
  history: Message[] = [];
  player = new PcmPlayer();
  private ctrl: AbortController | null = null;
  /** Builds the system prompt (scenario + knowledge). Defaults to the built-in scenario prompt. */
  systemFor: (cfg: AgentConfig, history: Message[]) => string = (cfg) =>
    SCENARIOS.find((s) => s.id === cfg.scenario)?.prompt ?? SCENARIOS[0]!.prompt;

  constructor(public config: AgentConfig) {}

  get busy() {
    return !!this.ctrl || this.player.isPlaying;
  }

  interrupt() {
    this.ctrl?.abort();
    this.ctrl = null;
    this.player.stop();
  }

  reset() {
    this.interrupt();
    this.history = [];
  }

  async run(
    input: { audio?: Blob; audioSeconds?: number | undefined; text?: string; startedAt: number; speak: boolean },
    cb: TurnCallbacks,
  ): Promise<{ userText: string; reply: string; metrics: TurnMetrics } | null> {
    this.interrupt();
    const ctrl = new AbortController();
    this.ctrl = ctrl;
    const signal = ctrl.signal;
    const cfg = this.config;
    const t0 = input.startedAt;
    const m: TurnMetrics = { cost: { stt: 0, llm: 0, tts: 0, total: 0 }, audioSeconds: input.audioSeconds };
    const emit = () => {
      m.cost = computeCost(cfg, m);
      cb.onMetrics?.({ ...m });
    };
    const headers = await authHeader();
    if (input.speak) await this.player.init();

    try {
      // ---- STT ----
      let userText = input.text ?? "";
      if (input.audio) {
        cb.onStatus?.("transcribing");
        const fd = new FormData();
        fd.append("file", input.audio, "speech.wav");
        fd.append("sttId", cfg.sttId);
        fd.append("language", cfg.language);
        const s0 = performance.now();
        const res = await fetch("/api/stt", { method: "POST", body: fd, headers, signal });
        if (!res.ok) throw new Error(await readError(res, "Transcription failed"));
        userText = ((await res.json()) as { text: string }).text;
        m.sttMs = performance.now() - s0;
        emit();
      }
      if (!userText.trim()) {
        cb.onStatus?.("idle");
        return null;
      }
      cb.onUserText?.(userText);
      this.history.push({ role: "user", content: userText });

      // ---- LLM (streamed) ----
      cb.onStatus?.("thinking");
      const system = this.systemFor(cfg, this.history);
      const l0 = performance.now();
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ llmId: cfg.llmId, system, messages: this.history.slice(-30) }),
        signal,
      });
      if (!res.ok || !res.body) throw new Error(await readError(res, "Model request failed"));

      const chunker = new SentenceChunker();
      const ttsJobs: Promise<Response>[] = [];
      let ttsStart = 0;
      const startTts = (sentence: string) => {
        if (!input.speak) return;
        if (!ttsStart) ttsStart = performance.now();
        m.ttsChars = (m.ttsChars ?? 0) + sentence.length;
        ttsJobs.push(
          fetch("/api/tts", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ ttsId: cfg.ttsId, voice: cfg.voice, text: sentence, language: cfg.language }),
            signal,
          }),
        );
      };

      // Play TTS responses strictly in order while the LLM keeps streaming.
      let playIndex = 0;
      let llmDone = false;
      let firstAudio = false;
      const ac = input.speak ? await getAudioContext() : null;
      const playback = (async () => {
        if (!input.speak) return;
        for (;;) {
          if (playIndex >= ttsJobs.length) {
            if (llmDone && playIndex >= ttsJobs.length) break;
            await new Promise((r) => setTimeout(r, 15));
            if (signal.aborted) return;
            continue;
          }
          const r = (await ttsJobs[playIndex++])!;
          if (!r.ok || !r.body) throw new Error(await readError(r, "Speech failed"));
          const reader = r.body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done || signal.aborted) break;
            const startAt = this.player.enqueue(value);
            if (!firstAudio && startAt != null && ac) {
              firstAudio = true;
              const now = performance.now();
              const lead = Math.max(0, (startAt - ac.currentTime) * 1000);
              m.ttsTtfbMs = now - ttsStart;
              m.v2vMs = now + lead - t0;
              cb.onStatus?.("speaking");
              emit();
            }
          }
        }
      })();

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let reply = "";
      let streamError: string | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as { t: string; v?: string; in?: number | undefined; out?: number | undefined; error?: string };
          if (ev.t === "d" && ev.v) {
            if (m.llmTtfbMs == null) {
              m.llmTtfbMs = performance.now() - l0;
              emit();
            }
            reply += ev.v;
            cb.onDelta?.(reply);
            chunker.push(ev.v).forEach(startTts);
          } else if (ev.t === "u") {
            m.inputTokens = ev.in;
            m.outputTokens = ev.out;
          } else if (ev.t === "e") {
            streamError = ev.error ?? "Model error";
          }
        }
      }
      chunker.flush().forEach(startTts);
      llmDone = true;
      m.llmTotalMs = performance.now() - l0;
      if (!input.speak && m.llmTtfbMs != null) m.v2vMs = l0 - t0 + m.llmTtfbMs;
      emit();
      if (streamError && !reply) throw new Error(streamError);
      if (reply) this.history.push({ role: "assistant", content: reply });

      await playback;
      if (input.speak) await this.player.drain(signal);
      cb.onStatus?.("idle");
      if (this.ctrl === ctrl) this.ctrl = null;
      return { userText, reply, metrics: { ...m, cost: computeCost(cfg, m) } };
    } catch (e) {
      if (this.ctrl === ctrl) this.ctrl = null;
      cb.onStatus?.("idle");
      if (signal.aborted) return null;
      throw e;
    }
  }
}
