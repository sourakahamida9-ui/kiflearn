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

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) return setError("Le code fait 6 chiffres.");
    if (!name.trim()) return setError("Choisis un pseudo.");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("join_session", {
      p_code: code,
      p_name: name.trim(),
    });
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
    router.push(`/play/${participant.session_id}`);
  }

  return (
    <main className="bg-grain grid min-h-dvh place-items-center bg-ink px-5 py-10 text-paper">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <Logo className="text-2xl text-paper" />
          </Link>
        </div>

        <form
          onSubmit={join}
          className="animate-pop-in rounded-3xl bg-white p-7 text-ink shadow-card"
        >
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
            className="mt-1 w-full rounded-2xl border-2 border-ink/12 bg-white px-5 py-4 text-center font-display text-3xl font-bold tracking-[0.3em] outline-none focus:border-brand"
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
            <p className="mt-3 rounded-xl bg-ans-a/10 px-4 py-3 text-sm text-ans-a">
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
