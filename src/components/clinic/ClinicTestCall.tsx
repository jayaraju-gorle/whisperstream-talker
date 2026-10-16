import { Link } from "@tanstack/react-router";
import { MessageCircle, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testCommand } from "@/lib/clinic";

const WHATSAPP_NUMBER = "916302392274";

export function ClinicTestCall({ clinicId, code }: { clinicId: string; code: string }) {
  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(testCommand(code))}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 font-medium"><Mic className="h-4 w-4 text-primary" /> Browser voice call</div>
        <p className="mt-1 text-sm text-muted-foreground">Talk to the receptionist as a patient. Each call is saved to this clinic's history with cost and speed.</p>
        <Button asChild className="mt-3 w-full">
          <Link to="/playground" search={{ clinic: clinicId }}>Try voice call</Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 font-medium"><MessageCircle className="h-4 w-4 text-primary" /> WhatsApp</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Send <span className="font-mono text-foreground">{testCommand(code)}</span> to +91 63023 92274. Send <span className="font-mono text-foreground">EXIT</span> to go back to Flo.
        </p>
        <Button asChild variant="secondary" className="mt-3 w-full">
          <a href={wa} target="_blank" rel="noreferrer">Open WhatsApp</a>
        </Button>
      </div>
    </div>
  );
}
