import { supabase } from "@/integrations/supabase/client";

export async function fetchPlaygroundSessions() {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,title,mode,compare,created_at,turns(metrics)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}