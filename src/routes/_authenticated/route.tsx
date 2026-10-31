import { CurrencySelect } from "@/components/CurrencySelect";
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Building2, Home, History, Inbox, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  staticData: { sitemap: "exclude-subtree" },
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname } });
    return { user: data.session.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  const { data: newLeads = 0 } = useQuery({
    queryKey: ["leads", "new-count"],
    enabled: isAdmin,
    refetchInterval: 60000,
    queryFn: async () => {
      const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new");
      return count ?? 0;
    },
  });
  return (
    <div className="flex min-h-screen flex-col">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur">
        <Link to="/" className="col-span-2 flex min-w-0 items-center gap-2 font-semibold xl:col-span-1">
          <Logo className="h-6 w-6 shrink-0" />
          <span>Conversational Flows Studio</span>
        </Link>
        <nav className="col-span-2 flex min-w-0 flex-wrap items-center gap-1 text-sm sm:col-span-1">
          <Button asChild variant="ghost" size="sm"><Link to="/"><Home className="h-3.5 w-3.5" /> Home</Link></Button>
          <Link
            to="/playground"
            className="rounded px-2.5 py-2.5 sm:py-1 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "rounded px-2.5 py-2.5 sm:py-1 bg-secondary text-foreground" }}
          >
            Playground
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 bg-secondary text-foreground" }}
          >
            <History className="h-3.5 w-3.5" /> History
          </Link>
          <Link
            to="/library"
            className="flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 bg-secondary text-foreground" }}
          >
            <BookOpen className="h-3.5 w-3.5" /> Library
          </Link>
          {isAdmin && (
            <Link
              to="/clinics"
              className="flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 bg-secondary text-foreground" }}
            >
              <Building2 className="h-3.5 w-3.5" /> Businesses
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/leads"
              className="flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "flex items-center gap-1.5 rounded px-2.5 py-2.5 sm:py-1 bg-secondary text-foreground" }}
            >
               <Inbox className="h-3.5 w-3.5" /> Assistant
              {newLeads > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{newLeads}</span>
              )}
            </Link>
          )}
        </nav>
        <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-end gap-3 text-xs sm:col-span-1 text-muted-foreground">
          <CurrencySelect />
          <span className="hidden max-w-52 truncate font-mono lg:inline">{user.email}</span>
          <Button variant="ghost" size="sm"
            loading={signingOut} loadingLabel="Signing out…"
            onClick={async () => {
              setSigningOut(true);
              try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                await navigate({ to: "/auth" });
              } catch {
                toast.error("Couldn't sign out. Please try again.");
              } finally {
                setSigningOut(false);
              }
            }}
            className="flex items-center gap-1 rounded px-2 py-1 hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
