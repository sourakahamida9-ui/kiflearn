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
    <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/dashboard">
          <Logo className="text-lg" />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/dashboard" className="btn-ghost px-3 py-2 text-sm">
            Quiz
          </Link>
          <Link href="/dashboard/analytics" className="btn-ghost px-3 py-2 text-sm">
            Analytics
          </Link>
          <Link href="/marketplace" className="btn-ghost px-3 py-2 text-sm">
            Marketplace
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {name && (
            <span className="hidden text-sm text-ink-muted sm:inline">
              {name}
            </span>
          )}
          <button onClick={logout} className="btn-ghost px-3 py-2 text-sm text-ink-muted">
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
