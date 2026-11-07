import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function PublicSiteHeader({ current }: { current?: "clinics" }) {
  const { user } = useAuth();
  return (
    <header className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-6">
      <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
        <Logo className="h-6 w-6 shrink-0" />
        <span className="truncate">Conversational Flows Studio</span>
      </Link>
      <nav aria-label="Primary" className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link
            to="/whatsapp-appointment-booking"
            aria-current={current === "clinics" ? "page" : undefined}
            className="min-h-11"
          >
            For clinics
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to={user ? "/playground" : "/auth"} className="min-h-11">
            {user ? "Playground" : "Sign in"}
          </Link>
        </Button>
      </nav>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 pt-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-medium">Conversational Flows Studio</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Done-for-you 24/7 assistant across phone, WhatsApp, and web.
          </p>
        </div>
        <nav aria-label="Solutions" className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Solutions</p>
          <ul className="mt-2">
            <li>
              <Link
                to="/whatsapp-appointment-booking"
                className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                WhatsApp appointment booking for clinics
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
