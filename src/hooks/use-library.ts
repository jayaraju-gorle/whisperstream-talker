import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CustomScenario, KnowledgeBase } from "@/lib/library";
import { builtInKnowledge } from "@/lib/library";

export const LIBRARY_KEY = ["library"] as const;

export function useLibrary(enabled = true) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: LIBRARY_KEY,
    enabled,
    queryFn: async () => {
      const [s, k] = await Promise.all([
        supabase.from("custom_scenarios").select("id,label,prompt,sample,kb_ids").order("created_at"),
        supabase.from("knowledge_bases").select("id,name,content").order("created_at"),
      ]);
      if (s.error) throw s.error;
      if (k.error) throw k.error;
      return { scenarios: (s.data ?? []) as CustomScenario[], kbs: [...builtInKnowledge, ...((k.data ?? []) as KnowledgeBase[])] };
    },
  });
  return {
    scenarios: q.data?.scenarios ?? [],
    kbs: q.data?.kbs ?? builtInKnowledge,
    loading: q.isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: LIBRARY_KEY }),
  };
}
