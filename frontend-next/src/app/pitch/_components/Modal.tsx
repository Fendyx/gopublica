"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export interface ModalData {
  title: string;
  icon: string;
  description: string;
  videoLabel: string;
  note?: string;
}

interface PitchModalProps {
  data: ModalData | null;
  onClose: () => void;
}

export default function PitchModal({ data, onClose }: PitchModalProps) {
  /* close on Escape */
  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key="pitch-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="pitch-modal-card"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pitch-modal-shatter relative mx-4 flex w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ─────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-8 py-5">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{data.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text)]">
                    {data.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    {data.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--text)]"
                aria-label="Закрити"
              >
                ✕
              </button>
            </div>

            {/* ── Video placeholder ──────────────────── */}
            <div className="flex aspect-video w-full items-center justify-center bg-[var(--bg)]">
              <span className="text-sm text-[var(--text-muted)]">
                {data.videoLabel}
              </span>
            </div>

            {/* ── Optional note ──────────────────────── */}
            {data.note && (
              <div className="border-t border-[var(--border)] px-8 py-4">
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  {data.note}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
