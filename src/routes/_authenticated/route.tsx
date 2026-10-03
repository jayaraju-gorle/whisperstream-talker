import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AudioWaveform, History, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
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
      <header className="flex items-center gap-4 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur">
        <Link to="/playground" className="flex items-center gap-2 font-semibold tracking-tight">
          <AudioWaveform className="h-5 w-5 text-primary" />
          Conversational AI Flows Studio
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/playground"
            className="rounded px-2.5 py-1 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "rounded px-2.5 py-1 bg-secondary text-foreground" }}
          >
            Playground
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "flex items-center gap-1.5 rounded px-2.5 py-1 bg-secondary text-foreground" }}
          >
            <History className="h-3.5 w-3.5" /> History
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden font-mono sm:inline">{user.email}</span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="flex items-center gap-1 rounded px-2 py-1 hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
