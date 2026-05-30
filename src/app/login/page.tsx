"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Si la confirmation d'email est désactivée, la session est créée directement.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push(redirect);
        return;
      }
      setInfo("Compte créé. Vérifie tes emails pour confirmer, puis connecte-toi.");
      setMode("signin");
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push(redirect);
    }
  }

  return (
    <main className="bg-mesh grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <Logo className="text-2xl" />
          </Link>
        </div>

        <div className="card animate-pop-in">
          <div className="mb-5 flex rounded-2xl bg-ink/5 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 rounded-xl py-2.5 font-display font-semibold transition-colors ${
                  mode === m ? "bg-white text-ink shadow-sm" : "text-ink/50"
                }`}
              >
                {m === "signin" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                className="field"
                placeholder="Ton nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className="field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="field"
              type="password"
              placeholder="Mot de passe (6+ caractères)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && (
              <p className="rounded-xl border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand-deep">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-xl border border-brand/20 bg-brand-light px-4 py-3 text-sm text-brand">
                {info}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-brand w-full">
              {loading
                ? "..."
                : mode === "signin"
                  ? "Se connecter"
                  : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink/45">
          <Link href="/" className="hover:text-ink">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
