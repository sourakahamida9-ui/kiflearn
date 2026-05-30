"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/TopBar";
import { ANSWER_META } from "@/components/AnswerTile";
import { CHOICES, optionOf, type Choice } from "@/lib/types";

type Draft = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: Choice;
  time_limit: number;
};

function blank(): Draft {
  return {
    id: crypto.randomUUID(),
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "a",
    time_limit: 20,
  };
}

export function QuizEditor({ quizId }: { quizId?: string }) {
  const router = useRouter();
  const isEdit = !!quizId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Draft[]>([blank()]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const supabase = createClient();
    (async () => {
      const { data: quiz } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();
      if (quiz) {
        setTitle(quiz.title);
        setDescription(quiz.description ?? "");
      }
      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("position");
      if (qs && qs.length) {
        const drafts: Draft[] = qs.map((q: any) => ({
          id: q.id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c ?? "",
          option_d: q.option_d ?? "",
          correct_answer: q.correct_answer,
          time_limit: q.time_limit,
        }));
        setQuestions(drafts);
        setOriginalIds(drafts.map((d) => d.id));
      }
      setLoading(false);
    })();
  }, [isEdit, quizId]);

  function update(i: number, patch: Partial<Draft>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function setOption(i: number, c: Choice, value: string) {
    const patch: Partial<Draft> =
      c === "a"
        ? { option_a: value }
        : c === "b"
          ? { option_b: value }
          : c === "c"
            ? { option_c: value }
            : { option_d: value };
    update(i, patch);
  }

  async function save() {
    if (!title.trim()) return alert("Donne un titre au quiz.");
    const valid = questions.filter(
      (q) => q.question.trim() && q.option_a.trim() && q.option_b.trim(),
    );
    if (valid.length === 0)
      return alert("Ajoute au moins une question avec 2 options.");

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let id = quizId;
    if (isEdit) {
      await supabase
        .from("quizzes")
        .update({ title: title.trim(), description: description.trim() || null })
        .eq("id", quizId);
    } else {
      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          creator_id: user.id,
        })
        .select("id")
        .single();
      if (error || !data) {
        alert("Erreur : " + (error?.message ?? ""));
        setSaving(false);
        return;
      }
      id = data.id;
    }

    const rows = valid.map((q, idx) => ({
      id: q.id,
      quiz_id: id,
      position: idx,
      question: q.question.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim() || null,
      option_d: q.option_d.trim() || null,
      correct_answer: q.correct_answer,
      time_limit: q.time_limit,
    }));

    const { error: upErr } = await supabase.from("questions").upsert(rows);
    if (upErr) {
      alert("Erreur questions : " + upErr.message);
      setSaving(false);
      return;
    }

    // Supprimer les questions retirées
    const keepIds = valid.map((q) => q.id);
    const toDelete = originalIds.filter((oid) => !keepIds.includes(oid));
    if (toDelete.length) {
      await supabase.from("questions").delete().in("id", toDelete);
    }

    router.push("/dashboard");
  }

  if (loading)
    return (
      <main className="min-h-dvh bg-paper">
        <TopBar />
        <p className="mx-auto max-w-3xl px-5 py-10 text-ink/50">Chargement…</p>
      </main>
    );

  return (
    <main className="min-h-dvh bg-paper">
      <TopBar />
      <div className="mx-auto max-w-3xl px-5 py-8">
        <Link href="/dashboard" className="text-sm text-ink/50 hover:text-ink">
          ← Mes quiz
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">
          {isEdit ? "Modifier le quiz" : "Nouveau quiz"}
        </h1>

        <div className="card mt-6 space-y-3">
          <input
            className="field font-display text-xl font-bold"
            placeholder="Titre du quiz (ex : Bases de Python)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="field min-h-[72px] resize-y"
            placeholder="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mt-6 space-y-5">
          {questions.map((q, i) => (
            <div key={q.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display font-bold text-ink/70">
                  Question {i + 1}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-ink/55">
                    Temps
                    <select
                      value={q.time_limit}
                      onChange={(e) =>
                        update(i, { time_limit: Number(e.target.value) })
                      }
                      className="rounded-lg border-2 border-ink/12 bg-white px-2 py-1"
                    >
                      {[10, 15, 20, 30, 45, 60].map((t) => (
                        <option key={t} value={t}>
                          {t}s
                        </option>
                      ))}
                    </select>
                  </label>
                  {questions.length > 1 && (
                    <button
                      onClick={() =>
                        setQuestions((qs) => qs.filter((_, idx) => idx !== i))
                      }
                      className="text-sm font-semibold text-ans-a hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>

              <input
                className="field mb-3"
                placeholder="Énoncé de la question"
                value={q.question}
                onChange={(e) => update(i, { question: e.target.value })}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                {CHOICES.map((c) => (
                  <div
                    key={c}
                    className={`flex items-center gap-2 rounded-2xl border-2 p-2 transition-colors ${
                      q.correct_answer === c
                        ? "border-ans-d bg-ans-d/5"
                        : "border-ink/10"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${ANSWER_META[c].bg} text-xs font-bold uppercase text-white`}
                    >
                      {c}
                    </span>
                    <input
                      className="w-full bg-transparent outline-none placeholder:text-ink/35"
                      placeholder={
                        c === "a" || c === "b"
                          ? `Option ${c.toUpperCase()}`
                          : `Option ${c.toUpperCase()} (optionnel)`
                      }
                      value={optionOf(q, c) ?? ""}
                      onChange={(e) => setOption(i, c, e.target.value)}
                    />
                    <button
                      onClick={() => update(i, { correct_answer: c })}
                      title="Marquer comme bonne réponse"
                      className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                        q.correct_answer === c
                          ? "bg-ans-d text-white"
                          : "bg-ink/5 text-ink/45 hover:bg-ink/10"
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/40">
                Coche (✓) la bonne réponse.
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setQuestions((qs) => [...qs, blank()])}
          className="btn-outline mt-5 w-full"
        >
          + Ajouter une question
        </button>

        <div className="sticky bottom-4 mt-6">
          <button onClick={save} disabled={saving} className="btn-brand w-full">
            {saving ? "Enregistrement…" : "Enregistrer le quiz"}
          </button>
        </div>
      </div>
    </main>
  );
}
