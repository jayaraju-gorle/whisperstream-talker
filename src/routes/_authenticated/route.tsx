import { CurrencySelect } from "@/components/CurrencySelect";
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

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
  return (
    <div className="flex min-h-screen flex-col">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur">
        <Link to="/playground" className="col-span-2 flex min-w-0 items-center gap-2 font-semibold xl:col-span-1">
          <Logo className="h-6 w-6 shrink-0" />
          <span>Conversational AI Flows Studio</span>
        </Link>
        <nav className="col-span-2 flex min-w-0 items-center gap-1 text-sm sm:col-span-1">
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
        </nav>
        <div className="col-span-2 flex min-w-0 items-center justify-end gap-3 text-xs sm:col-span-1 text-muted-foreground">
          <CurrencySelect />
          <span className="hidden max-w-52 truncate font-mono lg:inline">{user.email}</span>
          <Button variant="ghost" size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
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
