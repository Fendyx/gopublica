import React from "react";
import type { ModalData } from "./Modal";

/* ═══════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════ */

function VideoPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--surface)]">
      <span className="px-6 text-center text-sm text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 1 — Title (video background + photo)
   ═══════════════════════════════════════════════════ */

export function Slide01() {
  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* ── Video background ───────────────────────── */}
      <div className="pitch-video-bg">
        {/* Замініть на свій відеофайл */}
        <video autoPlay muted loop playsInline>
          <source src="/pitch/bg.mp4" type="video/mp4" />
        </video>
        <div className="pitch-video-overlay" />
      </div>

      {/* ── Content ────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center md:px-16">
        {/* Circular photo placeholder */}
        <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-white/10">
          <span className="text-center text-xs text-white/60">
            [Фото
            <br />
            спікера]
          </span>
        </div>

        <h1 className="max-w-5xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          GoPublica — цифрова екосистема для вашого бізнесу
        </h1>
        <p className="max-w-3xl text-xl leading-relaxed text-white/80 sm:text-2xl md:text-3xl">
          Сайт, онлайн-продажі та CRM в одному місці — без найму програмістів
        </p>
        <div className="mt-4 text-base text-white/50 md:text-lg">
          [Ім&apos;я спікера] · hello@gopublica.com
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 2 — Hook (universal, not restaurant-only)
   ═══════════════════════════════════════════════════ */

export function Slide02() {
  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden px-8 md:px-16">
      {/* ── Scattered tool icons — visual chaos ─────── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <span className="absolute left-[8%] top-[12%] text-7xl">🛒</span>
        <span className="absolute right-[12%] top-[18%] text-6xl">📅</span>
        <span className="absolute bottom-[22%] left-[15%] text-5xl">📋</span>
        <span className="absolute bottom-[14%] right-[10%] text-7xl">💬</span>
        <span className="absolute left-[42%] top-[8%] text-5xl">🍽</span>
        <span className="absolute right-[38%] bottom-[10%] text-6xl">💇</span>
        <span className="absolute left-[6%] bottom-[40%] text-5xl">🚗</span>
        <span className="absolute right-[6%] top-[45%] text-5xl">📦</span>
      </div>

      <div className="relative z-10 flex max-w-5xl flex-col items-center gap-10 text-center">
        <h2 className="max-w-4xl text-3xl font-semibold leading-snug text-[var(--text)] sm:text-4xl md:text-5xl">
          Замовлення, бронювання, записи клієнтів — все в різних місцях.
          <br />
          <span className="text-[var(--primary-color)]">Це каша.</span>
        </h2>

        <p className="max-w-3xl text-xl text-[var(--text-muted)] sm:text-2xl md:text-3xl">
          Покупки, резервації та управління клієнтами розкидані по десятку
          сервісів. Кожен перехід — втрачений клієнт.
        </p>

        {/* Small, tasteful reaction — optional GIF slot */}
        <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 shadow-[var(--shadow-card)]">
          <span className="text-xl">🤦</span>
          <span className="text-xs text-[var(--text-muted)]">
            {/* Замініть на GIF-файл: <img src="/pitch/reaction.gif" alt="" className="h-8" /> */}
            коли у вас12 вікон для1 клієнта
          </span>
        </div>

        <p className="max-w-3xl text-xl text-[var(--primary-color)] sm:text-2xl md:text-3xl">
          Ми створили платформу, яка об&#39;єднує все це в одному продукті.
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 3 — Live demo (video left 60%, text right)
   ═══════════════════════════════════════════════════ */

export function Slide03() {
  return (
    <section className="flex h-full w-full items-center justify-center px-8 md:px-16">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-5">
        {/* Video — large, left */}
        <div className="md:col-span-3">
          <VideoPlaceholder label="[VIDEO PLACEHOLDER: live platform demo]" />
        </div>

        {/* Text blocks — right */}
        <div className="flex flex-col gap-6 md:col-span-2">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <span className="mb-2 block text-2xl">🖥</span>
            <p className="text-sm font-medium text-[var(--text)]">
              Сторінка магазину — Власний домен. Власний бренд.
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <span className="mb-2 block text-2xl">⚙️</span>
            <p className="text-sm font-medium text-[var(--text)]">
              Панель адміністратора — Повний контроль в одному вікні.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 4 — Observations (unchanged)
   ═══════════════════════════════════════════════════ */

export function Slide04() {
  const bullets = [
    {
      icon: "🔧",
      text: "Різні інструменти для замовлень, бронювання та бази клієнтів",
    },
    { icon: "💰", text: "Дорога і довга розробка власного сайту" },
    {
      icon: "🤷",
      text: "Складно керувати контентом без технічних знань",
    },
  ];

  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-8 md:px-16">
      <h2 className="mb-12 text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
        У більшості — та сама картина
      </h2>
      <div className="flex max-w-3xl flex-col gap-8">
        {bullets.map((b) => (
          <div key={b.icon} className="flex items-start gap-5">
            <span className="mt-1 text-2xl">{b.icon}</span>
            <p className="text-xl leading-relaxed text-[var(--text)] md:text-2xl">
              {b.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 5 — Who it's for (clickable → modal)
   ═══════════════════════════════════════════════════ */

export const industryCards: ModalData[] = [
  {
    icon: "🍽",
    title: "Ресторани та доставка",
    description: "замовлення, доставка, бронювання",
    videoLabel: "[VIDEO: restaurant ordering & delivery demo]",
    note: "Клієнт бачить меню, робить замовлення, отримує сповіщення — все в одному вікні.",
  },
  {
    icon: "💇",
    title: "Сфера краси",
    description: "запис до майстрів, управління розписанням",
    videoLabel: "[VIDEO: beauty salon booking demo]",
    note: "Майстри керують розкладом, клієнти обирають час — без дзвінків.",
  },
  {
    icon: "🛒",
    title: "E-commerce",
    description: "каталог, кошик, платежі",
    videoLabel: "[VIDEO: e-commerce storefront demo]",
    note: "Повний онлайн-магазин з оплатою, доставкою та управлінням товарами.",
  },
  {
    icon: "🚗",
    title: "Автосервіси",
    description: "запис на обслуговування, управління замовленнями",
    videoLabel: "[VIDEO: auto service booking demo]",
    note: "Клієнт записується онлайн, бачить статус ремонту, отримує рахунок.",
  },
];

function ClickableCard({
  data,
  onOpen,
}: {
  data: ModalData;
  onOpen: (d: ModalData) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(data)}
      className="flex cursor-pointer flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 text-left shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--primary-color)] hover:shadow-[var(--shadow-card-hover)]"
    >
      <span className="mb-3 text-4xl">{data.icon}</span>
      <h3 className="mb-1 text-lg font-semibold text-[var(--text)]">
        {data.title}
      </h3>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        {data.description}
      </p>
      <span className="mt-3 text-xs text-[var(--primary-color)]">
        Натисніть, щоб побачити демо →
      </span>
    </button>
  );
}

export function Slide05({
  onModalOpen,
}: {
  onModalOpen: (d: ModalData) => void;
}) {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-8 md:px-16">
      <h2 className="mb-10 text-center text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
        Для кого це — і які інструменти вони отримують
      </h2>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
        {industryCards.map((c) => (
          <ClickableCard key={c.title} data={c} onOpen={onModalOpen} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 6 — Orders & bookings (video left 60%)
   ═══════════════════════════════════════════════════ */

export function Slide06() {
  return (
    <section className="flex h-full w-full items-center justify-center px-8 md:px-16">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-5">
        {/* Video — large, left */}
        <div className="md:col-span-3">
          <VideoPlaceholder label="[VIDEO PLACEHOLDER: ordering flow]" />
        </div>

        {/* Text — right */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
            Замовлення та бронювання — просто
          </h2>
          <p className="text-xl leading-relaxed text-[var(--text-muted)] md:text-2xl">
            Клієнт оформлює замовлення за два кліки. Ви отримуєте сповіщення
            миттєво.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 7 — Management & legal (clickable → modal)
   ═══════════════════════════════════════════════════ */

export const managementCards: ModalData[] = [
  {
    icon: "📊",
    title: "CRM",
    description: "єдина база клієнтів з історією замовлень",
    videoLabel: "[VIDEO: CRM module demo]",
    note: "Кожен клієнт — з історією замовлень, вподобаннями та статусом. Нічого не губиться.",
  },
  {
    icon: "👥",
    title: "Команда",
    description: "графіки, зміни, розподіл завдань",
    videoLabel: "[VIDEO: team management demo]",
    note: "Розклад роботи, зміни та завдання — все в одному місці для вашої команди.",
  },
  {
    icon: "🛡",
    title: "RODO/GDPR",
    description:
      "вбудована система збору згод, дані зберігаються законно — ви захищені",
    videoLabel: "[VIDEO: GDPR consent flow demo]",
    note: "Автоматичний збір згод, зберігання даних відповідно до законодавства — ви захищені.",
  },
];

function ManagementCard({
  data,
  onOpen,
  highlight,
}: {
  data: ModalData;
  onOpen: (d: ModalData) => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(data)}
      className={`flex cursor-pointer flex-col rounded-[var(--radius)] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] ${
        highlight
          ? "border-2 border-[var(--primary-color)] bg-[var(--primary-color-subtle)] hover:border-[var(--primary-color)]"
          : "border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] hover:border-[var(--primary-color)]"
      }`}
    >
      <span className="mb-2 text-3xl">{data.icon}</span>
      <h3
        className={`mb-1 text-lg font-semibold ${
          highlight ? "text-[var(--primary-color)]" : "text-[var(--text)]"
        }`}
      >
        {data.title}
      </h3>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        {data.description}
      </p>
      <span className="mt-3 text-xs text-[var(--primary-color)]">
        Натисніть, щоб побачити демо →
      </span>
    </button>
  );
}

export function Slide07({
  onModalOpen,
}: {
  onModalOpen: (d: ModalData) => void;
}) {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-8 md:px-16">
      <h2 className="mb-10 text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
        Керування та юридична безпека
      </h2>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {managementCards.map((b, i) => (
          <ManagementCard
            key={b.title}
            data={b}
            onOpen={onModalOpen}
            highlight={i === 2}
          />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 8 — Marketing without code (unchanged)
   ═══════════════════════════════════════════════════ */

export function Slide08() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-8 md:px-16">
      <div className="mb-10 max-w-3xl text-center">
        <h2 className="mb-6 text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
          Маркетинг без кодування
        </h2>
        <p className="text-xl leading-relaxed text-[var(--text-muted)] md:text-2xl">
          Конструктор сторінок — готові блоки, без програмування.
        </p>
        <p className="mt-3 text-xl leading-relaxed text-[var(--text-muted)] md:text-2xl">
          Мультимовність — 6 мов з коробки.
        </p>
      </div>
      <div className="w-full max-w-4xl">
        <VideoPlaceholder label="[ВІДЕО: Побудова сторінки в реальному часі]" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 9 — CTA + QuoVadis iframe
   ═══════════════════════════════════════════════════ */

export function Slide09() {
  return (
    <section className="flex h-full w-full items-center justify-center px-8 md:px-16">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        {/* Left — CTA text */}
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
            А як у вас зараз влаштовано?
          </h2>

          <div className="rounded-2xl bg-[var(--primary-color)] px-8 py-8">
            <p className="text-2xl font-bold text-white sm:text-3xl">
              QUOVADIS — перший місяць безкоштовно
            </p>
            <p className="mt-3 text-sm text-white/80">
              Промокод дійсний тільки для учасників зустрічі
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex aspect-square w-24 items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--surface)]">
              <span className="px-2 text-center text-xs text-[var(--text-muted)]">
                [QR: запис на демо]
              </span>
            </div>
            <p className="text-base text-[var(--text-muted)]">
              hello@gopublica.com · www.gopublica.com
            </p>
          </div>
        </div>

        {/* Right — live QuoVadis site */}
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <iframe
            src="https://www.quovadiskrakow.pl/ua/quo-vadis"
            title="QuoVadis Kraków"
            className="h-[420px] w-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide 10 — QuoVadis: our first client (new)
   ═══════════════════════════════════════════════════ */

export function Slide10() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-8 text-center md:px-16">
      <h2 className="mb-4 text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
        QuoVadis
      </h2>
      <p className="mb-10 max-w-2xl text-lg text-[var(--text-muted)] md:text-xl">
        Саме тут ми сьогодні. Ось як виглядає оцифрований бізнес.
      </p>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* QuoVadis website */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
            <iframe
              src="https://www.quovadiskrakow.pl/ua/quo-vadis"
              title="QuoVadis сайт"
              className="h-[300px] w-full border-0"
              loading="lazy"
            />
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Сайт на власному домені — повний контроль контенту
          </p>
        </div>

        {/* Admin panel */}
        <div className="flex flex-col gap-3">
          <VideoPlaceholder label="[VIDEO: QuoVadis — панель адміністратора]" />
          <p className="text-sm text-[var(--text-muted)]">
            Адмін-панель — меню, замовлення, клієнти — все в одному місці
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Slide registry — used by page.tsx
   ═══════════════════════════════════════════════════ */

/**
 * Slide index → interaction type.
 *   "simple"    — no modal, renders directly
 *   "industry"  — opens an industry modal (Slide 5)
 *   "mgmt"      — opens a management modal (Slide 7)
 */
export const SLIDE_TYPES = [
  "simple",   // 0  Slide01 — Title (video bg)
  "simple",   // 1  Slide02 — Hook
  "simple",   // 2  Slide03 — Live demo
  "simple",   // 3  Slide04 — Observations
  "industry", // 4  Slide05 — Who it's for (modal)
  "simple",   // 5  Slide06 — Orders
  "mgmt",     // 6  Slide07 — Management (modal)
  "simple",   // 7  Slide08 — Marketing
  "simple",   // 8  Slide09 — CTA + iframe
  "simple",   // 9  Slide10 — QuoVadis showcase
] as const;

export const TOTAL = SLIDE_TYPES.length;

/** Simple slides — index maps directly */
export const simpleSlideComponents: React.FC[] = [
  Slide01, Slide02, Slide03, Slide04,
  /* 4 = industry (handled separately) */
  Slide06,
  /* 6 = mgmt (handled separately) */
  Slide08, Slide09, Slide10,
];
