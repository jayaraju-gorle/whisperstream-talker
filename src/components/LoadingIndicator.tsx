import { LoaderCircle } from "lucide-react";
import { useIsFetching } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

export function LoadingIndicator({ label = "Loading…" }: { label?: string }) {
  return <span role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" />{label}</span>;
}

export function RouteProgress() {
  const navigating = useRouterState({ select: (state) => state.isLoading || state.status === "pending" });
  const fetching = useIsFetching({ predicate: (query) => query.state.data === undefined });
  if (!navigating && fetching === 0) return null;
  return (
    <div role="status" aria-label="Loading page" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/20">
      <div className="route-progress h-full w-1/3 bg-primary" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}