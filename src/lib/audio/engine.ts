// Browser audio: one shared AudioContext, a streaming PCM player per agent,
// and a microphone capture with a simple energy-based voice activity detector.

let ctx: AudioContext | null = null;

export async function getAudioContext() {
  if (!ctx) ctx = new AudioContext({ latencyHint: "interactive" });
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

const TTS_RATE = 24000;

export class PcmPlayer {
  private gain: GainNode | null = null;
  private nextTime = 0;
  private carry: Uint8Array | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private muted = false;

  async init() {
    const ac = await getAudioContext();
    if (!this.gain) {
      this.gain = ac.createGain();
      this.gain.gain.value = this.muted ? 0 : 1;
      this.gain.connect(ac.destination);
    }
    return ac;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.gain) this.gain.gain.value = m ? 0 : 1;
  }

  /** Schedules PCM bytes; returns the AudioContext time playback of this chunk starts. */
  enqueue(bytes: Uint8Array): number | null {
    if (!ctx || !this.gain) return null;
    let data = bytes;
    if (this.carry) {
      const merged = new Uint8Array(this.carry.length + bytes.length);
      merged.set(this.carry);
      merged.set(bytes, this.carry.length);
      data = merged;
      this.carry = null;
    }
    if (data.length % 2 === 1) {
      this.carry = data.slice(data.length - 1);
      data = data.slice(0, data.length - 1);
    }
    if (data.length === 0) return null;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const n = data.length / 2;
    const buf = ctx.createBuffer(1, n, TTS_RATE);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = view.getInt16(i * 2, true) / 32768;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.gain);
    const start = Math.max(this.nextTime, ctx.currentTime + 0.04);
    src.start(start);
    this.nextTime = start + buf.duration;
    this.sources.add(src);
    src.onended = () => this.sources.delete(src);
    return start;
  }

  /** Resolves when all scheduled audio has played. */
  async drain(signal?: AbortSignal) {
    while (ctx && this.nextTime > ctx.currentTime && !signal?.aborted) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  get isPlaying() {
    return !!ctx && this.nextTime > ctx.currentTime;
  }

  stop() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources.clear();
    this.carry = null;
    this.nextTime = 0;
  }
}

// ---------- Microphone + VAD ----------

const WORKLET = `
class Tap extends AudioWorkletProcessor {
  constructor(){ super(); this.buf = []; this.len = 0; this.frame = Math.round(sampleRate * 0.02); }
  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      this.buf.push(new Float32Array(ch)); this.len += ch.length;
      if (this.len >= this.frame) {
        const out = new Float32Array(this.len); let o = 0;
        for (const b of this.buf) { out.set(b, o); o += b.length; }
        this.buf = []; this.len = 0;
        this.port.postMessage(out, [out.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('tap', Tap);
`;

export type MicCallbacks = {
  onLevel?: (rms: number, speaking: boolean) => void;
  onSpeechStart?: () => void;
  onUtterance?: (wav: Blob, seconds: number, endedAt: number) => void;
};

export type VadOptions = { silenceMs: number; sensitivity: number };

export class MicCapture {
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private sampleRate = 48000;
  private frames: Float32Array[] = [];
  private preroll: Float32Array[] = [];
  private speaking = false;
  private speechFrames = 0;
  private silenceFrames = 0;
  private noiseFloor = 0.005;
  paused = false;

  constructor(private cb: MicCallbacks, public vad: VadOptions = { silenceMs: 700, sensitivity: 0.5 }) {}

  async start() {
    const ac = await getAudioContext();
    this.sampleRate = ac.sampleRate;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await ac.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    this.source = ac.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(ac, "tap");
    this.node.port.onmessage = (e) => this.onFrame(e.data as Float32Array);
    this.source.connect(this.node);
  }

  stop() {
    this.node?.port.close();
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.node = null;
    this.source = null;
    this.stream = null;
    this.reset();
  }

  private reset() {
    this.frames = [];
    this.preroll = [];
    this.speaking = false;
    this.speechFrames = 0;
    this.silenceFrames = 0;
  }

  private onFrame(frame: Float32Array) {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    if (this.paused) {
      this.cb.onLevel?.(rms, false);
      return;
    }
    // Threshold scales with background noise; sensitivity 0..1 lowers it.
    const factor = 4.5 - this.vad.sensitivity * 3;
    const threshold = Math.max(0.006 + (1 - this.vad.sensitivity) * 0.012, this.noiseFloor * factor);
    const isSpeech = rms > threshold;
    if (!this.speaking && !isSpeech) this.noiseFloor = this.noiseFloor * 0.97 + rms * 0.03;

    if (!this.speaking) {
      this.preroll.push(frame);
      if (this.preroll.length > 15) this.preroll.shift(); // ~300ms
      this.speechFrames = isSpeech ? this.speechFrames + 1 : 0;
      if (this.speechFrames >= 4) {
        this.speaking = true;
        this.silenceFrames = 0;
        this.frames = [...this.preroll];
        this.preroll = [];
        this.cb.onSpeechStart?.();
      }
    } else {
      this.frames.push(frame);
      this.silenceFrames = isSpeech ? 0 : this.silenceFrames + 1;
      const maxFrames = 30 * 50; // 30 s cap
      if (this.silenceFrames * 20 >= this.vad.silenceMs || this.frames.length > maxFrames) {
        const endedAt = performance.now();
        const voiced = this.frames.slice(0, this.frames.length - this.silenceFrames + 5);
        this.reset();
        const total = voiced.reduce((n, f) => n + f.length, 0);
        const seconds = total / this.sampleRate;
        if (seconds >= 0.35) this.cb.onUtterance?.(encodeWav(voiced, this.sampleRate, 16000), seconds, endedAt);
      }
    }
    this.cb.onLevel?.(rms, this.speaking);
  }
}

function encodeWav(chunks: Float32Array[], inRate: number, outRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let o = 0;
  for (const c of chunks) {
    merged.set(c, o);
    o += c.length;
  }
  const ratio = inRate / outRate;
  const outLen = Math.floor(total / ratio);
  const pcm = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(total, Math.floor((i + 1) * ratio));
    let s = 0;
    for (let j = start; j < end; j++) s += merged[j];
    const v = Math.max(-1, Math.min(1, s / Math.max(1, end - start)));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const dv = new DataView(buf);
  const w = (off: number, s: string) => [...s].forEach((c, i) => dv.setUint8(off + i, c.charCodeAt(0)));
  w(0, "RIFF");
  dv.setUint32(4, 36 + pcm.byteLength, true);
  w(8, "WAVE");
  w(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, outRate, true);
  dv.setUint32(28, outRate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  w(36, "data");
  dv.setUint32(40, pcm.byteLength, true);
  new Int16Array(buf, 44).set(pcm);
  return new Blob([buf], { type: "audio/wav" });
}
