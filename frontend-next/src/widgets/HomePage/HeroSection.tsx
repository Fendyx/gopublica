"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { Rocket, Mail, ArrowRight } from "lucide-react";

export default function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] py-32 px-6 text-center">
      {/* Фоновый градиент с анимацией */}
      <div className="hero-gradient absolute inset-0 z-0 bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-blue-100/20 dark:to-blue-900/20 animate-gradientShift bg-[size:200%_200%]">
        {/* Шар 1 */}
        <div className="absolute top-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full hero-shape-1" />
        {/* Шар 2 */}
        <div className="absolute bottom-[5%] right-[-10%] w-[350px] h-[350px] hero-shape-2" />
        {/* Шар 3 */}
        <div className="absolute top-[40%] left-[45%] w-[280px] h-[280px] rounded-full hero-shape-3" />
      </div>

      {/* Контент */}
      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text)] mb-6 animate-fadeUp">
          {t("title")}
        </h1>
        <p className="text-lg sm:text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto animate-fadeUp [animation-delay:100ms]">
          {t("subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeUp [animation-delay:200ms]">
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="gap-2 w-full sm:w-auto bg-[var(--primary-color)] hover:bg-blue-700 text-white"
            >
              <Rocket size={18} />
              {t("startFree")}
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/contact" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 w-full sm:w-auto border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--primary-color)]"
            >
              <Mail size={18} />
              {t("contact")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}