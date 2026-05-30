import type { Choice } from "@/lib/types";

type ShapeMeta = {
  key: Choice;
  bg: string;
  ring: string;
  shape: "triangle" | "diamond" | "circle" | "square";
};

export const ANSWER_META: Record<Choice, ShapeMeta> = {
  a: { key: "a", bg: "bg-ans-a", ring: "ring-blue-900/30", shape: "triangle" },
  b: { key: "b", bg: "bg-ans-b", ring: "ring-blue-600/30", shape: "diamond" },
  c: { key: "c", bg: "bg-ans-c", ring: "ring-sky-400/30", shape: "circle" },
  d: { key: "d", bg: "bg-ans-d", ring: "ring-cyan-500/30", shape: "square" },
};

function Shape({ shape }: { shape: ShapeMeta["shape"] }) {
  const common = "fill-white/90";
  switch (shape) {
    case "triangle":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M12 3l9 16H3L12 3z" className={common} />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M12 2l10 10-10 10L2 12 12 2z" className={common} />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <circle cx="12" cy="12" r="9" className={common} />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="3" className={common} />
        </svg>
      );
  }
}

export function AnswerTile({
  choice,
  label,
  onClick,
  disabled,
  state = "idle",
}: {
  choice: Choice;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  state?: "idle" | "picked" | "correct" | "wrong" | "dim";
}) {
  const meta = ANSWER_META[choice];
  const stateClass =
    state === "dim"
      ? "opacity-35 scale-[0.98]"
      : state === "correct"
        ? "ring-4 ring-white scale-[1.02] shadow-glow"
        : state === "wrong"
          ? "opacity-50"
          : state === "picked"
            ? "ring-4 ring-white/90 scale-[1.01]"
            : "hover:brightness-110 hover:scale-[1.01]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full min-h-[80px] items-center gap-4 rounded-card px-5 py-4 text-left
        text-white shadow-soft transition-all duration-200 ${meta.bg} ${meta.ring} ${stateClass}
        disabled:pointer-events-none`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black/20 backdrop-blur-sm">
        <Shape shape={meta.shape} />
      </span>
      <span className="flex-1 break-words text-lg font-semibold leading-snug">{label}</span>
    </button>
  );
}
