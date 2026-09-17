import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";
import "./pitch.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoPublica — Pitch Deck",
  robots: { index: false, follow: false },
};

export default function PitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" data-theme="light">
      <body
        className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
