"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

function JoinInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c.replace(/\D/g, "").slice(0, 6));
  }, [params]);

  // Reconnexion auto si déjà dans une session active
  useEffect(() => {
    const c = code.replace(/\D/g, "").slice(0, 6);
    if (c.length !== 6) return;
    const stored = localStorage.getItem(`kiflearn:salon:${c}`);
    if (!stored) return;
    try {
      const { participantId } = JSON.parse(stored);
      const supabase = createClient();
      supabase.rpc("rejoin_participant", { p_participant_id: participantId }).then(({ data, error }) => {
        if (!error && data) {
          const p = Array.isArray(data) ? data[0] : data;
          router.replace(`/play/${p.session_id}`);
        }
      });
    } catch {
      /* ignore */
    }
  }, [code, router]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) return setError("Le code fait 6 chiffres.");
    if (!name.trim()) return setError("Choisis un pseudo.");
    setLoading(true);

    const supabase = createClient();
    let existingId: string | null = null;
    try {
      const stored = localStorage.getItem(`kiflearn:salon:${code}`);
      if (stored) existingId = JSON.parse(stored).participantId;
    } catch {
      /* ignore */
    }

    let { data, error } = await supabase.rpc("join_session", {
      p_code: code,
      p_name: name.trim(),
      p_participant_id: existingId,
    });
    if (error && existingId) {
      ({ data, error } = await supabase.rpc("join_session", {
        p_code: code,
        p_name: name.trim(),
      }));
    }
    if (error || !data) {
      setError(error?.message ?? "Impossible de rejoindre.");
      setLoading(false);
      return;
    }
    const participant = Array.isArray(data) ? data[0] : data;
    localStorage.setItem(
      `kiflearn:participant:${participant.session_id}`,
      participant.id,
    );
    localStorage.setItem(
      `kiflearn:name:${participant.session_id}`,
      participant.user_name,
    );
    localStorage.setItem(
      `kiflearn:salon:${code}`,
      JSON.stringify({
        participantId: participant.id,
        sessionId: participant.session_id,
        userName: participant.user_name,
      }),
    );
    router.push(`/play/${participant.session_id}`);
  }

  return (
    <main className="bg-mesh grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo className="text-xl" />
          </Link>
        </div>

        <form onSubmit={join} className="card animate-pop-in p-8 shadow-card">
          <h1 className="text-center font-display text-2xl font-extrabold">
            Rejoindre la partie
          </h1>

          <label className="mt-5 block text-sm font-semibold text-ink/55">
            Code de session
          </label>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            className="field mt-1 text-center font-display text-3xl font-bold tracking-[0.3em]"
          />

          <label className="mt-4 block text-sm font-semibold text-ink/55">
            Ton pseudo
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="Ex : Aïcha 🚀"
            className="field mt-1"
          />

          {error && (
            <p className="mt-3 rounded-xl border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand-deep">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brand mt-5 w-full"
          >
            {loading ? "..." : "C'est parti !"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinInner />
    </Suspense>
  );
}
