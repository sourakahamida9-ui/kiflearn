"use client";

import { BADGES, getEarnedBadges, type BadgeId } from "@/lib/badges";

export function BadgeList({ earned }: { earned?: BadgeId[] }) {
  const ids = earned ?? getEarnedBadges();
  const set = new Set(ids);

  return (
    <div className="flex flex-wrap gap-2">
      {BADGES.map((b) => {
        const on = set.has(b.id);
        return (
          <div
            key={b.id}
            title={b.description}
            className={`rounded-2xl border-2 px-3 py-2 text-sm ${
              on
                ? "border-brand/30 bg-brand/10 text-ink"
                : "border-ink/8 bg-ink/5 text-ink/35 grayscale"
            }`}
          >
            <span className="mr-1">{b.emoji}</span>
            <span className="font-semibold">{b.title}</span>
          </div>
        );
      })}
    </div>
  );
}
