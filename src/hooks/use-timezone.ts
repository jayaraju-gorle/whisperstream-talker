import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TIMEZONE, formatTimestamp, validTimezone } from "@/lib/timezone";
import { toast } from "sonner";

export function useTimezone() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const preference = useQuery({ queryKey: ["assistant-timezone"], queryFn: async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return DEFAULT_TIMEZONE;
    const { data, error } = await supabase.from("profiles").select("preferences").eq("user_id", auth.session.user.id).maybeSingle();
    if (error) throw error;
    const saved = (data?.preferences as Record<string, unknown> | null )?.["timezone"];
    return validTimezone(saved) ? saved : DEFAULT_TIMEZONE;
  } });
  const zone = preference.data ?? DEFAULT_TIMEZONE;
  useEffect(() => { if (preference.isError) toast.error("Couldn't load your timezone; showing IST."); }, [preference.isError]);
  async function setZone(timezone: string) {
    if (!validTimezone(timezone)) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) throw new Error("Sign in required");
      const user_id = auth.session.user.id;
      const { data, error } = await supabase.from("profiles").select("preferences").eq("user_id", user_id).maybeSingle();
      if (error) throw error;
      const preferences = { ...((data?.preferences as Record<string, unknown> | null) ?? {}), timezone };
      const { error: saveError } = await supabase.from("profiles").upsert({ user_id, preferences: preferences as never }, { onConflict: "user_id" });
      if (saveError) throw saveError;
      qc.setQueryData(["assistant-timezone"], timezone);
    } catch { toast.error("Couldn't save your timezone."); }
    finally { setSaving(false); }
  }
  return { zone, setZone, saving, format: (value: string) => formatTimestamp(value, zone) };
}