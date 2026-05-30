import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KifLearn — Le quiz live data-first pour l'Afrique",
  description:
    "Crée des quiz live ultra-légers, engage ta classe ou ton hackathon, et transforme chaque réponse en données exploitables.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "KifLearn", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#15121f",
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
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
