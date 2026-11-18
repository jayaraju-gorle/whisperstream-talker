import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { ClinicPortalView, type PortalRequest } from "@/components/clinic/ClinicPortalView";
import { Button } from "@/components/ui/button";
import { getAuraDemoPortal, saveAuraDemoClinic, setAuraDemoStatus } from "@/lib/portal.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aura-portal")({
  staticData: { sitemap: false },
  ssr: false,
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

function AuraPortalDemo() {
  const [role, setRole] = useState<"admin" | "staff">("admin");
  const [sampleRequests, setSampleRequests] = useState<PortalRequest[]>(SAMPLE_DEMO_REQUESTS);
  const [localDetails, setLocalDetails] = useState<
    Awaited<ReturnType<typeof load>>["details"] | null
  >(null);
  const load = useServerFn(getAuraDemoPortal);
  const updateStatus = useServerFn(setAuraDemoStatus);
  const saveDetails = useServerFn(saveAuraDemoClinic);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["aura-demo-portal"],
    queryFn: () => load(),
    refetchInterval: 20000,
    retry: false,
  });

  if (q.isLoading) {
    return (
      <main className="p-6">
        <LoadingIndicator />
      </main>
    );
  }
  if (q.isError || !q.data) {
    return (
      <main className="mx-auto max-w-md p-6 text-center text-sm text-destructive">
        Couldn&apos;t load the Aura Health Clinic portal demo.
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
            Fictional Aura Clinic Demo · Switch roles below
          </span>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>

      <ClinicPortalView
        clinicName={q.data.clinic.name}
        role={role}
        requests={requests}
        details={role === "admin" ? (localDetails ?? q.data.details) : null}
        isPublicSample
        headerExtra={
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Demo role switcher
            </p>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-background p-1 text-xs">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 font-medium transition-colors",
                  role === "admin"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Chief Dr / Manager</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("staff")}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 font-medium transition-colors",
                  role === "staff"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Support Staff</span>
              </button>
            </div>
          </div>
        }
        onStatusChange={async (id, status) => {
          if (id.startsWith("demo-")) {
            setSampleRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
            return;
          }
          await updateStatus({ data: { id, status } });
          await qc.invalidateQueries({ queryKey: ["aura-demo-portal"] });
        }}
        onSaveDetails={async (clinic) => {
          const res = await saveDetails({ data: { clinic } });
          if (q.data.localPreview) {
            setLocalDetails(res.clinic);
            return;
          }
          await qc.invalidateQueries({ queryKey: ["aura-demo-portal"] });
        }}
      />
    </div>
  );
}
