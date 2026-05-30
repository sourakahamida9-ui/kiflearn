"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/TopBar";
import { BadgeList } from "@/components/BadgeList";
import { buildAnalytics, type AnalyticsSummary } from "@/lib/analytics";
import { computeBadges, earnBadge } from "@/lib/badges";

export default function AnalyticsPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    earnBadge("analyst");
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      setName(profile?.name ?? null);

      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("creator_id", user.id);

      const { data: sessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("host_id", user.id);

      const sessionIds = (sessions ?? []).map((s) => s.id);
      let answers: Parameters<typeof buildAnalytics>[0] = [];

      if (sessionIds.length > 0) {
        const { data: ans } = await supabase
          .from("answers")
          .select(
            "question_id, answer, is_correct, points, created_at, questions(question, quiz_id), sessions(created_at, quiz_id)",
          )
          .in("session_id", sessionIds);
        answers = (ans ?? []) as unknown as Parameters<typeof buildAnalytics>[0];
      }

      setSummary(buildAnalytics(answers, quizzes ?? []));
      computeBadges({
        quizCount: quizzes?.length ?? 0,
        sessionCount: sessions?.length ?? 0,
        publicQuizCount: 0,
        viewedAnalytics: true,
      });
      setLoading(false);
    })();
  }, [router]);

  return (
    <main className="min-h-dvh bg-mesh">
      <TopBar name={name} />
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/dashboard" className="text-sm text-ink/50 hover:text-ink">
          ← Mes quiz
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">
          Analytics
        </h1>
        <p className="mt-1 text-ink/60">
          Concepts mal compris et progression dans le temps.
        </p>

        {loading ? (
          <p className="mt-10 text-ink/50">Chargement…</p>
        ) : !summary || summary.totalAnswers === 0 ? (
          <div className="card mt-8 text-center">
            <p className="font-display text-lg font-bold">Pas encore de données</p>
            <p className="mt-2 text-ink/60">
              Lance une session live pour remplir ce tableau de bord.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="card text-center">
                <p className="text-3xl font-display font-extrabold text-brand">
                  {summary.totalSessions}
                </p>
                <p className="text-sm text-ink/55">Sessions</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-display font-extrabold text-brand">
                  {summary.totalAnswers}
                </p>
                <p className="text-sm text-ink/55">Réponses</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-display font-extrabold text-brand">
                  {summary.concepts[0]?.wrongRate ?? 0}%
                </p>
                <p className="text-sm text-ink/55">Taux d&apos;erreur max</p>
              </div>
            </div>

            <section className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink">
                Concepts mal compris
              </h2>
              <div className="mt-4 space-y-3">
                {summary.concepts.map((c) => (
                  <div key={c.questionId} className="card">
                    <p className="text-xs font-semibold uppercase text-ink/45">
                      {c.quizTitle}
                    </p>
                    <p className="mt-1 font-semibold text-ink">{c.questionText}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full rounded-full bg-brand-deep"
                          style={{ width: `${c.wrongRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-brand-deep">
                        {c.wrongRate}% erreurs
                      </span>
                    </div>
                    {c.topWrongChoice && (
                      <p className="mt-2 text-xs text-ink/50">
                        Réponse piège la plus choisie : option {c.topWrongChoice.toUpperCase()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {summary.progress.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-xl font-bold text-ink">
                  Progression (par semaine)
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {summary.progress.map((p) => (
                    <div key={p.label} className="card text-center">
                      <p className="text-xs text-ink/45">{p.label}</p>
                      <p className="mt-1 font-display text-2xl font-bold text-ink">
                        {p.avgScore}
                      </p>
                      <p className="text-xs text-ink/50">pts moy. / réponse</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-ink">Tes badges</h2>
          <div className="mt-4">
            <BadgeList />
          </div>
        </section>
      </div>
    </main>
  );
}
