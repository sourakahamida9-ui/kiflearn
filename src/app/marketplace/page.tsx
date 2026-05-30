"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import type { Quiz } from "@/lib/types";

type PublicQuiz = Quiz & { question_count: number };

export default function MarketplacePage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<PublicQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(count)")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) {
        setMsg(
          "Marketplace indisponible : exécute supabase/migrations_v2.sql dans Supabase.",
        );
        setLoading(false);
        return;
      }

      setQuizzes(
        (data ?? []).map((q: PublicQuiz & { questions?: { count: number }[] }) => ({
          ...q,
          question_count: q.questions?.[0]?.count ?? 0,
        })),
      );
      setLoading(false);
    })();
  }, []);

  async function duplicateQuiz(quiz: PublicQuiz) {
    setCopying(quiz.id);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/marketplace");
      setCopying(null);
      return;
    }

    const { data: qs } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quiz.id)
      .order("position");

    const { data: newQuiz, error } = await supabase
      .from("quizzes")
      .insert({
        title: `${quiz.title} (copie)`,
        description: quiz.description,
        creator_id: user.id,
        is_public: false,
      })
      .select("id")
      .single();

    if (error || !newQuiz) {
      setMsg(error?.message ?? "Erreur copie");
      setCopying(null);
      return;
    }

    if (qs?.length) {
      await supabase.from("questions").insert(
        qs.map((q, idx) => ({
          quiz_id: newQuiz.id,
          position: idx,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          time_limit: q.time_limit,
        })),
      );
    }

    router.push(`/dashboard/quiz/${newQuiz.id}`);
    setCopying(null);
  }

  return (
    <main className="min-h-dvh bg-mesh">
      <header className="border-b border-ink/8 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-brand">
            Mon espace
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Marketplace
        </h1>
        <p className="mt-2 text-ink/60">
          Quiz partagés par la communauté — copie-les dans ton espace.
        </p>

        {msg && (
          <p className="mt-4 rounded-xl border border-brand/20 bg-brand-light px-4 py-3 text-sm text-ink">
            {msg}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-ink/50">Chargement…</p>
        ) : quizzes.length === 0 ? (
          <div className="card mt-8 text-center">
            <p className="font-display text-lg font-bold">Aucun quiz public</p>
            <p className="mt-2 text-ink/60">
              Coche « Publier sur la marketplace » lors de la création d&apos;un quiz.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {quizzes.map((q) => (
              <div key={q.id} className="card">
                <h2 className="font-display text-xl font-bold">{q.title}</h2>
                {q.description && (
                  <p className="mt-1 line-clamp-2 text-ink/60">{q.description}</p>
                )}
                <p className="mt-2 text-sm text-ink/45">
                  {q.question_count} questions · Communauté KifLearn
                </p>
                <button
                  onClick={() => duplicateQuiz(q)}
                  disabled={copying === q.id || q.question_count === 0}
                  className="btn-brand mt-4 w-full"
                >
                  {copying === q.id ? "..." : "Copier dans mes quiz"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
