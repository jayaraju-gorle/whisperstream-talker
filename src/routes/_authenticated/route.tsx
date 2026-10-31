import { CurrencySelect } from "@/components/CurrencySelect";
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Building2, Home, Inbox, LogOut, Menu, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const signOut = async () => {
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
  };
  const navLinks = (onNavigate?: () => void, stacked = false) => {
    const base = stacked
      ? "flex items-center gap-2 rounded px-3 py-2.5 text-muted-foreground hover:text-foreground"
      : "flex items-center gap-1.5 rounded px-2.5 py-1 text-muted-foreground hover:text-foreground";
    const active = stacked
      ? "flex items-center gap-2 rounded px-3 py-2.5 bg-secondary text-foreground"
      : "flex items-center gap-1.5 rounded px-2.5 py-1 bg-secondary text-foreground";
    return (
      <>
        <Link to="/" onClick={onNavigate} className={base} activeProps={{ className: active }}>
          <Home className="h-3.5 w-3.5 shrink-0" /> Home
        </Link>
        <Link to="/playground" onClick={onNavigate} className={base} activeProps={{ className: active }}>
          Playground
        </Link>
        <Link to="/library" onClick={onNavigate} className={base} activeProps={{ className: active }}>
          <BookOpen className="h-3.5 w-3.5 shrink-0" /> Library
        </Link>
        {isAdmin && (
          <Link to="/clinics" onClick={onNavigate} className={base} activeProps={{ className: active }}>
            <Building2 className="h-3.5 w-3.5 shrink-0" /> Businesses
          </Link>
        )}
        {isAdmin && (
          <Link to="/leads" onClick={onNavigate} className={base} activeProps={{ className: active }}>
            <Inbox className="h-3.5 w-3.5 shrink-0" /> Assistant
            {newLeads > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{newLeads}</span>
            )}
          </Link>
        )}
      </>
    );
  };
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold" onClick={closeMenu}>
            <Logo className="h-6 w-6 shrink-0" />
            <span className="truncate">Conversational Flows Studio</span>
          </Link>
          <nav className="ml-4 hidden min-w-0 items-center gap-1 text-sm md:flex">{navLinks()}</nav>
          <div className="ml-auto hidden items-center gap-3 text-xs text-muted-foreground md:flex">
            <CurrencySelect />
            <span className="hidden max-w-52 truncate font-mono lg:inline" title={user.email ?? undefined}>{user.email}</span>
            <Button variant="ghost" size="sm" loading={signingOut} loadingLabel="Signing out…" onClick={signOut}
              className="flex items-center gap-1 rounded px-2 py-1 hover:bg-secondary hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
          <button
            type="button"
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-border px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1 text-sm">{navLinks(closeMenu, true)}</nav>
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <CurrencySelect />
              <span className="truncate font-mono" title={user.email ?? undefined}>{user.email}</span>
              <Button variant="ghost" size="sm" loading={signingOut} loadingLabel="Signing out…" onClick={signOut}
                className="flex w-fit items-center gap-1 rounded px-2 py-1 hover:bg-secondary hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}
