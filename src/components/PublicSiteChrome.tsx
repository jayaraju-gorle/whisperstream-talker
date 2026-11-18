import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function PublicSiteHeader({ current }: { current?: "web-agent" }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 shrink-0" />
          <span className="truncate text-sm sm:text-base">Conversational Flows Studio</span>
        </Link>
        <nav aria-label="Primary" className="flex shrink-0 items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/web-agent" aria-current={current === "web-agent" ? "page" : undefined}>
              Live demo
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link to={user ? "/playground" : "/auth"}>{user ? "Playground" : "Sign in"}</Link>
          </Button>
          <Button asChild size="sm" className="min-h-10">
            <a href="/#get-started">Get started</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}

const FOOTER_LINKS = [
  { to: "/whatsapp-appointment-booking", label: "WhatsApp appointment booking for clinics" },
  { to: "/web-agent", label: "Website assistant — live clinic website demo" },
  { to: "/virtual-receptionist", label: "24/7 virtual receptionist & phone answering" },
] as const;

export function PublicSiteFooter() {
  const { user } = useAuth();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-28 pt-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" />
            <p className="text-sm font-medium">Conversational Flows Studio</p>
          </div>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            A done-for-you 24/7 appointment assistant for clinics — on your phone line, WhatsApp, and website.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link to="/demo" className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
              Studio demo
            </Link>
            <Link
              to={user ? "/playground" : "/auth"}
              className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
            >
              {user ? "Playground" : "Sign in"}
            </Link>
          </div>
        </div>
        <nav aria-label="Solutions" className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Solutions</p>
          <ul className="mt-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
