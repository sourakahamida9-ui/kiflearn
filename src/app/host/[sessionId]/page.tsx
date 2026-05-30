"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ANSWER_META } from "@/components/AnswerTile";
import { downloadCSV } from "@/lib/utils";
import {
  CHOICES,
  optionOf,
  type Choice,
  type Participant,
  type Question,
  type Session,
} from "@/lib/types";

export default function HostPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const { sessionId } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [distribution, setDistribution] = useState<Record<Choice, number>>({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  });
  const [nowTs, setNowTs] = useState(Date.now());

  const answeredSet = useRef<Set<string>>(new Set());
  const currentQRef = useRef<Question | null>(null);

  const refetchParticipants = useCallback(async (sid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("session_id", sid)
      .order("score", { ascending: false });
    setParticipants(data ?? []);
  }, []);

  // Chargement initial + abonnements realtime
  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: s } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (!s) {
        router.push("/dashboard");
        return;
      }
      if (user && s.host_id !== user.id) {
        router.push("/dashboard");
        return;
      }
      if (!active) return;
      setSession(s);

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("title")
        .eq("id", s.quiz_id)
        .single();
      setQuizTitle(quiz?.title ?? "");

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", s.quiz_id)
        .order("position");
      setQuestions(qs ?? []);

      await refetchParticipants(sessionId);
    })();

    const channel = supabase
      .channel(`host-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refetchParticipants(sessionId),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "answers",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          const a = payload.new;
          if (currentQRef.current && a.question_id === currentQRef.current.id) {
            answeredSet.current.add(a.participant_id);
            setAnsweredCount(answeredSet.current.size);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, router, refetchParticipants]);

  // Horloge pour le minuteur
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 400);
    return () => clearInterval(t);
  }, []);

  const currentQuestion =
    session && session.current_question_index >= 0
      ? questions[session.current_question_index] ?? null
      : null;
  currentQRef.current = currentQuestion;

  const remaining = (() => {
    if (!session?.question_started_at || !currentQuestion) return 0;
    const end =
      new Date(session.question_started_at).getTime() +
      currentQuestion.time_limit * 1000;
    return Math.max(0, Math.ceil((end - nowTs) / 1000));
  })();

  // Auto-clôture quand le temps est écoulé
  useEffect(() => {
    if (session?.status === "active" && remaining === 0 && currentQuestion) {
      closeQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, session?.status]);

  async function patchSession(patch: Partial<Session>) {
    if (!sessionId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("sessions")
      .update(patch)
      .eq("id", sessionId)
      .select("*")
      .single();
    if (data) setSession(data);
  }

  async function start() {
    answeredSet.current = new Set();
    setAnsweredCount(0);
    await patchSession({
      status: "active",
      current_question_index: 0,
      question_started_at: new Date().toISOString(),
    });
  }

  async function closeQuestion() {
    if (!currentQuestion || !sessionId) return;
    // Calcule la distribution des réponses
    const supabase = createClient();
    const { data } = await supabase
      .from("answers")
      .select("answer")
      .eq("session_id", sessionId)
      .eq("question_id", currentQuestion.id);
    const dist: Record<Choice, number> = { a: 0, b: 0, c: 0, d: 0 };
    (data ?? []).forEach((r: any) => {
      if (r.answer in dist) dist[r.answer as Choice]++;
    });
    setDistribution(dist);
    await patchSession({ status: "question_closed" });
  }

  async function next() {
    if (!session) return;
    const nextIdx = session.current_question_index + 1;
    answeredSet.current = new Set();
    setAnsweredCount(0);
    if (nextIdx >= questions.length) {
      await patchSession({ status: "finished" });
    } else {
      await patchSession({
        status: "active",
        current_question_index: nextIdx,
        question_started_at: new Date().toISOString(),
      });
    }
  }

  async function exportCSV() {
    if (!sessionId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("answers")
      .select(
        "answer,is_correct,response_time,points,participant:participants(user_name),question:questions(position,question)",
      )
      .eq("session_id", sessionId);
    const rows = (data ?? []).map((r: any) => ({
      participant: r.participant?.user_name ?? "",
      question_no: (r.question?.position ?? 0) + 1,
      question: r.question?.question ?? "",
      reponse: r.answer ?? "",
      correct: r.is_correct ? "oui" : "non",
      temps_ms: r.response_time ?? "",
      points: r.points,
    }));
    downloadCSV(`kiflearn-${quizTitle || "session"}.csv`, rows);
  }

  if (!session) {
    return (
      <main className="bg-panel-dark grid min-h-dvh place-items-center text-white">
        Chargement…
      </main>
    );
  }

  const totalAnswered = participants.length;

  return (
    <main className="bg-panel-dark min-h-dvh px-5 py-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-sm uppercase tracking-widest text-white/40">
              KifLearn · Hôte
            </p>
            <h1 className="font-display text-2xl font-bold">{quizTitle}</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-white/50 hover:text-white"
          >
            Quitter
          </button>
        </div>

        {/* ---------- LOBBY ---------- */}
        {session.status === "lobby" && (
          <div className="mt-8 animate-pop-in text-center">
            <p className="font-display uppercase tracking-widest text-white/50">
              Code pour rejoindre
            </p>
            <div className="mx-auto mt-3 inline-block rounded-3xl bg-white px-10 py-6 shadow-card">
              <span className="font-display text-6xl font-extrabold tracking-[0.3em] text-ink sm:text-7xl">
                {session.join_code}
              </span>
            </div>
            <p className="mt-4 text-white/60">
              {session.is_persistent ? (
                <>
                  Lien salon persistant :{" "}
                  <span className="font-semibold text-white">
                    /salon/{session.join_code}
                  </span>
                </>
              ) : (
                <>
                  Va sur la page d&apos;accueil et entre ce code.
                </>
              )}
            </p>

            <div className="mt-8">
              <p className="font-display text-lg font-bold">
                {participants.length} participant
                {participants.length > 1 ? "s" : ""} connecté
                {participants.length > 1 ? "s" : ""}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {participants.map((p) => (
                  <span
                    key={p.id}
                    className="animate-pop-in rounded-full bg-white/10 px-4 py-2 font-semibold"
                  >
                    {p.user_name}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={start}
              disabled={questions.length === 0}
              className="btn-brand mt-10 px-12"
            >
              Démarrer le quiz →
            </button>
          </div>
        )}

        {/* ---------- QUESTION ACTIVE ---------- */}
        {session.status === "active" && currentQuestion && (
          <div className="mt-6 animate-slide-up">
            <div className="flex items-center justify-between text-white/60">
              <span className="font-display font-semibold">
                Question {session.current_question_index + 1} /{" "}
                {questions.length}
              </span>
              <span className="font-display text-3xl font-extrabold text-brand">
                {remaining}s
              </span>
            </div>

            <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-card">
              <h2 className="font-display text-3xl font-bold text-ink">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {CHOICES.map((c) => {
                const label = optionOf(currentQuestion, c);
                if (!label) return null;
                return (
                  <div
                    key={c}
                    className={`btn ${ANSWER_META[c].bg} min-h-[72px] justify-start text-left text-lg text-white`}
                  >
                    <span className="font-bold uppercase">{c}.</span> {label}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="font-display text-lg">
                <span className="text-brand">{answeredCount}</span> /{" "}
                {totalAnswered} ont répondu
              </p>
              <button onClick={closeQuestion} className="btn-ink">
                Clôturer
              </button>
            </div>
          </div>
        )}

        {/* ---------- RÉVÉLATION ---------- */}
        {session.status === "question_closed" && currentQuestion && (
          <div className="mt-6 animate-slide-up">
            <h2 className="text-center font-display text-2xl font-bold">
              {currentQuestion.question}
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {CHOICES.map((c) => {
                const label = optionOf(currentQuestion, c);
                if (!label) return null;
                const isCorrect = currentQuestion.correct_answer === c;
                const count = distribution[c];
                const total =
                  distribution.a +
                  distribution.b +
                  distribution.c +
                  distribution.d;
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div
                    key={c}
                    className={`relative overflow-hidden rounded-2xl ${ANSWER_META[c].bg} p-4 text-white ${
                      isCorrect ? "ring-4 ring-white" : "opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        <span className="uppercase">{c}.</span> {label}
                      </span>
                      {isCorrect && <span className="text-2xl">✓</span>}
                    </div>
                    <div className="mt-2 text-sm opacity-90">
                      {count} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card mt-6 text-ink">
              <h3 className="font-display font-bold">Classement</h3>
              <ol className="mt-3 space-y-2">
                {participants.slice(0, 5).map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-2"
                  >
                    <span className="font-semibold">
                      {i + 1}. {p.user_name}
                    </span>
                    <span className="font-display font-bold text-brand">
                      {p.score}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <button onClick={next} className="btn-brand mt-6 w-full">
              {session.current_question_index + 1 >= questions.length
                ? "Voir le classement final →"
                : "Question suivante →"}
            </button>
          </div>
        )}

        {/* ---------- FIN ---------- */}
        {session.status === "finished" && (
          <div className="mt-8 animate-pop-in">
            <h2 className="text-center font-display text-3xl font-extrabold">
              🏆 Classement final
            </h2>

            <div className="mt-8 flex items-end justify-center gap-3">
              {[1, 0, 2].map((rank) => {
                const p = participants[rank];
                if (!p) return <div key={rank} className="w-24" />;
                const h = rank === 0 ? "h-40" : rank === 1 ? "h-28" : "h-24";
                const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : "🥉";
                return (
                  <div key={rank} className="flex w-24 flex-col items-center">
                    <span className="text-3xl">{medal}</span>
                    <span className="mb-1 truncate text-center text-sm font-semibold">
                      {p.user_name}
                    </span>
                    <div
                      className={`${h} w-full rounded-t-2xl bg-brand/90 pt-2 text-center font-display font-bold text-white`}
                    >
                      {p.score}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card mt-8 text-ink">
              <ol className="space-y-2">
                {participants.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-2"
                  >
                    <span className="font-semibold">
                      {i + 1}. {p.user_name}
                    </span>
                    <span className="font-display font-bold text-brand">
                      {p.score}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={exportCSV} className="btn-ink flex-1">
                ⬇ Exporter les données (CSV)
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-brand flex-1"
              >
                Terminer
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
