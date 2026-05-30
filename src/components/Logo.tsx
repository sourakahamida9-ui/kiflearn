export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-display font-bold tracking-tight ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white shadow-glow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 4l13 8-13 8V4z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-ink">
        Kif<span className="text-brand">Learn</span>
      </span>
    </span>
  );
}
