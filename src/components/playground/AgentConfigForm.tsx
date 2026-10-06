import {
  LANGUAGES,
  LLM_MODELS,
  PROVIDERS,
  SCENARIOS,
  STT_MODELS,
  TTS_MODELS,
  findTts,
  type AgentConfig,
  type ProviderId,
} from "@/lib/catalog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  config: AgentConfig;
  onChange: (c: AgentConfig) => void;
  available: Partial<Record<ProviderId, boolean>>;
  customScenarios?: { id: string; label: string }[];
};

function grouped<T extends { provider: ProviderId; id: string; label: string }>(items: T[]) {
  const groups = new Map<ProviderId, T[]>();
  for (const i of items) groups.set(i.provider, [...(groups.get(i.provider) ?? []), i]);
  return [...groups.entries()];
}

function ModelSelect<T extends { provider: ProviderId; id: string; label: string }>({
  label,
  value,
  items,
  available,
  onValue,
}: {
  label: string;
  value: string;
  items: T[];
  available: Props["available"];
  onValue: (v: string) => void;
}) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValue}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {grouped(items).map(([prov, list]) => {
            const ok = available[prov] !== false;
            return (
              <SelectGroup key={prov}>
                <SelectLabel className="text-[10px] uppercase tracking-wider">
                  {PROVIDERS[prov].label}
                  {!ok && " · needs key"}
                </SelectLabel>
                {list.map((m) => (
                  <SelectItem key={m.id} value={m.id} disabled={!ok} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </label>
  );
}

export function AgentConfigForm({ config, onChange, available, customScenarios = [] }: Props) {
  const tts = findTts(config.ttsId);
  return (
    <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5">
      <ModelSelect label="Speech to text" value={config.sttId} items={STT_MODELS} available={available}
        onValue={(v) => onChange({ ...config, sttId: v })} />
      <ModelSelect label="AI model" value={config.llmId} items={LLM_MODELS} available={available}
        onValue={(v) => onChange({ ...config, llmId: v })} />
      <ModelSelect label="Voice model" value={config.ttsId} items={TTS_MODELS} available={available}
        onValue={(v) => {
          const t = findTts(v);
          onChange({ ...config, ttsId: v, voice: t?.voices[0]?.id ?? "" });
        }} />
      <label className="block min-w-0 space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Voice</span>
        <Select value={config.voice} onValueChange={(v) => onChange({ ...config, voice: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {tts?.voices.map((v) => (
              <SelectItem key={v.id} value={v.id} className="text-xs capitalize">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="block min-w-0 space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Scenario</span>
        <Select value={config.scenario} onValueChange={(v) => onChange({ ...config, scenario: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase tracking-wider">Built-in</SelectLabel>
              {SCENARIOS.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectGroup>
            {customScenarios.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-wider">My scenarios</SelectLabel>
                {customScenarios.map((s) => (
                  <SelectItem key={s.id} value={`custom:${s.id}`} className="text-xs">{s.label}</SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </label>
      <label className="block min-w-0 space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Language</span>
        <Select value={config.language} onValueChange={(v) => onChange({ ...config, language: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.id} value={l.id} className="text-xs">{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
