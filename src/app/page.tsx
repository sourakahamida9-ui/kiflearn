"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.replace(/\D/g, "").slice(0, 6);
    if (c.length === 6) router.push(`/join?code=${c}`);
  }

  return (
    <main className="min-h-dvh bg-mesh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo className="text-xl" />
        <Link href="/login" className="btn-ghost text-sm">
          Espace enseignant →
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-slide-up">
            <span className="badge-pill">Quiz live · mobile · data-first</span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              Engage ta classe.
              <br />
              <span className="bg-gradient-to-r from-brand to-brand-glow bg-clip-text text-transparent">
                Récolte les données.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">
              Crée un quiz en 2 minutes, lance une session live, tes élèves
              rejoignent avec un code à 6 chiffres.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-brand px-8">
                Créer un quiz
              </Link>
              <a href="#join" className="btn-outline">
                Rejoindre
              </a>
              <Link href="/marketplace" className="btn-outline">
                Marketplace
              </Link>
            </div>
          </div>

          <div
            id="join"
            className="bg-panel-dark animate-pop-in rounded-[1.75rem] p-8 sm:p-10"
          >
            <p className="text-sm font-medium uppercase tracking-wider text-white/50">
              Tu as un code ?
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              Rejoins la partie
            </h2>
            <form onSubmit={join} className="mt-8 space-y-4">
              <input
                inputMode="numeric"
                autoComplete="off"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full rounded-btn border border-white/15 bg-white/10 px-6 py-5 text-center
                  font-display text-3xl font-bold tracking-[0.35em] text-white backdrop-blur-sm
                  outline-none transition-all placeholder:text-white/25
                  focus:border-brand-glow focus:ring-4 focus:ring-brand/30 sm:text-4xl"
              />
              <button
                type="submit"
                disabled={code.length !== 6}
                className="btn-brand w-full py-4 text-lg"
              >
                Entrer dans la partie
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-white/40">
              Aucun compte requis pour jouer
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-3">
          {[
            { t: "Ultra-léger", d: "PWA, mode hors-ligne, optimisé 3G.", icon: "⚡" },
            { t: "Data-first", d: "Analytics, concepts mal compris, export CSV.", icon: "📊" },
            { t: "Live", d: "Code session, classement temps réel.", icon: "🎯" },
          ].map((f) => (
            <div key={f.t} className="card">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">{f.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink/5 py-8 text-center text-sm text-ink-muted">
        KifLearn — Next.js · Supabase · Vercel
      </footer>
    </main>
  );
}
