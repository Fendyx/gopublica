import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import Navbar from "@/widgets/Layout/Navbar";
import Footer from "@/widgets/Layout/Footer";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = "https://gopublica.com";
  return {
    title: {
      template: "%s | GoPublica",
      default: "GoPublica – SaaS for Businesses",
    },
    description: "Websites, CRM, online ordering – one platform for your business. Start a free trial today.",
    keywords: ["SaaS", "business website", "CRM", "online ordering", "GoPublica"],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
    openGraph: {
      siteName: "GoPublica",
      title: "GoPublica – SaaS for Businesses",
      description: "Websites, CRM, online ordering – one platform for your business.",
      url: `${baseUrl}/${locale}`,
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "GoPublica – SaaS for Businesses",
      description: "Websites, CRM, online ordering – one platform for your business.",
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 👇 Если локаль не из списка — сразу 404
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}