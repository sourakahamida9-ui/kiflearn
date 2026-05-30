import type { Choice } from "@/lib/types";

export type ConceptStat = {
  questionId: string;
  questionText: string;
  quizTitle: string;
  totalAnswers: number;
  wrongRate: number;
  topWrongChoice: Choice | null;
};

export type ProgressPoint = {
  label: string;
  sessions: number;
  avgScore: number;
};

export type AnalyticsSummary = {
  totalSessions: number;
  totalAnswers: number;
  concepts: ConceptStat[];
  progress: ProgressPoint[];
};

type RawAnswer = {
  question_id: string;
  answer: Choice | null;
  is_correct: boolean;
  points: number;
  created_at: string;
  questions: { question: string; quiz_id: string } | null;
  sessions: { created_at: string; quiz_id: string } | null;
};

type RawQuiz = { id: string; title: string };

export function buildAnalytics(
  answers: RawAnswer[],
  quizzes: RawQuiz[],
): AnalyticsSummary {
  const quizMap = new Map(quizzes.map((q) => [q.id, q.title]));
  const byQuestion = new Map<
    string,
    {
      text: string;
      quizId: string;
      total: number;
      wrong: number;
      wrongChoices: Record<string, number>;
    }
  >();

  for (const a of answers) {
    const qid = a.question_id;
    const text = a.questions?.question ?? "Question";
    const quizId = a.questions?.quiz_id ?? "";
    const cur = byQuestion.get(qid) ?? {
      text,
      quizId,
      total: 0,
      wrong: 0,
      wrongChoices: {},
    };
    cur.total += 1;
    if (!a.is_correct) {
      cur.wrong += 1;
      if (a.answer) {
        cur.wrongChoices[a.answer] = (cur.wrongChoices[a.answer] ?? 0) + 1;
      }
    }
    byQuestion.set(qid, cur);
  }

  const concepts: ConceptStat[] = [...byQuestion.entries()]
    .map(([questionId, v]) => {
      const top = Object.entries(v.wrongChoices).sort((a, b) => b[1] - a[1])[0];
      return {
        questionId,
        questionText: v.text,
        quizTitle: quizMap.get(v.quizId) ?? "Quiz",
        totalAnswers: v.total,
        wrongRate: v.total ? Math.round((v.wrong / v.total) * 100) : 0,
        topWrongChoice: (top?.[0] as Choice) ?? null,
      };
    })
    .filter((c) => c.totalAnswers >= 2)
    .sort((a, b) => b.wrongRate - a.wrongRate)
    .slice(0, 12);

  const sessionScores = new Map<string, { total: number; count: number; at: string }>();
  for (const a of answers) {
    const sid = a.sessions?.created_at;
    if (!sid) continue;
    const week = weekLabel(new Date(a.created_at));
    const cur = sessionScores.get(week) ?? { total: 0, count: 0, at: week };
    cur.total += a.points;
    cur.count += 1;
    sessionScores.set(week, cur);
  }

  const progress: ProgressPoint[] = [...sessionScores.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([label, v]) => ({
      label,
      sessions: Math.ceil(v.count / Math.max(1, v.count / 3)),
      avgScore: v.count ? Math.round(v.total / v.count) : 0,
    }));

  const sessionIds = new Set(
    answers.map((a) => a.sessions?.created_at).filter(Boolean),
  );

  return {
    totalSessions: sessionIds.size,
    totalAnswers: answers.length,
    concepts,
    progress,
  };
}

function weekLabel(d: Date): string {
  const one = new Date(d);
  one.setHours(0, 0, 0, 0);
  one.setDate(one.getDate() - one.getDay() + 1);
  return one.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
