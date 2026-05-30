"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/TopBar";
import type { Quiz } from "@/lib/types";

type QuizWithCount = Quiz & { question_count: number };

export default function Dashboard() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);

  useEffect(() => {
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
      setName(profile?.name ?? user.email ?? null);

      const { data } = await supabase
        .from("quizzes")
        .select("*, questions(count)")
        .order("created_at", { ascending: false });

      const mapped: QuizWithCount[] = (data ?? []).map((q: any) => ({
        ...q,
        question_count: q.questions?.[0]?.count ?? 0,
      }));
      setQuizzes(mapped);
      setLoading(false);
    })();
  }, [router]);

  async function launch(quizId: string) {
    setLaunching(quizId);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_session", {
      p_quiz_id: quizId,
    });
    if (error || !data) {
      alert("Impossible de lancer la session : " + (error?.message ?? ""));
      setLaunching(null);
      return;
    }
    const session = Array.isArray(data) ? data[0] : data;
    router.push(`/host/${session.id}`);
  }

  return (
    <main className="min-h-dvh bg-paper">
      <TopBar name={name} />

      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Mes quiz
          </h1>
          <Link href="/dashboard/quiz/new" className="btn-brand">
            + Nouveau quiz
          </Link>
        </div>

        {loading ? (
          <p className="mt-10 text-ink/50">Chargement…</p>
        ) : quizzes.length === 0 ? (
          <div className="card mt-8 text-center">
            <p className="font-display text-xl font-bold text-ink">
              Aucun quiz pour l&apos;instant
            </p>
            <p className="mt-2 text-ink/60">
              Crée ton premier quiz pour lancer une session live.
            </p>
            <Link href="/dashboard/quiz/new" className="btn-brand mt-5">
              Créer un quiz
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {quizzes.map((q) => (
              <div key={q.id} className="card flex flex-col">
                <h2 className="font-display text-xl font-bold text-ink">
                  {q.title}
                </h2>
                {q.description && (
                  <p className="mt-1 line-clamp-2 text-ink/60">
                    {q.description}
                  </p>
                )}
                <p className="mt-2 text-sm text-ink/45">
                  {q.question_count} question
                  {q.question_count > 1 ? "s" : ""}
                </p>
                <div className="mt-5 flex gap-2 pt-1">
                  <button
                    onClick={() => launch(q.id)}
                    disabled={q.question_count === 0 || launching === q.id}
                    className="btn-brand flex-1 py-3 text-base"
                  >
                    {launching === q.id ? "..." : "▶ Lancer"}
                  </button>
                  <Link
                    href={`/dashboard/quiz/${q.id}`}
                    className="btn-outline px-4 py-3 text-base"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
