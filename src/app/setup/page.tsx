"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

const SQL_URL =
  "https://supabase.com/dashboard/project/ngtnnoqmupbixszuugih/sql/new";

export default function SetupPage() {
  const [v2ok, setV2ok] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("quizzes")
      .select("is_public")
      .limit(1)
      .then(({ error }) => setV2ok(!error));
  }, []);

  async function copySql() {
    const res = await fetch("/migrations_v2.sql");
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="bg-mesh min-h-dvh px-5 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/">
          <Logo className="mb-8" />
        </Link>
        <div className="card">
          <h1 className="font-display text-2xl font-bold text-ink">
            Configuration base de données
          </h1>
          {v2ok === null && (
            <p className="mt-4 text-ink-muted">Vérification…</p>
          )}
          {v2ok === true && (
            <p className="mt-4 rounded-xl bg-brand-light px-4 py-3 text-brand-deep">
              Migration V2 déjà appliquée. Tout est prêt.
            </p>
          )}
          {v2ok === false && (
            <>
              <p className="mt-4 text-ink-muted">
                Une étape SQL (1 min) active marketplace, salons persistants et
                reconnexion.
              </p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
                <li>Copie le script SQL ci-dessous</li>
                <li>Ouvre l&apos;éditeur Supabase</li>
                <li>Colle → Run</li>
              </ol>
              <div className="mt-5 flex flex-col gap-2">
                <button type="button" onClick={copySql} className="btn-outline w-full">
                  {copied ? "Copié !" : "Copier le script SQL"}
                </button>
                <a
                  href={SQL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brand w-full text-center"
                >
                  Ouvrir Supabase SQL Editor
                </a>
              </div>
            </>
          )}
          <Link href="/dashboard" className="btn-ghost mt-6 w-full">
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
