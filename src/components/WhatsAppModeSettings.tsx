import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { parseWhatsAppMode, WHATSAPP_MODE_SETTING_KEY, type WhatsAppMode } from "@/lib/whatsapp-mode";
import { DEMO_BUSINESS_SETTING_KEY, parseDemoBusinessId } from "@/lib/demo-business";
import { saveWhatsAppMode } from "@/lib/whatsapp-mode.functions";

export function WhatsAppModeSettings() {
  const qc = useQueryClient();
  const save = useServerFn(saveWhatsAppMode);
  const [draft, setDraft] = useState<WhatsAppMode | null>(null);
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: ["whatsapp-mode-settings"],
    queryFn: async () => {
      const [settings, businesses] = await Promise.all([
        supabase.from("app_settings").select("key,value").in("key", [WHATSAPP_MODE_SETTING_KEY, DEMO_BUSINESS_SETTING_KEY]),
        supabase.from("clinics").select("id,name").order("name"),
      ]);
      if (settings.error || businesses.error) throw new Error("Couldn't load WhatsApp settings");
      const explicit = settings.data?.find(row => row.key === WHATSAPP_MODE_SETTING_KEY);
      const id = parseDemoBusinessId(settings.data?.find(row => row.key === DEMO_BUSINESS_SETTING_KEY)?.value);
      const mode = explicit ? parseWhatsAppMode(explicit.value) : parseWhatsAppMode(id ? { mode: "business", clinic_id: id } : { mode: "mira" });
      return { mode, businesses: businesses.data ?? [], explicit: Boolean(explicit) };
    },
  });
  if (query.isPending) return <div className="mb-6"><LoadingIndicator label="Loading WhatsApp mode…" /></div>;
  if (query.isError) return <p className="mb-6 text-sm text-destructive">WhatsApp mode couldn't load. <Button variant="link" onClick={() => void query.refetch()}>Retry</Button></p>;
  const value = draft ?? query.data.mode;
  const valid = value.mode !== "business" || Boolean(value.clinic_id);
  const changed = Boolean(draft) && JSON.stringify(draft) !== JSON.stringify(query.data.mode);
  const apply = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await save({ data: value.mode === "business" ? { mode: "business", clinic_id: value.clinic_id ?? "" } : { mode: value.mode, clinic_id: null } });
      await qc.invalidateQueries({ queryKey: ["whatsapp-mode-settings"] });
      await qc.invalidateQueries({ queryKey: ["whatsapp-messages"] });
      setDraft(null);
      toast.success("WhatsApp mode saved");
    } catch {
      toast.error("Couldn't finish saving WhatsApp mode. Reload to check the current mode.");
    } finally { setSaving(false); }
  };
  return <section className="mb-6 border-b border-border pb-6" aria-labelledby="whatsapp-mode-heading">
    <h2 id="whatsapp-mode-heading" className="font-medium">WhatsApp reply mode</h2>
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <div className="w-full space-y-1 sm:w-60">
        <label className="text-xs text-muted-foreground" id="whatsapp-mode-label">Mode</label>
        <Select value={value.mode} disabled={saving} onValueChange={mode => setDraft({ mode: mode as WhatsAppMode["mode"], clinic_id: mode === "business" ? query.data.businesses[0]?.id ?? null : null })}>
          <SelectTrigger aria-labelledby="whatsapp-mode-label"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="manual">Manual — no automatic replies</SelectItem><SelectItem value="mira">Mira — Aura demo</SelectItem><SelectItem value="business">Selected business</SelectItem></SelectContent>
        </Select>
      </div>
      {value.mode === "business" && <div className="w-full space-y-1 sm:w-64">
        <label className="text-xs text-muted-foreground" id="whatsapp-business-label">Business</label>
        <Select value={value.clinic_id ?? ""} disabled={saving} onValueChange={clinic_id => setDraft({ mode: "business", clinic_id })}>
          <SelectTrigger aria-labelledby="whatsapp-business-label"><SelectValue placeholder="Choose a business" /></SelectTrigger>
          <SelectContent>{query.data.businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>}
      <Button loading={saving} loadingLabel="Saving…" disabled={!valid || (!changed && query.data.explicit)} onClick={() => void apply()}>Save mode</Button>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{value.mode === "manual" ? "Incoming messages and audio notes are recorded. Mira stays silent; messages received in manual mode won't be answered automatically later." : "Mira replies automatically. TRY codes and EXIT remain available."} Website and phone settings are unchanged.</p>
    {!query.data.explicit && <p className="mt-1 text-xs text-muted-foreground">Currently follows the shared demo default. Saving makes WhatsApp independent.</p>}
  </section>;
}