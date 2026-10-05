import { useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, isCurrency, type CurrencyCode } from "@/lib/currency";

// Shared store: one rates fetch per page load; the choice is saved to the
// signed-in user's profile (preferences.currency), else kept in this browser.
type State = { code: CurrencyCode; rates: Record<string, number> };
let state: State = { code: "USD", rates: { USD: 1 } };
let started = false;
const listeners = new Set<() => void>();
const set = (p: Partial<State>) => {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
};

async function init() {
  if (started || typeof window === "undefined") return;
  started = true;
  let suggested: CurrencyCode = "USD";
  try {
    const r = await fetch("/api/public/rates");
    const j = (await r.json()) as { rates: Record<string, number>; suggested: string };
    set({ rates: j.rates });
    if (isCurrency(j.suggested)) suggested = j.suggested;
  } catch {
    /* USD only */
  }
  const local = localStorage.getItem("currency");
  let chosen: CurrencyCode | null = isCurrency(local) ? local : null;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (uid) {
    const { data: p } = await supabase.from("profiles").select("preferences").eq("user_id", uid).maybeSingle();
    const saved = (p?.preferences as Record<string, unknown> | null)?.["currency"];
    if (isCurrency(saved)) chosen = saved;
  }
  set({ code: chosen ?? suggested });
}

export async function saveCurrency(code: CurrencyCode) {
  set({ code });
  localStorage.setItem("currency", code);
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const { data: p } = await supabase.from("profiles").select("preferences").eq("user_id", uid).maybeSingle();
  const prefs = { ...((p?.preferences as Record<string, unknown> | null) ?? {}), currency: code };
  await supabase.from("profiles").upsert({ user_id: uid, preferences: prefs }, { onConflict: "user_id" });
}

export function useCurrency() {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void init();
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  const fmt = useCallback((usd: number) => formatMoney(usd, s.code, s.rates), [s]);
  return { code: s.code, rates: s.rates, fmt, setCode: saveCurrency };
}
