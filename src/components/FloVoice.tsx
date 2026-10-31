import { useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLiveVoice } from "@/hooks/use-live-voice";
import { FLO_VOICE_PATH, voiceMessages, type VoiceFragment } from "@/lib/flo-voice";
import type { UIMessage } from "ai";

export function FloVoice({ visitorId, disabled, onActive, onMessages, onCaptions }: {
  visitorId: string; disabled?: boolean; onActive: (active: boolean) => void; onMessages: (messages: UIMessage[]) => void;
  onCaptions: (messages: UIMessage[]) => void;
}) {
  const fragments = useRef<VoiceFragment[]>([]);
  const generation = useRef(0);
  const call = useLiveVoice({
    url: FLO_VOICE_PATH,
    startPayload: async () => ({ visitorId }),
    onEvent: async (event) => {
      if (event.type === "session.input_transcript.delta" || event.type === "session.output_transcript.delta") {
        if (typeof event["delta"] !== "string") return;
        const fragment: VoiceFragment = { role: event.type === "session.input_transcript.delta" ? "user" : "assistant",
          text: event["delta"], start_ms: Number(event["start_ms"]) || 0, end_ms: Number(event["end_ms"]) || 0 };
        fragments.current.push(fragment);
        onCaptions(voiceMessages(fragments.current, `voice-${generation.current}`));
      }
      if (event.type === "app.closed") {
        const endedGeneration = generation.current;
        try {
          const response = await fetch(`/api/public/assistant?visitorId=${visitorId}`);
          if (!response.ok || endedGeneration !== generation.current) return;
          const data = await response.json();
          if (Array.isArray(data.messages) && event.finalized === true) {
            onMessages(data.messages);
            onCaptions([]);
          }
        } finally {
          if (endedGeneration === generation.current) onActive(false);
        }
      }
    },
  });
  const active = call.status === "connecting" || call.status === "connected" || call.status === "stopping";
  return <div className="border-b border-border px-3 py-2">
    <audio ref={call.audioRef} autoPlay className="hidden" />
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant={active ? "destructive" : "outline"} disabled={call.status === "stopping" || (!active && disabled)}
        onClick={() => { if (active) call.stop(); else { generation.current += 1; fragments.current = []; onCaptions([]); onActive(true); call.start(); } }}>
        {active ? <PhoneOff /> : <Phone />}{call.status === "connecting" ? "Cancel call" : call.status === "stopping" ? "Ending…" : active ? "End call" : "Talk to Mira"}
      </Button>
      {call.status === "connected" && <Button size="icon" variant="ghost" aria-label={call.muted ? "Unmute microphone" : "Mute microphone"}
        title={call.muted ? "Unmute microphone" : "Mute microphone"} onClick={() => call.setMuted(!call.muted)}>{call.muted ? <MicOff /> : <Mic />}</Button>}
      <span role="status" className="text-xs text-muted-foreground">{call.status === "connecting" ? "Connecting…" : call.status === "connected" ? call.muted ? "Microphone muted" : "Listening" : ""}</span>
      {call.playbackBlocked && <Button size="icon" variant="outline" aria-label="Play voice replies" onClick={call.resumePlayback}><Play /></Button>}
    </div>
    {call.error && <p role="alert" className="mt-2 text-xs text-destructive">{call.error}</p>}
  </div>;
}