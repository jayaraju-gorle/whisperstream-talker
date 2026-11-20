import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  HeartPulse,
  Inbox,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import type { PortalConversation } from "@/lib/server/portal-conversations.server";
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
type ConversationFilter = "all" | "inquiry" | "appointment";
type PortalTab = "appointments" | "conversations" | "settings";

const STATUS_META: Record<string, { label: string; badge: string; bar: string }> = {
  new: {
    label: "New request",
    badge: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
    bar: "bg-amber-400",
  },
  confirmed: {
    label: "Confirmed",
    badge: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
    bar: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    bar: "bg-red-400",
  },
};

const FILTER_LABELS: Record<Filter, string> = {
  new: "New",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  all: "All",
};

function initials(name: string) {
  const parts = name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

function channelIcon(channel: string): LucideIcon {
  const c = channel.toLowerCase();
  if (c.includes("whatsapp")) return MessageCircle;
  if (c.includes("phone")) return Phone;
  return Globe;
}

function channelLabel(channel: string) {
  return channel === "Browser" ? "Website" : channel;
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.round((Date.now() - then) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff} min ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function ChannelChip({ channel }: { channel: string }) {
  const Icon = channelIcon(channel);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3" />
      {channelLabel(channel)}
    </span>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<readonly [T, string, number?]>;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 text-xs shadow-sm"
    >
      {options.map(([key, text, n]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 font-medium transition-colors",
            value === key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {text}
          {typeof n === "number" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums",
                value === key ? "bg-white/20" : "bg-muted text-foreground",
              )}
            >
              {n}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function ClinicPortalView({
  clinicName,
  role,
  requests,
  conversations = [],
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
  conversations?: PortalConversation[] | undefined;
  details?: ClinicInput | null;
  shortCode?: string | null;
  onStatusChange: (id: string, status: "confirmed" | "cancelled" | "new") => Promise<void>;
  onDeleteRequest?: ((id: string) => Promise<void>) | undefined;
  onSaveDetails?: ((clinic: ClinicInput, shortCode?: string) => Promise<void>) | undefined;
  headerExtra?: React.ReactNode;
}) {
  const [tab, setTab] = useState<PortalTab>("appointments");
  const [filter, setFilter] = useState<Filter>("new");
  const [convoFilter, setConvoFilter] = useState<ConversationFilter>("all");
  const [expandedConvo, setExpandedConvo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (role === "staff" && tab === "settings") setTab("appointments");
  }, [role, tab]);

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
  const showSettings = role === "admin" && Boolean(details && onSaveDetails);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const filteredConvos =
    convoFilter === "all"
      ? conversations
      : convoFilter === "inquiry"
        ? conversations.filter((c) => !c.hasAppointment)
        : conversations.filter((c) => c.hasAppointment);
  const inquiryCount = conversations.filter((c) => !c.hasAppointment).length;
  const bookedCount = conversations.length - inquiryCount;

  const stats: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    tone: string;
    to: () => void;
  }> = [
    {
      label: "New requests",
      value: count("new"),
      icon: Inbox,
      tone: "bg-amber-50 text-amber-700",
      to: () => {
        setTab("appointments");
        setFilter("new");
      },
    },
    {
      label: "Confirmed",
      value: count("confirmed"),
      icon: CalendarCheck,
      tone: "bg-emerald-50 text-emerald-700",
      to: () => {
        setTab("appointments");
        setFilter("confirmed");
      },
    },
    {
      label: "Conversations",
      value: conversations.length,
      icon: MessageSquareText,
      tone: "bg-sky-50 text-sky-700",
      to: () => setTab("conversations"),
    },
  ];

  const tabs: Array<{ key: PortalTab; label: string; icon: LucideIcon; badge?: number }> = [
    { key: "appointments", label: "Appointments", icon: CalendarCheck, badge: count("new") },
    { key: "conversations", label: "Conversations", icon: MessageSquareText },
    ...(showSettings
      ? [{ key: "settings" as const, label: "Clinic Info", icon: Stethoscope }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Branded clinic header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary to-[oklch(0.42_0.1_175)] text-primary-foreground">
        <HeartPulse
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-white/10"
        />
        <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:pt-7">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {today}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-medium text-white ring-1 ring-inset ring-white/25">
              {role === "admin" ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              {role === "admin" ? "Clinic Admin · Doctor / Manager" : "Front Desk · Appointments"}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-md">
              <Stethoscope className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-white/75">
                Clinic assistant portal
              </p>
              <h1 className="truncate text-xl font-semibold leading-tight sm:text-2xl">
                {clinicName}
              </h1>
            </div>
          </div>
          {headerExtra && <div className="mt-3">{headerExtra}</div>}
        </div>
      </header>

      <main className="relative mx-auto -mt-11 w-full max-w-3xl space-y-5 px-4 pb-24">
        {/* At-a-glance stats */}
        <section aria-label="Today at a glance" className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map(({ label, value, icon: Icon, tone, to }) => (
            <button
              key={label}
              type="button"
              onClick={to}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md sm:p-4"
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tone)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-2xl font-semibold tabular-nums leading-none">{value}</span>
              <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                {label}
              </span>
            </button>
          ))}
        </section>

        {/* Primary navigation */}
        <nav
          aria-label="Portal sections"
          className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur"
        >
          <div className="flex gap-1">
            {tabs.map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium transition-colors",
                  tab === key
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
                {badge ? (
                  <span className="rounded-full bg-amber-500 px-1.5 py-px text-[10px] font-semibold tabular-nums text-white">
                    {badge}
                  </span>
                ) : null}
                {tab === key && (
                  <span className="absolute inset-x-6 -bottom-2 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {tab === "appointments" && (
          <section className="space-y-4" aria-label="Appointment requests">
            <SegmentedControl
              label="Filter appointment requests"
              value={filter}
              onChange={setFilter}
              options={(["new", "confirmed", "cancelled", "all"] as Filter[]).map(
                (f) => [f, FILTER_LABELS[f], count(f)] as const,
              )}
            />
            {!list.length && (
              <EmptyState
                icon={CalendarCheck}
                title={`No ${filter === "all" ? "" : FILTER_LABELS[filter].toLowerCase() + " "}appointment requests`}
                text="Requests booked by patients via WhatsApp, phone or your website appear here instantly."
              />
            )}
            <ul className="space-y-3">
              {list.map((r) => {
                const digits = r.phone.replace(/[^\d]/g, "");
                const meta = STATUS_META[r.status] ?? STATUS_META["new"]!;
                return (
                  <li
                    key={r.id}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("absolute inset-y-0 left-0 w-1", meta.bar)}
                    />
                    <div className="space-y-3 p-4 pl-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                          {initials(r.patient_name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-semibold">{r.patient_name}</p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                meta.badge,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {r.doctor && (
                              <span className="inline-flex items-center gap-1">
                                <Stethoscope className="h-3.5 w-3.5 text-primary" />
                                {r.doctor}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {r.preferred_time || "No time preference"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {r.reason && (
                        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                          <span className="font-medium text-muted-foreground">Reason: </span>
                          {r.reason}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <ChannelChip channel={r.channel} />
                        <span>Requested {relativeTime(r.created_at)}</span>
                        {r.phone && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium tabular-nums text-foreground">
                              {r.phone}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                        {r.status !== "confirmed" && (
                          <Button
                            className="min-h-10 flex-1 sm:flex-none"
                            onClick={() => act(r.id, "confirmed")}
                            loading={busy === r.id + "confirmed"}
                            loadingLabel="Confirming…"
                          >
                            <Check className="h-4 w-4" /> Confirm
                          </Button>
                        )}
                        {r.phone && (
                          <Button
                            asChild
                            variant="outline"
                            className="min-h-10 flex-1 sm:flex-none"
                          >
                            <a href={`tel:${r.phone.replace(/\s/g, "")}`}>
                              <Phone className="h-4 w-4" /> Call
                            </a>
                          </Button>
                        )}
                        {digits && (
                          <Button
                            asChild
                            variant="outline"
                            className="min-h-10 flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 sm:flex-none"
                          >
                            <a
                              href={`https://wa.me/${digits}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-4 w-4" /> WhatsApp
                            </a>
                          </Button>
                        )}
                        <div className="ml-auto flex gap-1">
                          {r.status === "new" && (
                            <Button
                              variant="ghost"
                              className="min-h-10 text-muted-foreground"
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
                              className="min-h-10 text-muted-foreground"
                              onClick={() => act(r.id, "new")}
                              loading={busy === r.id + "new"}
                              loadingLabel="Undoing…"
                            >
                              <RotateCcw className="h-4 w-4" /> Undo
                            </Button>
                          )}
                          {role === "admin" && onDeleteRequest && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove request from ${r.patient_name}`}
                              title="Remove request"
                              className="min-h-10 min-w-10 text-destructive hover:bg-red-50 hover:text-destructive"
                              onClick={() => remove(r.id)}
                              loading={busy === r.id + "delete"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === "conversations" && (
          <section className="space-y-4" aria-label="All conversations">
            <SegmentedControl
              label="Filter conversations"
              value={convoFilter}
              onChange={setConvoFilter}
              options={[
                ["all", "All", conversations.length],
                ["inquiry", "Inquiries", inquiryCount],
                ["appointment", "Booked", bookedCount],
              ]}
            />

            {!filteredConvos.length && (
              <EmptyState
                icon={MessageSquareText}
                title="No conversations yet"
                text="Every patient chat and call with your 24/7 assistant — including general questions — shows up here."
              />
            )}

            <ul className="space-y-3">
              {filteredConvos.map((c) => {
                const expanded = expandedConvo === c.id;
                const digits = c.contact.replace(/[^\d]/g, "");
                const hasPhone = digits.length >= 7;
                const Icon = channelIcon(c.channel);
                return (
                  <li key={c.id} className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-semibold tabular-nums">{c.contact}</p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                c.hasAppointment
                                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
                                  : "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200",
                              )}
                            >
                              {c.hasAppointment ? "Appointment booked" : "General inquiry"}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            “{c.preview}”
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <ChannelChip channel={c.channel} />
                        <span>{relativeTime(c.updated_at)}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {c.messageCount} {c.messageCount === 1 ? "message" : "messages"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-10 flex-1 sm:flex-none"
                          aria-expanded={expanded}
                          onClick={() => setExpandedConvo(expanded ? null : c.id)}
                        >
                          {expanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" /> Hide transcript
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" /> View transcript
                            </>
                          )}
                        </Button>
                        {hasPhone && (
                          <>
                            <Button
                              asChild
                              variant="outline"
                              className="min-h-10 flex-1 sm:flex-none"
                            >
                              <a href={`tel:${c.contact.replace(/\s/g, "")}`}>
                                <Phone className="h-4 w-4" /> Call
                              </a>
                            </Button>
                            <Button
                              asChild
                              variant="outline"
                              className="min-h-10 flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 sm:flex-none"
                            >
                              <a
                                href={`https://wa.me/${digits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="h-4 w-4" /> WhatsApp
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {expanded && (
                      <div className="space-y-2 rounded-b-2xl border-t border-border bg-muted/60 p-4">
                        {c.messages.map((m) => (
                          <div
                            key={m.id}
                            className={cn(
                              "flex",
                              m.role === "user" ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                                m.role === "user"
                                  ? "rounded-br-sm bg-primary text-primary-foreground"
                                  : "rounded-bl-sm border border-border bg-card text-foreground",
                              )}
                            >
                              <p
                                className={cn(
                                  "mb-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                  m.role === "user" ? "text-white/75" : "text-primary",
                                )}
                              >
                                {m.role === "user" ? "Patient" : "Assistant"}
                              </p>
                              <p className="whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {role === "admin" && tab === "settings" && details && onSaveDetails && (
          <ClinicAdminEditor
            key={JSON.stringify({ details, shortCode })}
            initial={details}
            initialShortCode={shortCode ?? ""}
            onSave={onSaveDetails}
          />
        )}

        <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Patient details are visible only to authorised staff of {clinicName}.
        </p>
      </main>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold leading-tight">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
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
      toast.success("Clinic info saved — the assistant uses this on the very next reply.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save clinic info.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4" aria-label="Clinic administrative settings">
      <SettingsCard
        icon={MapPin}
        title="Clinic details"
        description="Shown to patients and used by the assistant on WhatsApp, phone and web."
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Clinic name</Label>
              <Input id="admin-name" value={c.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Appointments phone</Label>
              <Input
                id="admin-phone"
                value={c.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-emergency">Emergency phone</Label>
              <Input
                id="admin-emergency"
                value={c.emergency_phone}
                onChange={(e) => set("emergency_phone", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-address">Address</Label>
            <Input
              id="admin-address"
              value={c.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-map">Google Maps link</Label>
            <Input
              id="admin-map"
              placeholder="https://maps.app.goo.gl/..."
              value={c.map_url}
              onChange={(e) => set("map_url", e.target.value)}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Clock}
        title="OPD timings"
        description="Opening hours for each day of the week."
      >
        <div className="divide-y divide-border">
          {c.hours.map((h, i) => (
            <div key={h.day} className="space-y-2 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <Label htmlFor={`admin-day-${i}`} className="font-medium">
                  {h.day}
                </Label>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      h.open ? "text-emerald-700" : "text-muted-foreground",
                    )}
                  >
                    {h.open ? "Open" : "Closed"}
                  </span>
                  <Switch
                    id={`admin-day-${i}`}
                    checked={h.open}
                    onCheckedChange={(open) => setDay(i, { open })}
                  />
                </div>
              </div>
              {h.open && (
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
                    className="text-primary"
                    onClick={() =>
                      setDay(i, { slots: [...h.slots, { from: "17:00", to: "20:00" }] })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add time slot
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Stethoscope}
        title="Doctors & consultation fees"
        description="Patients can request appointments with any doctor listed here."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              set("doctors", [...c.doctors, { name: "", specialty: "", days: "", fee: "" }])
            }
          >
            <Plus className="h-4 w-4" /> Add doctor
          </Button>
        }
      >
        <div className="space-y-3">
          {c.doctors.map((d, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-secondary-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                    {d.name.trim() ? initials(d.name) : i + 1}
                  </span>
                  Doctor {i + 1}
                </span>
                {c.doctors.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-red-50 hover:text-destructive"
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
                  placeholder="Doctor name (e.g. Dr. Anika Rao)"
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
                placeholder="Specialty (e.g. General Physician)"
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
      </SettingsCard>

      <SettingsCard
        icon={MessageSquareText}
        title="FAQs, services & patient instructions"
        description="The assistant answers patient questions using this information."
      >
        <div className="space-y-1.5">
          <Label htmlFor="admin-insurance">Insurance &amp; payment notes</Label>
          <Input
            id="admin-insurance"
            value={c.insurance}
            onChange={(e) => set("insurance", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-notes">Clinic FAQs, services &amp; pre-visit instructions</Label>
          <Textarea
            id="admin-notes"
            rows={5}
            value={c.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Parking, fasting instructions, vaccinations, services, etc."
          />
        </div>
      </SettingsCard>

      <div className="sticky bottom-3 z-10">
        <Button
          size="lg"
          className="h-12 w-full rounded-xl shadow-lg"
          onClick={save}
          loading={saving}
          loadingLabel="Saving…"
        >
          <Check className="h-4 w-4" /> Save clinic info
        </Button>
      </div>
    </section>
  );
}
