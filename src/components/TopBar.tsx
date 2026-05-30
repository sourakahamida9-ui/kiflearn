"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export function TopBar({ name }: { name?: string | null }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-ink/8 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/dashboard">
          <Logo className="text-xl" />
        </Link>
        <div className="flex items-center gap-4">
          {name && (
            <span className="hidden text-sm text-ink/55 sm:inline">
              Bonjour, <span className="font-semibold text-ink">{name}</span>
            </span>
          )}
          <button
            onClick={logout}
            className="font-display text-sm font-semibold text-ink/55 hover:text-brand"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
