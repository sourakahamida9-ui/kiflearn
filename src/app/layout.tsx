import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { OfflineBanner } from "@/components/OfflineBanner";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sansBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KifLearn — Quiz live pour l'Afrique",
  description:
    "Crée des quiz live, engage ta classe avec un code simple, et transforme chaque réponse en données.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "KifLearn", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${sans.variable} ${sansBody.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">
        <PwaRegister />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
