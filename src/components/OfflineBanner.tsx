"use client";

import { useEffect, useState } from "react";
import { isOnline } from "@/lib/offline-cache";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div className="bg-brand-light px-4 py-2 text-center text-sm font-semibold text-brand-deep">
      Mode hors-ligne — questions en cache si disponibles
    </div>
  );
}
