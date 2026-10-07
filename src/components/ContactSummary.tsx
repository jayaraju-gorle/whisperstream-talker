import { useId, useState } from "react";
import { Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contactDetails, type ContactDetails } from "@/lib/assistant-contact";

const fields = [
  ["name", "Name"], ["email", "Email"], ["phone", "Phone"],
  ["company", "Company"], ["interest", "What you need"],
] as const;

export function ContactSummary({ details, editable, busy, onUpdate }: {
  details: ContactDetails; editable: boolean; busy: boolean;
  onUpdate: (details: ContactDetails) => void;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(details);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3 text-sm">
      <p>We’ll get back to you using the contact details you’ve shared.</p>
      {editing ? (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const valid = contactDetails(draft);
          if (!valid) { setError("Please enter your name and a valid email address."); return; }
          onUpdate(valid);
          setEditing(false);
        }}>
          {fields.map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`${id}-${key}`}>{label}{key === "phone" ? " (optional)" : ""}</Label>
              <Input id={`${id}-${key}`} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                autoFocus={key === "name"} required={key === "name" || key === "email"}
                maxLength={key === "interest" ? 2000 : key === "name" ? 120 : key === "email" ? 254 : key === "phone" ? 40 : 160}
                value={draft[key] || ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
            </div>
          ))}
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}><Save /> Update details</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <>
          <dl className="space-y-2">
            {fields.map(([key, label]) => details[key] ? (
              <div key={key} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="break-words">{details[key]}</dd>
              </div>
            ) : null)}
          </dl>
          {editable && <Button variant="outline" size="sm" disabled={busy} onClick={() => { setDraft(details); setError(""); setEditing(true); }}>
            <Pencil /> Update details
          </Button>}
        </>
      )}
    </div>
  );
}