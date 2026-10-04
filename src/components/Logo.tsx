import { useId } from "react";

/**
 * App logo: speech bubble with sound waves in the brand gradient.
 * Matches public/favicon.svg exactly; rendered inline so it stays crisp
 * and theme-independent at any size.
 */
export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  const rawId = useId();
  const gid = `lg-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0b1118" />
      <path
        d="M14 14h36a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H28l-10 8v-8h-4a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <g stroke={`url(#${gid})`} strokeWidth="4" strokeLinecap="round">
        <line x1="20" y1="27" x2="20" y2="33" />
        <line x1="27" y1="22" x2="27" y2="38" />
        <line x1="34" y1="25" x2="34" y2="35" />
        <line x1="41" y1="20" x2="41" y2="40" />
        <line x1="48" y1="27" x2="48" y2="33" />
      </g>
    </svg>
  );
}
