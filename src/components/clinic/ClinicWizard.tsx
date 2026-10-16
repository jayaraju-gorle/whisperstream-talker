import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { stepError, testCodeError, type ClinicInput } from "@/lib/clinic";
import { IVY_PRESET, IVY_PRESET_LABEL, IYASHI_PRESET, IYASHI_PRESET_LABEL, SSK_PRESET, SSK_PRESET_LABEL } from "@/lib/clinic-presets";
import { supabase } from "@/integrations/supabase/client";
import { saveClinic, type ClinicRow } from "@/lib/clinic-store";
import { LIBRARY_KEY } from "@/hooks/use-library";
import { ClinicTestCall } from "./ClinicTestCall";
import { cn } from "@/lib/utils";

const STEPS = ["Clinic details", "Opening hours", "Doctors & fees", "Test call"];

export function ClinicWizard({ userId, initial, existing }: { userId: string; initial: ClinicInput; existing?: ClinicRow }) {
  const [c, setC] = useState(initial);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; code: string; scenario_id: string | null; kb_id: string | null } | null>(
    existing ? { id: existing.id, code: existing.test_code, scenario_id: existing.scenario_id, kb_id: existing.kb_id } : null,
  );
  const [code, setCode] = useState(existing?.test_code ?? "");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const set = <K extends keyof ClinicInput>(k: K, v: ClinicInput[K]) => setC((p) => ({ ...p, [k]: v }));
  function loadPreset(preset: ClinicInput, label: string) {
    setC(preset);
    setStep(0);
    toast.success(`${label}'s details loaded — review them before saving.`);
  }

  async function next(saveNow = false) {
    for (const k of saveNow ? [0, 1, 2] : [step]) {
      const err = stepError(k, c) ?? (k === 0 && existing ? testCodeError(code) : null);
      if (err) { setStep(k); return void toast.error(err); }
    }
    if (step < 2 && !saveNow) return setStep(step + 1);
    setSaving(true);
    try {
      const id = await saveClinic(userId, c, saved ?? undefined);
      if (existing && code !== saved?.code) {
        const { error } = await supabase.from("clinics").update({ test_code: code }).eq("id", id);
        if (error) {
          setStep(0);
          return void toast.error(error.code === "23505" ? `Test code ${code} is already used by another clinic.` : "Couldn't save the test code.");
        }
      }
      await qc.invalidateQueries({ queryKey: LIBRARY_KEY });
      await qc.invalidateQueries({ queryKey: ["clinics"] });
      const { data, error } = await supabase.from("clinics").select("test_code,scenario_id,kb_id").eq("id", id).single();
      if (error) throw error;
      setSaved({ id, code: data.test_code, scenario_id: data.scenario_id, kb_id: data.kb_id });
      if (!saveNow) setStep(3);
      toast.success("Clinic saved");
    } catch {
      toast.error("Couldn't save the clinic. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ol className="grid grid-cols-4 gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" disabled={saving || (i === 3 ? !saved : i > step && !saved)}
              onClick={() => setStep(i)}
              className={cn("w-full border-t-2 pt-2 text-left disabled:opacity-50", i <= step ? "border-primary text-foreground" : "border-border text-muted-foreground")}>
              <span className="font-mono">0{i + 1}</span> <span className="hidden sm:inline">{s}</span>
            </button>
          </li>
        ))}
      </ol>
      <h2 className="text-xl font-semibold">{STEPS[step]}</h2>

      {step === 0 && !existing && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <p className="text-sm text-muted-foreground">
            Setting up one of these clinics? Fill in its details with one click, then review before saving.
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { preset: IVY_PRESET, label: IVY_PRESET_LABEL },
              { preset: IYASHI_PRESET, label: IYASHI_PRESET_LABEL },
              { preset: SSK_PRESET, label: SSK_PRESET_LABEL },
            ] as const).map(({ preset, label }) =>
              c.name.trim() ? (
                <AlertDialog key={label}>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="shrink-0">
                      <Sparkles className="h-4 w-4" /> Load {label}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Replace what you've entered?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Loading {label} overwrites the details typed so far with its pre-filled profile.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep my entries</AlertDialogCancel>
                      <AlertDialogAction onClick={() => loadPreset(preset, label)}>Load {label}'s details</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button key={label} variant="secondary" size="sm" className="shrink-0" onClick={() => loadPreset(preset, label)}>
                  <Sparkles className="h-4 w-4" /> Load {label}
                </Button>
              ),
            )}
          </div>
        </div>
      )}

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clinic name *"><Input value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="Sunrise Family Clinic" /></Field>
          <Field label="Appointments phone *"><Input value={c.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 80 1234 5678" /></Field>
          <Field label="Emergency phone"><Input value={c.emergency_phone} onChange={(e) => set("emergency_phone", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={c.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Address"><Input value={c.address} onChange={(e) => set("address", e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label="Google Maps link"><Input type="url" value={c.map_url} onChange={(e) => set("map_url", e.target.value)} placeholder="https://maps.app.goo.gl/…" /></Field></div>
          {existing && (
            <Field label="WhatsApp test code (3–10 letters or numbers)">
              <Input value={code} maxLength={10} className="font-mono uppercase" placeholder="IVY"
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
            </Field>
          )}
          <div className="sm:col-span-2"><Field label="Other things patients often ask (parking, visiting rules…)"><Textarea rows={3} value={c.notes} onChange={(e) => set("notes", e.target.value)} /></Field></div>
        </div>
      )}

      {step === 1 && (
        <div className="divide-y divide-border rounded-lg border border-border">
          {c.hours.map((h, i) => {
            const setDay = (p: Partial<typeof h>) => set("hours", c.hours.map((x, j) => (j === i ? { ...x, ...p } : x)));
            const setSlot = (k: number, p: Partial<(typeof h.slots)[number]>) => setDay({ slots: h.slots.map((s, m) => (m === k ? { ...s, ...p } : s)) });
            return (
              <div key={h.day} className="grid grid-cols-[6rem_auto_minmax(0,1fr)] items-start gap-3 p-3 sm:grid-cols-[8rem_auto_minmax(0,1fr)]">
                <span className="pt-2 text-sm">{h.day}</span>
                <Switch className="mt-2" checked={h.open} aria-label={`${h.day} open`} onCheckedChange={(open) => setDay({ open })} />
                {h.open ? (
                  <div className="min-w-0 space-y-2">
                    {h.slots.map((s, k) => (
                      <div key={k} className="flex min-w-0 items-center gap-2">
                        <Input type="time" value={s.from} aria-label={`${h.day} slot ${k + 1} opens`} onChange={(e) => setSlot(k, { from: e.target.value })} />
                        <span className="text-muted-foreground">–</span>
                        <Input type="time" value={s.to} aria-label={`${h.day} slot ${k + 1} closes`} onChange={(e) => setSlot(k, { to: e.target.value })} />
                        <Button variant="ghost" size="icon" aria-label={`Remove ${h.day} slot ${k + 1}`} disabled={h.slots.length === 1}
                          onClick={() => setDay({ slots: h.slots.filter((_, m) => m !== k) })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => {
                      const last = h.slots[h.slots.length - 1]?.to ?? "09:00";
                      setDay({ slots: [...h.slots, { from: last < "17:00" ? "17:00" : last, to: "20:00" }] });
                    }}><Plus className="h-4 w-4" /> Add time slot</Button>
                  </div>
                ) : <span className="pt-2 text-sm text-muted-foreground">Closed</span>}
              </div>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {c.doctors.map((d, i) => {
            const upd = (p: Partial<typeof d>) => set("doctors", c.doctors.map((x, j) => (j === i ? { ...x, ...p } : x)));
            return (
              <div key={i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_7rem_auto] sm:items-end">
                <Field label="Doctor"><Input value={d.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Dr. Meera Patel" /></Field>
                <Field label="Specialty"><Input value={d.specialty} onChange={(e) => upd({ specialty: e.target.value })} placeholder="Pediatrics" /></Field>
                <Field label="Days & times"><Input value={d.days} onChange={(e) => upd({ days: e.target.value })} placeholder="Tue, Thu 10–4" /></Field>
                <Field label="Fee"><Input value={d.fee} onChange={(e) => upd({ fee: e.target.value })} placeholder="₹800" /></Field>
                <Button variant="ghost" size="icon" aria-label="Remove doctor" disabled={c.doctors.length === 1}
                  onClick={() => set("doctors", c.doctors.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            );
          })}
          <Button variant="secondary" size="sm" onClick={() => set("doctors", [...c.doctors, { name: "", specialty: "", days: "", fee: "" }])}>
            <Plus className="h-4 w-4" /> Add doctor
          </Button>
          <Field label="Insurance accepted"><Textarea rows={2} value={c.insurance} onChange={(e) => set("insurance", e.target.value)} placeholder="Star Health, HDFC ERGO… cashless desk at reception" /></Field>
        </div>
      )}

      {step === 3 && saved && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">The receptionist now knows {c.name}'s hours, doctors and fees. Try it as a patient would.</p>
          <ClinicTestCall clinicId={saved.id} code={saved.code} />
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 3 ? (
          <div className="flex gap-2">
            {saved && step < 2 && <Button variant="secondary" onClick={() => next(true)} disabled={saving}>Save changes</Button>}
            <Button onClick={() => next()} loading={saving} loadingLabel="Saving…">{step === 2 ? "Save and test" : "Continue"}</Button>
          </div>
        ) : (
          <Button onClick={() => saved && navigate({ to: "/clinics/$id", params: { id: saved.id } })}>Go to dashboard</Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
