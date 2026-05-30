export type BadgeId =
  | "first_quiz"
  | "quiz_master"
  | "live_host"
  | "marketplace"
  | "analyst"
  | "offline_ready";

export type Badge = {
  id: BadgeId;
  emoji: string;
  title: string;
  description: string;
};

export const BADGES: Badge[] = [
  {
    id: "first_quiz",
    emoji: "🌱",
    title: "Premier quiz",
    description: "Tu as créé ton premier quiz.",
  },
  {
    id: "quiz_master",
    emoji: "📚",
    title: "Maître des quiz",
    description: "5 quiz ou plus dans ton espace.",
  },
  {
    id: "live_host",
    emoji: "🎤",
    title: "Animateur live",
    description: "Tu as lancé au moins 3 sessions.",
  },
  {
    id: "marketplace",
    emoji: "🛒",
    title: "Contributeur",
    description: "Un quiz partagé sur la marketplace.",
  },
  {
    id: "analyst",
    emoji: "📊",
    title: "Data teacher",
    description: "Tu as consulté tes analytics.",
  },
  {
    id: "offline_ready",
    emoji: "📴",
    title: "Mode hors-ligne",
    description: "Questions mises en cache sur cet appareil.",
  },
];

const STORAGE = "kiflearn:badges";

export function getEarnedBadges(): BadgeId[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE) ?? "[]") as BadgeId[];
  } catch {
    return [];
  }
}

export function earnBadge(id: BadgeId): void {
  const current = getEarnedBadges();
  if (current.includes(id)) return;
  localStorage.setItem(STORAGE, JSON.stringify([...current, id]));
}

export function computeBadges(stats: {
  quizCount: number;
  sessionCount: number;
  publicQuizCount: number;
  viewedAnalytics?: boolean;
  offlineCached?: boolean;
}): BadgeId[] {
  const earned: BadgeId[] = [];
  if (stats.quizCount >= 1) earned.push("first_quiz");
  if (stats.quizCount >= 5) earned.push("quiz_master");
  if (stats.sessionCount >= 3) earned.push("live_host");
  if (stats.publicQuizCount >= 1) earned.push("marketplace");
  if (stats.viewedAnalytics) earned.push("analyst");
  if (stats.offlineCached) earned.push("offline_ready");
  earned.forEach(earnBadge);
  return [...new Set([...getEarnedBadges(), ...earned])];
}
