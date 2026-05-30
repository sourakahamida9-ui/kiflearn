export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-display font-extrabold tracking-tight ${className}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white shadow-tile">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M5 4l13 8-13 8V4z"
            fill="currentColor"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        Kif<span className="text-brand">Learn</span>
      </span>
    </span>
  );
}
