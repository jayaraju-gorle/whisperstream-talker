import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBusinessPhoneSetup } from "@/lib/business-phone.functions";

export function BusinessPhoneSetup({ businessId }: { businessId: string }) {
  const getSetup = useServerFn(getBusinessPhoneSetup);
  const [number, setNumber] = useState("");
  const setup = useQuery({ queryKey: ["business-phone-setup", businessId], queryFn: () => getSetup({ data: { businessId } }), retry: false });
  return <div className="space-y-3 border-b border-border pb-5">
    <div className="flex items-center justify-between gap-3"><h3 className="font-medium">Live call number</h3><Button variant="ghost" size="icon" aria-label="Refresh phone numbers" title="Refresh phone numbers" loading={setup.isFetching} onClick={() => void setup.refetch()}><RefreshCw className="size-4" /></Button></div>
    {setup.isPending ? <p className="text-sm text-muted-foreground">Checking phone service…</p> : setup.isError ? <p role="alert" className="text-sm text-destructive">{setup.error.message}</p> : !setup.data.connected ? <p className="text-sm text-muted-foreground">Phone service not connected.</p> : <>
      <p className="text-sm text-muted-foreground">Twilio connected · {setup.data.numbers.length ? "Voice numbers available" : "No voice-capable number available"}</p>
      {setup.data.numbers.length > 0 && <div className="space-y-2"><Label htmlFor="live-call-number">Choose a number</Label><Select value={number} onValueChange={setNumber}><SelectTrigger id="live-call-number"><SelectValue placeholder="Select a Twilio number" /></SelectTrigger><SelectContent>{setup.data.numbers.map(n => <SelectItem key={n.sid} value={n.sid}>{n.number}</SelectItem>)}</SelectContent></Select></div>}
      <Button asChild variant="outline"><a href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Manage Twilio numbers</a></Button>
      <p className="text-sm text-muted-foreground">Not ready for calls · {setup.data.numbers.length ? "Call routing is not configured." : "Add a voice-capable number in Twilio, then refresh."}</p>
      <p className="text-sm text-muted-foreground">Number rental and calls are billed by Twilio. Trial accounts may require verified callers.</p>
    </>}
  </div>;
}