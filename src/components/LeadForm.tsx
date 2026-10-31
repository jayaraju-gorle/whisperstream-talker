import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitLeadForm } from "@/lib/lead-form.functions";

export function LeadForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setState("sending");
    setError(null);
    try {
      await submitLeadForm({ data: { name: get("name"), businessType: get("businessType"), email: get("email"), phone: get("phone"), message: get("message"), website: get("website") } });
      setState("done");
    } catch {
      setError("Please check your name, business type and email, then try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return <p className="rounded-md border border-primary/40 p-4 text-sm">Thanks — we’ll get back to you using the details you shared.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5"><Label htmlFor="lf-name">Your name</Label><Input id="lf-name" name="name" required maxLength={120} /></div>
      <div className="grid gap-1.5"><Label htmlFor="lf-type">Business type</Label><Input id="lf-type" name="businessType" required maxLength={160} placeholder="e.g. dental clinic, CA firm" /></div>
      <div className="grid gap-1.5"><Label htmlFor="lf-email">Email</Label><Input id="lf-email" name="email" type="email" required maxLength={254} /></div>
      <div className="grid gap-1.5"><Label htmlFor="lf-phone">Phone (optional)</Label><Input id="lf-phone" name="phone" type="tel" maxLength={40} /></div>
      <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="lf-msg">Anything we should know? (optional)</Label><Textarea id="lf-msg" name="message" maxLength={1000} rows={2} /></div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2"><Button type="submit" loading={state === "sending"}>Get my custom AI assistant</Button></div>
    </form>
  );
}
