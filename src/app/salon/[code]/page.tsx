"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

/** Salon persistant : reconnexion auto si participant déjà enregistré. */
export default function SalonPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "join" | "reconnect">("loading");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cleanCode = code.replace(/\D/g, "").slice(0, 6);

  useEffect(() => {
    if (cleanCode.length !== 6) {
      setStatus("join");
      return;
    }

    const stored = localStorage.getItem(`kiflearn:salon:${cleanCode}`);
    if (!stored) {
      setStatus("join");
      return;
    }

    try {
      const { participantId, sessionId, userName } = JSON.parse(stored);
      setName(userName ?? "");
      const supabase = createClient();
      (async () => {
        const { data, error } = await supabase.rpc("rejoin_participant", {
          p_participant_id: participantId,
        });
        if (!error && data) {
          const p = Array.isArray(data) ? data[0] : data;
          localStorage.setItem(`kiflearn:participant:${p.session_id}`, p.id);
          localStorage.setItem(`kiflearn:name:${p.session_id}`, p.user_name);
          router.replace(`/play/${p.session_id}`);
          return;
        }
        setStatus("join");
      })();
    } catch {
      setStatus("join");
    }
  }, [cleanCode, router]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Choisis un pseudo.");
    setError(null);

    const supabase = createClient();
    const stored = localStorage.getItem(`kiflearn:salon:${cleanCode}`);
    let participantId: string | null = null;
    if (stored) {
      try {
        participantId = JSON.parse(stored).participantId;
      } catch {
        /* ignore */
      }
    }

    const { data, error } = await supabase.rpc("join_session", {
      p_code: cleanCode,
      p_name: name.trim(),
      p_participant_id: participantId,
    });

    if (error || !data) {
      setError(error?.message ?? "Salon introuvable.");
      return;
    }

    const p = Array.isArray(data) ? data[0] : data;
    localStorage.setItem(`kiflearn:participant:${p.session_id}`, p.id);
    localStorage.setItem(`kiflearn:name:${p.session_id}`, p.user_name);
    localStorage.setItem(
      `kiflearn:salon:${cleanCode}`,
      JSON.stringify({
        participantId: p.id,
        sessionId: p.session_id,
        userName: p.user_name,
      }),
    );
    router.push(`/play/${p.session_id}`);
  }

  if (status === "loading") {
    return (
      <main className="bg-mesh grid min-h-dvh place-items-center">
        <p className="font-display text-xl text-ink-muted">Reconnexion au salon…</p>
      </main>
    );
  }

  return (
    <main className="bg-mesh grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex justify-center">
          <Logo className="text-xl" />
        </Link>
        <form onSubmit={join} className="card animate-pop-in p-8 shadow-card">
          <h1 className="text-center font-display text-2xl font-extrabold">
            Salon {cleanCode}
          </h1>
          <p className="mt-2 text-center text-sm text-ink/55">
            Salon persistant — ta place est mémorisée sur cet appareil.
          </p>
          <input
            className="field mt-5"
            placeholder="Ton pseudo"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
          />
          {error && (
            <p className="mt-3 rounded-xl border border-brand/30 bg-brand-light px-4 py-2 text-sm text-brand-deep">
              {error}
            </p>
          )}
          <button type="submit" className="btn-brand mt-5 w-full">
            Entrer dans le salon
          </button>
        </form>
      </div>
    </main>
  );
}
