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
    <main className="min-h-dvh bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo className="text-2xl" />
        <Link href="/login" className="font-display font-semibold text-ink/70 hover:text-ink">
          Espace enseignant →
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-10 pt-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Pitch */}
          <div className="animate-slide-up">
            <span className="inline-block rounded-full bg-brand/10 px-4 py-1.5 font-display text-sm font-semibold text-brand-deep">
              Le quiz live data-first pour l&apos;Afrique
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl">
              Engage ta classe.
              <br />
              <span className="text-brand">Récolte les données.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/70">
              Crée un quiz, lance une session, et tes étudiants rejoignent avec
              un simple code. Ultra-léger, pensé pour la 3G et le mobile.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="btn-brand">
                Créer un quiz
              </Link>
              <a href="#join" className="btn-outline">
                Rejoindre une partie
              </a>
            </div>
          </div>

          {/* Boîte de jeu */}
          <div
            id="join"
            className="bg-grain animate-pop-in rounded-[2rem] bg-ink p-7 shadow-card sm:p-9"
          >
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-paper/50">
              Tu as un code ?
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-paper">
              Rejoins la partie
            </h2>
            <form onSubmit={join} className="mt-6 space-y-4">
              <input
                inputMode="numeric"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-6 py-5 text-center font-display text-4xl font-bold tracking-[0.4em] text-paper outline-none transition-colors placeholder:text-paper/25 focus:border-brand"
              />
              <button
                type="submit"
                disabled={code.length !== 6}
                className="btn-brand w-full"
              >
                Entrer
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-paper/40">
              Pas besoin de compte pour jouer.
            </p>
          </div>
        </div>

        {/* Trois piliers */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              t: "Ultra-léger",
              d: "PWA optimisée 3G, mobile-first, préchargement des questions.",
            },
            {
              t: "Data-first",
              d: "Temps de réponse, concepts mal compris, progression — exportable.",
            },
            {
              t: "Live & viral",
              d: "Code de session, classement temps réel, cartes de victoire à partager.",
            },
          ].map((f) => (
            <div key={f.t} className="card">
              <h3 className="font-display text-xl font-bold text-ink">{f.t}</h3>
              <p className="mt-2 text-ink/65">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 py-8 text-sm text-ink/40">
        KifLearn — MVP. Construit avec Next.js, Supabase &amp; Vercel.
      </footer>
    </main>
  );
}
