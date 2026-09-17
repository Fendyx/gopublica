"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SLIDE_TYPES,
  TOTAL,
  simpleSlideComponents,
  Slide05,
  Slide07,
} from "./_components/Slides";
import PitchModal, { type ModalData } from "./_components/Modal";

/* ═══════════════════════════════════════════════════
   Resolve slide component by index
   ═══════════════════════════════════════════════════ */

/** Indices of "simple" slides in order they appear */
const SIMPLE_INDICES = SLIDE_TYPES.reduce<number[]>((acc, t, i) => {
  if (t === "simple") acc.push(i);
  return acc;
}, []);

function resolveSlide(
  idx: number,
  onModalOpen: (d: ModalData) => void,
): React.ReactNode {
  const type = SLIDE_TYPES[idx];
  if (type === "industry") return <Slide05 onModalOpen={onModalOpen} />;
  if (type === "mgmt") return <Slide07 onModalOpen={onModalOpen} />;

  /* simple — look up position in the simple array */
  const pos = SIMPLE_INDICES.indexOf(idx);
  const Component = simpleSlideComponents[pos];
  return <Component />;
}

/* ═══════════════════════════════════════════════════
   Page component
   ═══════════════════════════════════════════════════ */

export default function PitchPage() {
  const [idx, setIdx] = useState(0);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const next = useCallback(
    () => setIdx((i) => Math.min(i + 1, TOTAL - 1)),
    [],
  );
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  /* ── Keyboard navigation (disabled when modal open) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalData) return; // modal handles its own Escape
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, modalData]);

  const openModal = useCallback(
    (d: ModalData) => {
      setModalData(d);
    },
    [],
  );
  const closeModal = useCallback(() => setModalData(null), []);

  return (
    <div
      className="relative h-dvh w-dvw overflow-hidden bg-[var(--bg)]"
      onClick={next}
    >
      {/* ── Slides ────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {resolveSlide(idx, openModal)}
        </motion.div>
      </AnimatePresence>

      {/* ── Modal ─────────────────────────────────── */}
      <PitchModal data={modalData} onClose={closeModal} />

      {/* ── Counter ────────────────────────────────── */}
      <span className="fixed bottom-6 right-8 z-20 select-none text-sm tabular-nums text-[var(--text-muted)]">
        {idx + 1} / {TOTAL}
      </span>

      {/* ── Progress dots ──────────────────────────── */}
      <div
        className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDE_TYPES.map((_, i) => (
          <button
            key={i}
            aria-label={`Слайд ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full transition-colors duration-200 ${
              i === idx
                ? "bg-[var(--primary-color)]"
                : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
