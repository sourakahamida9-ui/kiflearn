import type { Choice } from "@/lib/types";

type ShapeMeta = {
  key: Choice;
  bg: string;
  shape: "triangle" | "diamond" | "circle" | "square";
};

export const ANSWER_META: Record<Choice, ShapeMeta> = {
  a: { key: "a", bg: "bg-ans-a", shape: "triangle" },
  b: { key: "b", bg: "bg-ans-b", shape: "diamond" },
  c: { key: "c", bg: "bg-ans-c", shape: "circle" },
  d: { key: "d", bg: "bg-ans-d", shape: "square" },
};

function Shape({ shape }: { shape: ShapeMeta["shape"] }) {
  const common = "fill-white/95";
  switch (shape) {
    case "triangle":
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <path d="M12 3l9 16H3L12 3z" className={common} />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <path d="M12 2l10 10-10 10L2 12 12 2z" className={common} />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
          <circle cx="12" cy="12" r="9" className={common} />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
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
  // idle = jouable, picked = choisi, correct/wrong = révélé, dim = atténué
  state?: "idle" | "picked" | "correct" | "wrong" | "dim";
}) {
  const meta = ANSWER_META[choice];
  const stateClass =
    state === "dim"
      ? "opacity-30"
      : state === "correct"
        ? "ring-4 ring-white scale-[1.02]"
        : state === "wrong"
          ? "opacity-50 grayscale"
          : state === "picked"
            ? "ring-4 ring-white/80"
            : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn ${meta.bg} text-white shadow-tile w-full min-h-[88px] justify-start text-left
        text-xl leading-snug ${stateClass}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15">
        <Shape shape={meta.shape} />
      </span>
      <span className="flex-1 break-words font-semibold">{label}</span>
    </button>
  );
}
