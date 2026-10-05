import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: z.object({ next: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Conversational AI Flows Studio" },
      { name: "description", content: "Sign in to save voice agent sessions, metrics and comparisons." },
      { property: "og:title", content: "Sign in — Conversational AI Flows Studio" },
      { property: "og:description", content: "Sign in to save voice agent sessions, metrics and comparisons." },
    ],
  }),
  component: AuthPage,
});

function safeNext(n?: string) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/playground";
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let navigating = false;
    async function onSignedIn() {
      if (navigating) return;
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      navigating = true;
      // Profile creation is idempotent, including for accounts created before profiles existed.
      await supabase.from("profiles").upsert({ user_id: data.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
      if (active) navigate({ to: safeNext(next) });
    }
    void onSignedIn();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void onSignedIn();
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [next, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${safeNext(next)}` },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl">
        <Button asChild variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="Close sign in and return home">
          <Link to="/"><X /></Link>
        </Button>
        <Link to="/" className="mb-6 flex items-center gap-2 font-semibold">
          <Logo className="h-7 w-7" /> Conversational AI Flows Studio
        </Link>
        <h1 className="text-xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your sessions and metrics are saved to your account.</p>
        <Button variant="outline" className="mt-5 w-full" onClick={google} type="button">
          Continue with Google
        </Button>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" disabled={busy}>
            {mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <Button
          variant="link" type="button" className="mt-4 w-full text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "No account? Create one" : "Already have an account? Sign in"}
        </Button>
        <div className="mt-4 border-t border-border pt-4">
          <Button asChild variant="outline" className="w-full"><Link to="/demo">Continue as guest</Link></Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Explore a sample. Sign in for live tests and saved sessions.</p>
        </div>
      </div>
    </div>
  );
}
