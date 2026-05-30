"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnswerTile } from "@/components/AnswerTile";
import { Logo } from "@/components/Logo";
import {
  CHOICES,
  optionOf,
  type Choice,
  type PublicQuestion,
  type Session,
} from "@/lib/types";
import {
  cacheQuestions,
  getCachedQuestions,
  isOnline,
} from "@/lib/offline-cache";
import { earnBadge } from "@/lib/badges";

type Result = { is_correct: boolean; points: number };

export default function PlayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const { sessionId } = use(params);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [picked, setPicked] = useState<Record<string, Choice>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [finalRank, setFinalRank] = useState<{ rank: number; total: number; score: number } | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const submitting = useRef(false);

  // Récupère l'identité locale + reconnexion auto
  useEffect(() => {
    if (!sessionId) return;
    const pid = localStorage.getItem(`kiflearn:participant:${sessionId}`);
    const nm = localStorage.getItem(`kiflearn:name:${sessionId}`);
    if (!pid) {
      router.push("/join");
      return;
    }

    setParticipantId(pid);
    setName(nm ?? "");

    const supabase = createClient();
    supabase.rpc("rejoin_participant", { p_participant_id: pid }).then(({ data, error }) => {
      if (error) {
        router.push("/join");
        return;
      }
      const p = Array.isArray(data) ? data[0] : data;
      if (p?.user_name) setName(p.user_name);
    });
  }, [sessionId, router]);

  // Chargement + abonnement realtime à la session
  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();

    (async () => {
      const { data: s } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (!s) {
        router.push("/join");
        return;
      }
      setSession(s);

      let qs: PublicQuestion[] | null = null;
      if (isOnline()) {
        const { data } = await supabase
          .from("questions_public")
          .select("*")
          .eq("quiz_id", s.quiz_id)
          .order("position");
        qs = data ?? [];
        if (qs.length) {
          await cacheQuestions(s.quiz_id, qs);
          earnBadge("offline_ready");
        }
      }
      if (!qs?.length) {
        qs = (await getCachedQuestions(s.quiz_id)) ?? [];
      }
      setQuestions(qs);
    })();

    const channel = supabase
      .channel(`play-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => setSession(payload.new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, router]);

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 400);
    return () => clearInterval(t);
  }, []);

  // Récupère le classement final
  useEffect(() => {
    if (session?.status !== "finished" || !sessionId || !participantId) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("participants")
        .select("id,score")
        .eq("session_id", sessionId)
        .order("score", { ascending: false });
      if (!data) return;
      const idx = data.findIndex((p: any) => p.id === participantId);
      setFinalRank({
        rank: idx + 1,
        total: data.length,
        score: data[idx]?.score ?? 0,
      });
    })();
  }, [session?.status, sessionId, participantId]);

  const currentQuestion =
    session && session.current_question_index >= 0
      ? questions[session.current_question_index] ?? null
      : null;

  const remaining = (() => {
    if (!session?.question_started_at || !currentQuestion) return 0;
    const end =
      new Date(session.question_started_at).getTime() +
      currentQuestion.time_limit * 1000;
    return Math.max(0, Math.ceil((end - nowTs) / 1000));
  })();

  async function answer(choice: Choice) {
    if (!currentQuestion || !participantId || submitting.current) return;
    if (picked[currentQuestion.id]) return;
    submitting.current = true;
    setPicked((p) => ({ ...p, [currentQuestion.id]: choice }));

    const responseTime = session?.question_started_at
      ? Date.now() - new Date(session.question_started_at).getTime()
      : 0;

    const supabase = createClient();
    const { data, error } = await supabase.rpc("submit_answer", {
      p_participant_id: participantId,
      p_question_id: currentQuestion.id,
      p_answer: choice,
      p_response_time: Math.round(responseTime),
    });
    if (!error && data) {
      const r = Array.isArray(data) ? data[0] : data;
      setResults((prev) => ({
        ...prev,
        [currentQuestion.id]: { is_correct: r.is_correct, points: r.points },
      }));
    }
    submitting.current = false;
  }

  if (!session) {
    return (
      <main className="bg-panel-dark grid min-h-dvh place-items-center text-white">
        Chargement…
      </main>
    );
  }

  const myResult = currentQuestion ? results[currentQuestion.id] : undefined;
  const myPick = currentQuestion ? picked[currentQuestion.id] : undefined;

  return (
    <main className="bg-panel-dark min-h-dvh px-5 py-6 text-white">
      <div className="mx-auto flex min-h-[88dvh] max-w-lg flex-col">
        <div className="flex items-center justify-between">
          <Logo className="text-lg text-white" />
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
            {name}
          </span>
        </div>

        {/* LOBBY */}
        {session.status === "lobby" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="animate-float text-6xl">🎮</div>
            <h1 className="mt-4 font-display text-3xl font-extrabold">
              Tu es dans la partie !
            </h1>
            <p className="mt-2 text-white/60">
              Attends que l&apos;enseignant démarre…
            </p>
          </div>
        )}

        {/* QUESTION ACTIVE */}
        {session.status === "active" && currentQuestion && (
          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between py-3 text-white/60">
              <span className="font-display font-semibold">
                Q{session.current_question_index + 1}
              </span>
              <span className="font-display text-2xl font-extrabold text-brand">
                {remaining}s
              </span>
            </div>

            <div className="rounded-3xl bg-white/5 p-5 text-center">
              <h2 className="font-display text-xl font-bold">
                {currentQuestion.question}
              </h2>
            </div>

            {myPick ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="animate-float text-5xl">✅</div>
                <p className="mt-3 font-display text-xl font-bold">
                  Réponse envoyée !
                </p>
                <p className="mt-1 text-white/60">Patiente pour les résultats…</p>
              </div>
            ) : (
              <div className="mt-5 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                {CHOICES.map((c) => {
                  const label = optionOf(currentQuestion, c);
                  if (!label) return null;
                  return (
                    <AnswerTile
                      key={c}
                      choice={c}
                      label={label}
                      disabled={remaining === 0}
                      onClick={() => answer(c)}
                    />
                  );
                })}
                {remaining === 0 && (
                  <p className="col-span-full text-center text-white/50">
                    Temps écoulé !
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* RÉVÉLATION */}
        {session.status === "question_closed" && currentQuestion && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {myResult ? (
              myResult.is_correct ? (
                <>
                  <div className="animate-pop-in text-7xl">🎉</div>
                  <h2 className="mt-4 font-display text-3xl font-extrabold text-brand">
                    Bonne réponse !
                  </h2>
                  <p className="mt-2 font-display text-2xl font-bold text-brand">
                    +{myResult.points} points
                  </p>
                </>
              ) : (
                <>
                  <div className="animate-pop-in text-7xl">😬</div>
                  <h2 className="mt-4 font-display text-3xl font-extrabold text-ink-muted">
                    Raté…
                  </h2>
                  <p className="mt-2 text-white/60">
                    On se rattrape à la prochaine !
                  </p>
                </>
              )
            ) : (
              <>
                <div className="text-6xl">⏳</div>
                <h2 className="mt-4 font-display text-2xl font-bold">
                  Tu n&apos;as pas répondu
                </h2>
              </>
            )}
          </div>
        )}

        {/* FIN */}
        {session.status === "finished" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {finalRank && finalRank.rank <= 3 ? (
              <div className="animate-pop-in text-7xl">
                {finalRank.rank === 1 ? "🥇" : finalRank.rank === 2 ? "🥈" : "🥉"}
              </div>
            ) : (
              <div className="text-6xl">🏁</div>
            )}
            <h2 className="mt-4 font-display text-3xl font-extrabold">
              {name}
            </h2>
            {finalRank && (
              <>
                <p className="mt-2 text-white/70">
                  {finalRank.rank}
                  <sup>
                    {finalRank.rank === 1 ? "er" : "e"}
                  </sup>{" "}
                  sur {finalRank.total}
                </p>
                <p className="mt-4 font-display text-5xl font-extrabold text-brand">
                  {finalRank.score}
                </p>
                <p className="text-white/50">points</p>
              </>
            )}
            <button
              onClick={() => router.push("/")}
              className="btn-outline mt-8 bg-transparent text-white"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
