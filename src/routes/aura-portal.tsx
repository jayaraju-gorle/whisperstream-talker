import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { ArrowLeft, KeyRound, Lock, QrCode, ShieldCheck, UserCheck } from "lucide-react";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { ClinicPortalView, type PortalRequest } from "@/components/clinic/ClinicPortalView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuraDemoPortal, saveAuraDemoClinic, setAuraDemoStatus } from "@/lib/portal.functions";

export const Route = createFileRoute("/aura-portal")({
  staticData: { sitemap: false },
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { code?: string } =>
    typeof search["code"] === "string" ? { code: search["code"] } : {},
  head: () => ({
    meta: [
      { title: "Aura Health Clinic — Role-Based Portal Demo" },
      {
        name: "description",
        content:
          "Mobile-friendly demo of the Clinic Admin and Support Staff roles for Aura Health Clinic.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuraPortalDemo,
});

const SAMPLE_DEMO_REQUESTS: PortalRequest[] = [
  {
    id: "demo-1",
    channel: "WhatsApp",
    patient_name: "Arjun K. (Sample)",
    phone: "+91 98765 43210",
    doctor: "Dr. Anika Rao",
    preferred_time: "Tomorrow, 6:00 PM",
    reason: "Fever & routine consultation",
    status: "new",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    channel: "Phone",
    patient_name: "Meena S. (Sample)",
    phone: "+91 91234 56789",
    doctor: "Dr. Rohan Mehta",
    preferred_time: "Saturday, 5:30 PM",
    reason: "Child vaccination inquiry",
    status: "confirmed",
    created_at: new Date(Date.now() - 3600_000).toISOString(),
  },
];

function PortalQrCards() {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://conversationalaistudio.online";
  const adminUrl = `${origin}/aura-portal?code=AURA-ADMIN`;
  const staffUrl = `${origin}/aura-portal?code=AURA-STAFF`;
  const cards = [
    {
      title: "Clinic Admin QR",
      subtitle: "Chief Doctor / Manager",
      code: "AURA-ADMIN",
      url: adminUrl,
      icon: ShieldCheck,
    },
    {
      title: "Support Staff QR",
      subtitle: "Receptionist (Appointments only)",
      code: "AURA-STAFF",
      url: staffUrl,
      icon: UserCheck,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map(({ title, subtitle, code, url, icon: Icon }) => (
        <div
          key={code}
          className="flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center"
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-3 rounded-xl bg-white p-3">
            <QRCodeSVG value={url} size={156} level="M" />
          </div>
          <p className="mt-2 font-mono text-xs font-medium text-primary">{code}</p>
          <Button asChild variant="outline" size="sm" className="mt-2 w-full">
            <a href={url}>Open {code}</a>
          </Button>
        </div>
      ))}
    </div>
  );
}

function AuraPortalDemo() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const [draftCode, setDraftCode] = useState(code ?? "");
  const [showQr, setShowQr] = useState(false);
  const [sampleRequests, setSampleRequests] = useState<PortalRequest[]>(SAMPLE_DEMO_REQUESTS);
  const [localDetails, setLocalDetails] = useState<
    Awaited<ReturnType<typeof load>>["details"] | null
  >(null);
  const load = useServerFn(getAuraDemoPortal);
  const updateStatus = useServerFn(setAuraDemoStatus);
  const saveDetails = useServerFn(saveAuraDemoClinic);
  const qc = useQueryClient();

  const activeCode = code?.trim() ?? "";

  const q = useQuery({
    queryKey: ["aura-demo-portal", activeCode],
    enabled: Boolean(activeCode),
    queryFn: () => load({ data: { code: activeCode } }),
    refetchInterval: 20000,
    retry: false,
  });

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = draftCode.trim().toUpperCase();
    if (!cleaned) return;
    void navigate({ to: "/aura-portal", search: { code: cleaned } });
  }

  function lockPortal() {
    setDraftCode("");
    setShowQr(false);
    void navigate({ to: "/aura-portal", search: {} });
  }

  if (!activeCode || q.isError) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold">Aura Health Clinic · Portal Access</h1>
              <p className="text-xs text-muted-foreground">
                Enter your role access code or scan a demo QR code.
              </p>
            </div>
          </div>

          <form onSubmit={submitCode} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="portal-access-code">Access code</Label>
              <Input
                id="portal-access-code"
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value)}
                placeholder="e.g. AURA-ADMIN or AURA-STAFF"
                autoCapitalize="characters"
                autoComplete="off"
                className="h-11 font-mono uppercase"
              />
            </div>
            {q.isError && activeCode && (
              <p role="alert" className="text-xs text-destructive">
                Invalid access code. Use <span className="font-mono">AURA-ADMIN</span> or{" "}
                <span className="font-mono">AURA-STAFF</span>.
              </p>
            )}
            <Button type="submit" size="lg" className="h-11 w-full">
              Unlock portal
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <QrCode className="h-4 w-4 text-primary" />
            <span>Scan on a phone to open either role directly</span>
          </div>
          <PortalQrCards />
        </section>
      </main>
    );
  }

  if (q.isLoading || !q.data) {
    return (
      <main className="p-6">
        <LoadingIndicator label="Opening portal…" />
      </main>
    );
  }

  const realRequests = q.data.requests;
  const requests = realRequests.length ? realRequests : sampleRequests;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-primary/30 bg-primary/10 px-4 py-2.5 text-xs">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-foreground">
            Aura Clinic Demo · <span className="font-mono">{activeCode.toUpperCase()}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setShowQr((s) => !s)}
            >
              <QrCode className="h-3.5 w-3.5" />
              {showQr ? "Hide QRs" : "Show QRs"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={lockPortal}
            >
              <Lock className="h-3.5 w-3.5" />
              Switch code
            </Button>
          </div>
        </div>
      </div>

      {showQr && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <PortalQrCards />
        </div>
      )}

      <ClinicPortalView
        clinicName={q.data.clinic.name}
        role={q.data.role}
        requests={requests}
        details={q.data.role === "admin" ? (localDetails ?? q.data.details) : null}
        isPublicSample
        onStatusChange={async (id, status) => {
          if (id.startsWith("demo-")) {
            setSampleRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
            return;
          }
          await updateStatus({ data: { code: activeCode, id, status } });
          await qc.invalidateQueries({ queryKey: ["aura-demo-portal"] });
        }}
        onSaveDetails={
          q.data.role === "admin"
            ? async (clinic) => {
              const res = await saveDetails({ data: { code: activeCode, clinic } });
              if (q.data.localPreview) {
                setLocalDetails(res.clinic);
                return;
              }
              await qc.invalidateQueries({ queryKey: ["aura-demo-portal"] });
              await qc.invalidateQueries({ queryKey: ["aura-public-info"] });
            }
            : undefined
        }
      />
    </div>
  );
}
