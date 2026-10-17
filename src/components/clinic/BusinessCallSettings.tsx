import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toCallSettings, callSettingsError } from "@/lib/business-call-settings";
import type { DayHours } from "@/lib/clinic";

export function BusinessCallSettings({ businessId, initial, businessHours }: { businessId: string; initial: unknown; businessHours: DayHours[] }) {
  const [settings, setSettings] = useState(() => toCallSettings(initial, businessHours));
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const set = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => setSettings(s => ({ ...s, [key]: value }));
  async function save() {
    const error = callSettingsError(settings);
    if (error) return void toast.error(error);
    setSaving(true);
    try {
      const clean = { ...settings, forwarding_number: settings.forwarding_number.replace(/[\s()-]/g, ""), hours: settings.use_business_hours ? businessHours : settings.hours };
      const result = await supabase.from("clinics").update({ call_settings: clean as unknown as Json, updated_at: new Date().toISOString() }).eq("id", businessId).select("id").single();
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: ["clinics", businessId] });
      toast.success("Call settings saved");
    } catch { toast.error("Couldn't save call settings. Please try again."); }
    finally { setSaving(false); }
  }
  return <section className="mx-auto w-full max-w-3xl space-y-5 border-t border-border pt-6" aria-labelledby="call-settings-title">
    <div className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /><h2 id="call-settings-title" className="text-xl font-semibold">Call settings</h2></div>
    <p className="text-sm text-muted-foreground">Phone service not connected</p>
    <div className="flex items-center justify-between gap-3"><Label htmlFor="business-calls">Enable assistant calls</Label><Switch id="business-calls" checked={settings.enabled} onCheckedChange={v => set("enabled", v)} /></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="forwarding-number">Forwarding number</Label><Input id="forwarding-number" type="tel" placeholder="+91 …" value={settings.forwarding_number} onChange={e => set("forwarding_number", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="call-timezone">Working-hours time zone</Label><Input id="call-timezone" value={settings.timezone} onChange={e => set("timezone", e.target.value)} placeholder="Asia/Kolkata" /></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="voice-greeting">Voice greeting</Label><Textarea id="voice-greeting" rows={3} maxLength={1000} placeholder="Hello, welcome to your business. How can I help?" value={settings.voice_greeting} onChange={e => set("voice_greeting", e.target.value)} /></div>
    </div>
    <div className="flex items-center justify-between gap-3"><Label htmlFor="call-business-hours">Use business opening hours</Label><Switch id="call-business-hours" checked={settings.use_business_hours} onCheckedChange={v => set("use_business_hours", v)} /></div>
    {!settings.use_business_hours && <div className="divide-y divide-border">{settings.hours.map((h, i) => {
      const update = (p: Partial<DayHours>) => set("hours", settings.hours.map((x, j) => j === i ? { ...x, ...p } : x));
      return <div key={h.day} className="space-y-2 py-3">
        <div className="flex items-center justify-between"><Label htmlFor={`call-day-${i}`}>{h.day}</Label><Switch id={`call-day-${i}`} checked={h.open} onCheckedChange={open => update({ open })} /></div>
        {h.open ? <div className="space-y-2">{h.slots.map((slot, k) => <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2">
          <Input type="time" aria-label={`Call ${h.day} slot ${k + 1} opens`} value={slot.from} onChange={e => update({ slots: h.slots.map((s, j) => j === k ? { ...s, from: e.target.value } : s) })} />
          <span className="text-muted-foreground">–</span>
          <Input type="time" aria-label={`Call ${h.day} slot ${k + 1} closes`} value={slot.to} onChange={e => update({ slots: h.slots.map((s, j) => j === k ? { ...s, to: e.target.value } : s) })} />
          <Button size="icon" variant="ghost" aria-label={`Remove call ${h.day} slot ${k + 1}`} disabled={h.slots.length === 1} onClick={() => update({ slots: h.slots.filter((_, j) => j !== k) })}><Trash2 className="h-4 w-4" /></Button>
        </div>)}<Button size="sm" variant="ghost" onClick={() => update({ slots: [...h.slots, { from: "17:00", to: "20:00" }] })}><Plus className="h-4 w-4" />Add time slot</Button></div> : <p className="text-sm text-muted-foreground">Closed</p>}
      </div>;
    })}</div>}
    <Button onClick={save} loading={saving} loadingLabel="Saving…">Save call settings</Button>
  </section>;
}