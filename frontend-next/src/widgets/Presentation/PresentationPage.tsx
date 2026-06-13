'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  Video,
  LayoutDashboard,
  Paintbrush,
  ScanEye,
  Zap,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

// ─── Step definitions ─────────────────────────────────────────────────────────
type StepId = 'intro' | 'meeting_1' | 'dashboard' | 'design_phase' | 'meeting_2' | 'activation' | 'done';

interface Step {
  id: StepId;
  Icon: LucideIcon;
  hasMedia: boolean;
  hasHighlight: boolean;
  accent: string;
}

const STEPS: Step[] = [
  { id: 'intro',        Icon: Rocket,          hasMedia: false, hasHighlight: false, accent: '#2563eb' },
  { id: 'meeting_1',    Icon: Video,           hasMedia: true,  hasHighlight: true,  accent: '#2563eb' },
  { id: 'dashboard',    Icon: LayoutDashboard, hasMedia: true,  hasHighlight: false, accent: '#0891b2' },
  { id: 'design_phase', Icon: Paintbrush,      hasMedia: true,  hasHighlight: false, accent: '#7c3aed' },
  { id: 'meeting_2',    Icon: ScanEye,         hasMedia: true,  hasHighlight: false, accent: '#4f46e5' },
  { id: 'activation',   Icon: Zap,             hasMedia: false, hasHighlight: true,  accent: '#16a34a' },
  { id: 'done',         Icon: CheckCircle2,    hasMedia: false, hasHighlight: false, accent: '#16a34a' },
];

// Only the 5 "real" steps (no intro/done) for the sidebar timeline
const CONTENT_STEPS = STEPS.slice(1, -1);

// ─── Media placeholder ────────────────────────────────────────────────────────
// Replace the inner div with <video> or <img> when ready:
//   <video src="/videos/meeting-1.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover rounded-2xl" />
function MediaSlot({ Icon, stepId, accent }: { Icon: LucideIcon; stepId: string; accent: string }) {
  return (
    <div
      className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center gap-4 relative overflow-hidden border"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle at 30% 40%, ${accent}18 0%, transparent 65%)` }}
      />
      <div
        className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}
      >
        <Icon size={32} style={{ color: accent }} strokeWidth={1.5} />
      </div>
      <p className="text-[11px] font-mono relative z-10 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        GIF · VIDEO — {stepId}
      </p>
    </div>
  );
}

// ─── Sidebar timeline dot ─────────────────────────────────────────────────────
function TimelineDot({ step, index, current, onClick }: {
  step: Step; index: number; current: number; onClick: () => void;
}) {
  const realIndex = index + 1; // offset for intro
  const isDone    = current > realIndex;
  const isActive  = current === realIndex;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left group transition-all"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 border"
        style={{
          backgroundColor: isActive ? step.accent : isDone ? `${step.accent}20` : 'var(--surface)',
          borderColor:     isActive ? step.accent : isDone ? `${step.accent}40` : 'var(--border)',
        }}
      >
        <step.Icon
          size={14}
          strokeWidth={2}
          style={{ color: isActive ? '#fff' : isDone ? step.accent : 'var(--text-muted)' }}
        />
      </div>
      <span
        className="text-xs font-medium leading-tight hidden lg:block transition-colors"
        style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}
      >
        {index + 1}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PresentationPage() {
  const t = useTranslations('presentation');
  const [current, setCurrent] = useState(0);
  const [dir, setDir]         = useState<'next' | 'prev'>('next');
  const [fading, setFading]   = useState(false);

  const goTo = useCallback((index: number, direction: 'next' | 'prev') => {
    if (fading) return;
    setDir(direction);
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 180);
  }, [fading]);

  const next = useCallback(() => { if (current < STEPS.length - 1) goTo(current + 1, 'next'); }, [current, goTo]);
  const prev = useCallback(() => { if (current > 0) goTo(current - 1, 'prev'); },                [current, goTo]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
      if (['ArrowLeft',  'ArrowUp'].includes(e.key))        { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [next, prev]);

  const step    = STEPS[current];
  const isFirst = current === 0;
  const isLast  = current === STEPS.length - 1;

  const slideClasses = [
    'transition-all duration-[180ms]',
    fading
      ? dir === 'next' ? 'opacity-0 translate-x-3' : 'opacity-0 -translate-x-3'
      : 'opacity-100 translate-x-0',
  ].join(' ');

  return (
    <div className="min-h-screen flex flex-col select-none overflow-hidden" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-6 md:px-10 py-3 flex-shrink-0 border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--primary-color)' }}>
          GoPublica
        </span>

        {/* Progress bar */}
        <div className="flex-1 max-w-xs mx-8 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(current / (STEPS.length - 1)) * 100}%`,
              backgroundColor: 'var(--primary-color)',
            }}
          />
        </div>

        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {String(current + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(STEPS.length).padStart(2, '0')}
        </span>
      </header>

      {/* ── Body: sidebar + slide ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — timeline (hidden on small screens) */}
        <aside
          className="hidden md:flex flex-col justify-center gap-2 px-4 py-8 w-20 lg:w-24 flex-shrink-0 border-r"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          {CONTENT_STEPS.map((s, i) => (
            <TimelineDot
              key={s.id}
              step={s}
              index={i}
              current={current}
              onClick={() => goTo(i + 1, i + 1 > current ? 'next' : 'prev')}
            />
          ))}
        </aside>

        {/* Slide area */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-10 lg:px-16 py-6 relative overflow-hidden">

          {/* Ghost step number */}
          {!isFirst && !isLast && (
            <div
              aria-hidden
              className="pointer-events-none absolute -right-4 bottom-0 text-[25vw] font-black leading-none select-none"
              style={{ color: 'var(--border)', opacity: 0.7 }}
            >
              {String(current).padStart(2, '0')}
            </div>
          )}

          <div className={`w-full ${!isFirst && !isLast && step.hasMedia ? 'max-w-6xl' : 'max-w-4xl'} ${slideClasses}`}>

            {/* ── Intro ── */}
            {isFirst && (
              <div className="text-center py-10">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 rounded-full blur-3xl opacity-20 scale-150" style={{ backgroundColor: 'var(--primary-color)' }} />
                  <div
                    className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <Rocket size={36} style={{ color: 'var(--primary-color)' }} strokeWidth={1.5} />
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4" style={{ color: 'var(--text)' }}>
                  {t('steps.intro.title')}
                </h1>
                <p className="text-lg md:text-xl max-w-lg mx-auto leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
                  {t('steps.intro.subtitle')}
                </p>

                {/* Step preview row */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                  {CONTENT_STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goTo(i + 1, 'next')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                      style={{ backgroundColor: 'var(--surface)', border: `1px solid ${s.accent}30`, color: 'var(--text-muted)' }}
                    >
                      <s.Icon size={13} style={{ color: s.accent }} strokeWidth={2} />
                      <span>{i + 1}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:opacity-90 active:scale-95 shadow-md"
                  style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
                >
                  {t('start_button')} →
                </button>
              </div>
            )}

            {/* ── Done ── */}
            {isLast && (
              <div className="text-center py-10">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: '#16a34a15', border: '1px solid #16a34a30' }}
                >
                  <CheckCircle2 size={48} style={{ color: '#16a34a' }} strokeWidth={1.5} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#16a34a' }}>
                  {t('steps.done.title')}
                </h2>
                <p className="text-lg max-w-md mx-auto leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
                  {t('steps.done.subtitle')}
                </p>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-10">
                  {[
                    { label: '1st month', value: '€0',   color: '#16a34a' },
                    { label: 'Setup fee', value: '~€300', color: 'var(--primary-color)' },
                    { label: 'Monthly',   value: '€39',  color: '#7c3aed' },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="rounded-xl px-3 py-4 text-center"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={prev}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}
                >
                  ← {t('nav_prev')}
                </button>
              </div>
            )}

            {/* ── Regular step ── */}
            {!isFirst && !isLast && (
              <div className={`grid grid-cols-1 items-center gap-8 lg:gap-12 ${step.hasMedia ? 'lg:grid-cols-[2fr_3fr]' : 'lg:grid-cols-2 lg:gap-16'}`}>

                {/* Left — text */}
                <div>
                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${step.accent}15`, border: `1px solid ${step.accent}30` }}
                    >
                      <step.Icon size={20} style={{ color: step.accent }} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest" style={{ color: step.accent }}>
                      {t('step_label')} {current}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-5" style={{ color: 'var(--text)' }}>
                    {t(`steps.${step.id}.title`)}
                  </h2>
                  <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                    {t(`steps.${step.id}.description`)}
                  </p>

                  {step.hasHighlight && (
                    <div
                      className="rounded-xl px-5 py-4 text-sm leading-relaxed"
                      style={{
                        backgroundColor: `${step.accent}10`,
                        border: `1px solid ${step.accent}28`,
                        color: 'var(--text)',
                      }}
                    >
                      {t(`steps.${step.id}.highlight`)}
                    </div>
                  )}
                </div>

                {/* Right — media or icon card */}
                <div className="flex justify-center lg:justify-end">
                  {step.hasMedia ? (
                    <div className="w-full">
                      <MediaSlot Icon={step.Icon} stepId={step.id} accent={step.accent} />
                    </div>
                  ) : (
                    <div
                      className="w-44 h-44 rounded-3xl flex items-center justify-center"
                      style={{ backgroundColor: `${step.accent}10`, border: `1px solid ${step.accent}25` }}
                    >
                      <step.Icon size={72} style={{ color: step.accent }} strokeWidth={1} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Bottom nav ── */}
      <footer
        className="flex items-center justify-between px-6 md:px-10 py-3 flex-shrink-0 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <button
          onClick={prev}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-0 disabled:pointer-events-none"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--bg)' }}
        >
          ← {t('nav_prev')}
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5 items-center">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 'next' : 'prev')}
              className="rounded-full transition-all duration-300"
              style={{
                width:           i === current ? 18 : 6,
                height:          6,
                backgroundColor: i === current ? s.accent : 'var(--border)',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={isLast}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-0 disabled:pointer-events-none shadow-sm"
          style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
        >
          {t('nav_next')} →
        </button>
      </footer>
    </div>
  );
}