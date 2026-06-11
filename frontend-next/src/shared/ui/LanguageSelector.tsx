"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSelector() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    // Разбиваем путь на сегменты
    const segments = pathname.split('/');
    // Заменяем первый сегмент (пустой) и второй (текущая локаль)
    // Например, ['', 'en', 'pricing'] → ['', 'de', 'pricing']
    segments[1] = newLocale;
    const newPath = segments.join('/') || '/';
    router.push(newPath);
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)]"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}