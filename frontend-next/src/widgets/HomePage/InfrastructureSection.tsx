'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import AnimatedCounter from '@/shared/ui/AnimatedCounter';

/* ══════════════════════════════════════════════════════════════════════════════
   PAYMENT LOGOS — powered by /logos/*.svg
   ══════════════════════════════════════════════════════════════════════════════ */

function LogoApplePay({ className }: { className?: string }) {
  return <Image alt="Apple Pay" className={className} height={40} src="/logos/Apple_Pay_logo.svg" width={120} />;
}

function LogoGooglePay({ className }: { className?: string }) {
  return <Image alt="Google Pay" className={className} height={40} src="/logos/Google_Pay_Logo.svg" width={120} />;
}

function LogoVisa({ className }: { className?: string }) {
  return <Image alt="Visa" className={className} height={40} src="/logos/visa.svg" width={100} />;
}

function LogoBlik({ className }: { className?: string }) {
  return <Image alt="BLIK" className={className} height={40} src="/logos/blik.svg" width={100} />;
}

/* ══════════════════════════════════════════════════════════════════════════════
   LOGISTICS LOGOS — powered by /logos/*.svg (or .png)
   ══════════════════════════════════════════════════════════════════════════════ */

function LogoInPost({ className }: { className?: string }) {
  return <Image alt="InPost" className={className} height={40} src="/logos/inpost_logo.svg" width={120} />;
}

function LogoDPD({ className }: { className?: string }) {
  return <Image alt="DPD" className={className} height={40} src="/logos/dpd_logo.svg" width={100} />;
}

function LogoDHL({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 48" fill="none" className={className}>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="700" fontFamily="system-ui, sans-serif">DHL</text>
    </svg>
  );
}

function LogoFedEx({ className }: { className?: string }) {
  return <Image alt="FedEx" className={className} height={40} src="/logos/fedex_logo.svg" width={120} />;
}

function LogoUPS({ className }: { className?: string }) {
  return <Image alt="UPS" className={className} height={40} src="/logos/ups_logo.svg" width={80} />;
}

function LogoPocztaPolska({ className }: { className?: string }) {
  return <Image alt="Poczta Polska" className={className} height={40} src="/logos/poczta_polska_logo.svg" width={100} />;
}

function LogoOrlenPaczka({ className }: { className?: string }) {
  return <Image alt="Orlen Paczka" className={className} height={40} src="/logos/Orlen_paczka_logo.svg" width={80} />;
}

function LogoGLS({ className }: { className?: string }) {
  return <Image alt="GLS" className={className} height={40} src="/logos/GLS_Logo.svg" width={120} />;
}

function LogoAmbroExpress({ className }: { className?: string }) {
  return <Image alt="Ambro Express" className={className} height={40} src="/logos/ambro_express_logo.png" width={120} />;
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAYMENTS SECTION - Full-width dark immersive
   ══════════════════════════════════════════════════════════════════════════════ */

const paymentLogos = [
  { Logo: LogoApplePay, delay: 0, x: -140, y: -70 },
  { Logo: LogoGooglePay, delay: 0.3, x: 120, y: -90 },
  { Logo: LogoVisa, delay: 0.6, x: -110, y: 80 },
  { Logo: LogoBlik, delay: 0.9, x: 150, y: 60 },
];

function FloatingLogo({
  Logo,
  delay,
  x,
  y,
}: {
  Logo: React.ComponentType<{ className?: string }>;
  delay: number;
  x: number;
  y: number;
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-10 hidden md:block"
      style={{ x: x - 60, y: y - 20 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5 + delay }}
    >
      <motion.div
        animate={{ y: [0, -8, 0, 6, 0] }}
        transition={{
          duration: 5 + delay,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-3 shadow-lg shadow-black/20">
          <Logo className="h-7 w-auto text-white/70" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function CheckoutMockup() {
  const t = useTranslations('home.infrastructure');
  return (
    <motion.div
      className="relative w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-white/50">{t('payments.checkout.header')}</span>
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--primary-color)]/20 flex items-center justify-center">
              <span className="text-sm">🛒</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/80 truncate">{t('payments.checkout.planName')}</div>
              <div className="text-xs text-white/40">{t('payments.checkout.planDesc')}</div>
            </div>
            <div className="text-sm font-semibold text-white/90 shrink-0">{t('payments.checkout.planPrice')}</div>
          </div>
        </div>

        {/* Card number field */}
        <div className="mb-3">
          <label className="block text-xs text-white/40 mb-1.5">{t('payments.checkout.cardNumber')}</label>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-4 w-6 rounded bg-white/10" />
              <span className="h-4 w-6 rounded bg-white/10" />
              <span className="h-4 w-6 rounded bg-white/10" />
              <span className="h-4 w-6 rounded bg-white/10" />
            </div>
            <span className="text-xs text-white/30 ml-auto">••••</span>
          </div>
        </div>

        {/* Expiry + CVC */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1.5">{t('payments.checkout.expiry')}</label>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/30">
              MM / YY
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1.5">{t('payments.checkout.cvc')}</label>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/30">
              •••
            </div>
          </div>
        </div>

        {/* Pay button */}
        <div className="rounded-xl bg-[var(--primary-color)] py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-[var(--primary-color)]/25">
          {t('payments.checkout.payBtn')}
        </div>

        {/* Powered by */}
        <div className="mt-4 text-center">
          <span className="text-[10px] text-white/25 uppercase tracking-widest">{t('payments.checkout.poweredBy')}</span>
        </div>
      </div>
    </motion.div>
  );
}

function PaymentsSection() {
  const t = useTranslations('home.infrastructure');
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#0a0f1e] py-24 md:py-32"
    >
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-[var(--primary-color)]/10 blur-[100px]" />
        <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-16 md:flex-row md:items-center md:justify-between">
          {/* Left - Typography & Stats */}
          <motion.div
            className="max-w-lg text-center md:text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--primary-color)]">
              {t('payments.eyebrow')}
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
              {t('payments.title')}
              <br />
              <span className="text-white/40">{t('payments.titleMuted')}</span>
            </h2>

            {/* Stats row */}
            <div className="flex gap-12 justify-center md:justify-start">
              <div>
                <AnimatedCounter
                  target={100}
                  suffix="+"
                  className="text-5xl md:text-6xl font-bold text-white tabular-nums"
                  duration={2.5}
                />
                <p className="mt-2 text-sm text-white/40">{t('payments.statMethods')}</p>
              </div>
              <div>
                <AnimatedCounter
                  target={15}
                  suffix="%"
                  className="text-5xl md:text-6xl font-bold text-white tabular-nums"
                  duration={2}
                />
                <p className="mt-2 text-sm text-white/40">{t('payments.statConversion')}</p>
              </div>
            </div>
          </motion.div>

          {/* Right - Checkout mockup with floating logos */}
          <div className="relative flex items-center justify-center w-full md:w-auto min-h-[420px]">
            {/* Floating logos around the checkout */}
            {isInView &&
              paymentLogos.map(({ Logo, delay, x, y }, i) => (
                <FloatingLogo key={i} Logo={Logo} delay={delay} x={x} y={y} />
              ))}
            <CheckoutMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LOGISTICS SECTION - Full-width with logo marquee + route SVG
   ══════════════════════════════════════════════════════════════════════════════ */

const logisticsLogos = [
  { Logo: LogoInPost, label: 'InPost' },
  { Logo: LogoDPD, label: 'DPD' },
  { Logo: LogoDHL, label: 'DHL' },
  { Logo: LogoFedEx, label: 'FedEx' },
  { Logo: LogoUPS, label: 'UPS' },
  { Logo: LogoPocztaPolska, label: 'Poczta Polska' },
  { Logo: LogoOrlenPaczka, label: 'Orlen Paczka' },
  { Logo: LogoGLS, label: 'GLS' },
  { Logo: LogoAmbroExpress, label: 'Ambro Express' },
];

function LogoMarqueeRow({ reverse = false, speed = 30 }: { reverse?: boolean; speed?: number }) {
  // 4× duplication for seamless loop
  const items = [...logisticsLogos, ...logisticsLogos, ...logisticsLogos, ...logisticsLogos];

  return (
    <div className="relative flex overflow-hidden">
      {/* Gradient masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent" />

      <motion.div
        className="flex shrink-0 items-center gap-10"
        animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {items.map(({ Logo, label }, i) => (
          <div
            key={`${label}-${i}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-7 py-4 shadow-sm"
          >
            <Logo className="h-8 w-auto text-[var(--text-muted)]" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function DeliveryRouteSVG() {
  const t = useTranslations('home.infrastructure');
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const routePath =
    'M 40 80 C 80 80, 120 40, 200 40 C 280 40, 300 70, 400 60 C 480 52, 540 30, 620 30 C 680 30, 740 50, 800 50';

  return (
    <svg
      ref={ref}
      viewBox="0 0 840 120"
      fill="none"
      className="w-full h-auto max-w-4xl mx-auto my-12"
    >
      {/* Dashed route */}
      <motion.path
        d={routePath}
        stroke="var(--primary-color)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="8 6"
        fill="none"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={isInView ? { pathLength: 1, opacity: 0.3 } : {}}
        transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Start node - Warehouse */}
      <motion.circle
        cx="40"
        cy="80"
        r="6"
        fill="var(--primary-color)"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      <motion.text
        x="40"
        y="108"
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4 }}
      >
        {t('logistics.warehouse')}
      </motion.text>

      {/* Hub node */}
      <motion.circle
        cx="400"
        cy="60"
        r="6"
        fill="var(--primary-color)"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      <motion.text
        x="400"
        y="88"
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.0 }}
      >
        {t('logistics.hub')}
      </motion.text>

      {/* End node - Customer */}
      <motion.circle
        cx="800"
        cy="50"
        r="6"
        fill="var(--primary-color)"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.4 }}
      />
      <motion.text
        x="800"
        y="78"
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.6 }}
      >
        {t('logistics.customer')}
      </motion.text>

      {/* Traveling package dot */}
      {isInView && (
        <>
          <motion.circle
            cx="0"
            cy="0"
            r="5"
            fill="var(--primary-color)"
            style={{
              offsetPath: `path("${routePath}")`,
              offsetDistance: '0%',
            }}
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{
              duration: 3.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.3,
            }}
          />
          {/* Glow */}
          <motion.circle
            cx="0"
            cy="0"
            r="14"
            fill="var(--primary-color)"
            opacity={0.12}
            style={{
              offsetPath: `path("${routePath}")`,
              offsetDistance: '0%',
            }}
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{
              duration: 3.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.3,
            }}
          />
        </>
      )}
    </svg>
  );
}

function LogisticsSection() {
  const t = useTranslations('home.infrastructure');
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[var(--bg)] py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] mb-6 leading-[1.1]">
            {t('logistics.heading')}
          </h2>
        </motion.div>

        {/* Logo marquee - top row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <LogoMarqueeRow speed={28} />
        </motion.div>

        {/* Delivery route SVG */}
        <DeliveryRouteSVG />

        {/* Logo marquee - bottom row (reversed) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <LogoMarqueeRow reverse speed={32} />
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT - Stacked full-width sections
   ══════════════════════════════════════════════════════════════════════════════ */

export default function InfrastructureSection() {
  return (
    <>
      <PaymentsSection />
      <LogisticsSection />
    </>
  );
}
