import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Check,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { stepError, testCodeError, type ClinicInput, type DayHours } from "@/lib/clinic";
import { cn } from "@/lib/utils";

export type PortalRequest = {
  id: string;
  channel: string;
  patient_name: string;
  phone: string;
  doctor: string;
  preferred_time: string;
  reason: string;
  status: string;
  created_at: string;
};

type Filter = "new" | "confirmed" | "cancelled" | "all";
type AdminTab = "appointments" | "settings";

export function ClinicPortalView({
  clinicName,
  role,
  requests,
  details,
  shortCode,
  onStatusChange,
  onDeleteRequest,
  onSaveDetails,
  headerExtra,
}: {
  clinicName: string;
  role: "admin" | "staff";
  requests: PortalRequest[];
  details?: ClinicInput | null;
  shortCode?: string | null;
  onStatusChange: (id: string, status: "confirmed" | "cancelled" | "new") => Promise<void>;
  onDeleteRequest?: ((id: string) => Promise<void>) | undefined;
  onSaveDetails?: ((clinic: ClinicInput, shortCode?: string) => Promise<void>) | undefined;
  headerExtra?: React.ReactNode;
}) {
  const [adminTab, setAdminTab] = useState<AdminTab>("appointments");
  const [filter, setFilter] = useState<Filter>("new");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (role === "staff") setAdminTab("appointments");
  }, [role]);

  async function act(id: string, status: "confirmed" | "cancelled" | "new") {
    setBusy(id + status);
    try {
      await onStatusChange(id, status);
      toast.success(
        status === "confirmed"
          ? "Appointment confirmed"
          : status === "cancelled"
            ? "Request cancelled"
            : "Moved back to new",
      );
    } catch {
      toast.error("Couldn't update. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id + "delete");
    try {
      await onDeleteRequest?.(id);
      toast.success("Appointment request removed");
    } catch {
      toast.error("Couldn't remove. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const list = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const count = (f: Filter) =>
    f === "all" ? requests.length : requests.filter((r) => r.status === f).length;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 p-4 pb-24">
      <header className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Clinic assistant portal</p>
            <h1 className="truncate text-xl font-semibold">{clinicName}</h1>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              role === "admin"
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {role === "admin" ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
            {role === "admin"
              ? "Clinic Admin · Chief Doctor / Manager"
              : "Support Staff · Appointments Only"}
          </span>
        </div>
        {headerExtra}
        {role === "admin" && details && onSaveDetails && (
          <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-background p-1 text-xs">
            <button
              type="button"
              onClick={() => setAdminTab("appointments")}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
                adminTab === "appointments"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarCheck className="h-4 w-4" />
              Appointments ({count("new")} new)
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("settings")}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
                adminTab === "settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Stethoscope className="h-4 w-4" />
              Clinic Info &amp; FAQs
            </button>
          </div>
        )}
      </header>

      {(role === "staff" || adminTab === "appointments") && (
        <section className="space-y-4" aria-label="Appointment requests">
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-border p-1 text-xs">
            {(["new", "confirmed", "cancelled", "all"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "min-h-11 rounded-md capitalize",
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {f} ({count(f)})
              </button>
            ))}
          </div>
          {!list.length && (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No {filter === "all" ? "" : filter} appointment requests.
            </p>
          )}
          <ul className="space-y-3">
            {list.map((r) => {
              const digits = r.phone.replace(/[^\d]/g, "");
              return (
                <li key={r.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{r.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[r.doctor, r.preferred_time].filter(Boolean).join(" · ") ||
                          "No preference given"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs capitalize",
                        r.status === "confirmed"
                          ? "bg-primary/15 text-primary"
                          : r.status === "cancelled"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-foreground",
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.reason && <p className="text-sm">{r.reason}</p>}
                  <p className="text-xs text-muted-foreground">
                    {r.channel} · {new Date(r.created_at).toLocaleString()}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {r.phone && (
                      <Button asChild variant="secondary" className="min-h-11">
                        <a href={`tel:${r.phone.replace(/\s/g, "")}`}>
                          <Phone className="h-4 w-4" /> Call
                        </a>
                      </Button>
                    )}
                    {digits && (
                      <Button asChild variant="secondary" className="min-h-11">
                        <a
                          href={`https://wa.me/${digits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      </Button>
                    )}
                    {r.status !== "confirmed" && (
                      <Button
                        className="min-h-11"
                        onClick={() => act(r.id, "confirmed")}
                        loading={busy === r.id + "confirmed"}
                        loadingLabel="Confirming…"
                      >
                        <Check className="h-4 w-4" /> Confirm
                      </Button>
                    )}
                    {r.status === "new" && (
                      <Button
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => act(r.id, "cancelled")}
                        loading={busy === r.id + "cancelled"}
                        loadingLabel="Cancelling…"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    )}
                    {r.status !== "new" && (
                      <Button
                        variant="ghost"
                        className="min-h-11"
                        onClick={() => act(r.id, "new")}
                        loading={busy === r.id + "new"}
                        loadingLabel="Undoing…"
                      >
                        Undo
                      </Button>
                    )}
                    {role === "admin" && onDeleteRequest && (
                      <Button
                        variant="ghost"
                        className="min-h-11 text-destructive hover:text-destructive"
                        onClick={() => remove(r.id)}
                        loading={busy === r.id + "delete"}
                        loadingLabel="Removing…"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {role === "admin" && adminTab === "settings" && details && onSaveDetails && (
        <ClinicAdminEditor
          key={JSON.stringify({ details, shortCode })}
          initial={details}
          initialShortCode={shortCode ?? ""}
          onSave={onSaveDetails}
        />
      )}
    </main>
  );
}

function ClinicAdminEditor({
  initial,
  initialShortCode,
  onSave,
}: {
  initial: ClinicInput;
  initialShortCode: string;
  onSave: (clinic: ClinicInput, shortCode?: string) => Promise<void>;
}) {
  const [c, setC] = useState<ClinicInput>(initial);
  const [code, setCode] = useState(initialShortCode);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ClinicInput>(k: K, v: ClinicInput[K]) =>
    setC((p) => ({ ...p, [k]: v }));
  const setDay = (i: number, p: Partial<DayHours>) =>
    set(
      "hours",
      c.hours.map((h, j) => (j === i ? { ...h, ...p } : h)),
    );
  const setDoc = (i: number, k: "name" | "specialty" | "days" | "fee", v: string) =>
    set(
      "doctors",
      c.doctors.map((d, j) => (j === i ? { ...d, [k]: v } : d)),
    );

  async function save() {
    for (const step of [0, 1, 2]) {
      const err = stepError(step, c);
      if (err) {
        toast.error(err);
        return;
      }
    }
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode) {
      const codeErr = testCodeError(cleanCode);
      if (codeErr) {
        toast.error(codeErr);
        return;
      }
    }
    setSaving(true);
    try {
      await onSave(c, cleanCode || undefined);
      toast.success("Clinic info saved — Mira uses this on the very next reply.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save clinic info.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6" aria-label="Clinic administrative settings">
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Clinic details</h2>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
              <Label htmlFor="admin-name">Clinic name</Label>
              <Input id="admin-name" value={c.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="admin-shortcode">Assistant short code</Label>
              <Input
                id="admin-shortcode"
                value={code}
                maxLength={10}
                placeholder="e.g. AURA or XYZ"
                className="font-mono uppercase"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="admin-phone">Appointments phone</Label>
              <Input
                id="admin-phone"
                value={c.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-emergency">Emergency phone</Label>
              <Input
                id="admin-emergency"
                value={c.emergency_phone}
                onChange={(e) => set("emergency_phone", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="admin-address">Address</Label>
            <Input
              id="admin-address"
              value={c.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="admin-map">Google Maps link</Label>
            <Input
              id="admin-map"
              placeholder="https://maps.app.goo.gl/..."
              value={c.map_url}
              onChange={(e) => set("map_url", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Opening hours</h2>
        <div className="divide-y divide-border">
          {c.hours.map((h, i) => (
            <div key={h.day} className="space-y-2 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <Label htmlFor={`admin-day-${i}`}>{h.day}</Label>
                <Switch
                  id={`admin-day-${i}`}
                  checked={h.open}
                  onCheckedChange={(open) => setDay(i, { open })}
                />
              </div>
              {h.open ? (
                <div className="space-y-2">
                  {h.slots.map((slot, k) => (
                    <div
                      key={k}
                      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2"
                    >
                      <Input
                        type="time"
                        aria-label={`${h.day} slot ${k + 1} opens`}
                        value={slot.from}
                        onChange={(e) =>
                          setDay(i, {
                            slots: h.slots.map((s, j) =>
                              j === k ? { ...s, from: e.target.value } : s,
                            ),
                          })
                        }
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        aria-label={`${h.day} slot ${k + 1} closes`}
                        value={slot.to}
                        onChange={(e) =>
                          setDay(i, {
                            slots: h.slots.map((s, j) =>
                              j === k ? { ...s, to: e.target.value } : s,
                            ),
                          })
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${h.day} slot ${k + 1}`}
                        disabled={h.slots.length === 1}
                        onClick={() => setDay(i, { slots: h.slots.filter((_, j) => j !== k) })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDay(i, { slots: [...h.slots, { from: "17:00", to: "20:00" }] })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add time slot
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Closed</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Doctors &amp; consultation fees</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              set("doctors", [...c.doctors, { name: "", specialty: "", days: "", fee: "" }])
            }
          >
            <Plus className="h-4 w-4" /> Add doctor
          </Button>
        </div>
        <div className="space-y-3">
          {c.doctors.map((d, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Doctor {i + 1}</span>
                {c.doctors.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      set(
                        "doctors",
                        c.doctors.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Doctor name"
                  value={d.name}
                  onChange={(e) => setDoc(i, "name", e.target.value)}
                />
                <Input
                  placeholder="Consultation fee (e.g. ₹600)"
                  value={d.fee}
                  onChange={(e) => setDoc(i, "fee", e.target.value)}
                />
              </div>
              <Input
                placeholder="Specialty"
                value={d.specialty}
                onChange={(e) => setDoc(i, "specialty", e.target.value)}
              />
              <Input
                placeholder="Consulting days & hours"
                value={d.days}
                onChange={(e) => setDoc(i, "days", e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">FAQs, services &amp; assistant instructions</h2>
        <div>
          <Label htmlFor="admin-insurance">Insurance &amp; payment notes</Label>
          <Input
            id="admin-insurance"
            value={c.insurance}
            onChange={(e) => set("insurance", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="admin-notes">Clinic FAQs, services &amp; pre-visit instructions</Label>
          <Textarea
            id="admin-notes"
            rows={5}
            value={c.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Parking, fasting instructions, vaccinations, services, etc."
          />
        </div>
      </div>

      <Button
        size="lg"
        className="h-12 w-full"
        onClick={save}
        loading={saving}
        loadingLabel="Saving…"
      >
        Save clinic info
      </Button>
    </section>
  );
}
