"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";

const ROTATING_WORDS = ["portfolio", "store", ,"empire", "platform", "business", "website"];
const ROTATION_INTERVAL_MS = 2200;

export default function HeroSectionV2() {
  const [wordIndex, setWordIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cycle the rotating word on an interval
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Close on Escape + lock scroll while modal is open
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen, closeModal]);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/test_hero.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-10 bg-black/60" />

      {/* Content */}
      <div className="relative z-20 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        {/* Headline */}
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          <span>Launch your dream </span>
          <span className="relative inline-block h-[1.2em] w-full min-w-[8ch] overflow-hidden align-bottom sm:min-w-[7ch]">
            <AnimatePresence mode="wait">
              <motion.span
                key={ROTATING_WORDS[wordIndex]}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 bg-clip-text text-transparent"
              >
                {ROTATING_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-base text-gray-200 sm:text-lg md:text-xl">
          Zero risk. We build your site first. You only pay when you absolutely love it.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-shadow hover:shadow-[0_0_40px_rgba(99,102,241,0.8)] sm:w-auto"
          >
            Get Your Free Website
          </motion.button>

          <motion.button
            type="button"
            onClick={openModal}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:w-auto"
          >
            <Play className="h-5 w-5" />
            Watch how it works
          </motion.button>
        </div>
      </div>

      {/* Video modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative w-full max-w-4xl px-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close video"
                className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:-top-4 sm:-right-12"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
                <video
                  className="aspect-video w-full"
                  src="/videos/founder-pitch.mp4"
                  controls
                  autoPlay
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}