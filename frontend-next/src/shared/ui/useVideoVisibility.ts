'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook that pauses a video when it scrolls out of the viewport
 * and resumes it when it comes back into view.
 *
 * Returns a ref to attach to the <video> element.
 * Optionally accepts `shouldPlay` to control play/pause externally.
 */
export function useVideoVisibility(shouldPlay = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible && shouldPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible, shouldPlay]);

  return videoRef;
}

/**
 * Hook that loads video source lazily (only when near viewport)
 * AND auto-plays/pauses based on visibility.
 *
 * Sets src directly on the DOM element to avoid React re-render timing issues.
 * Returns a ref to attach to the <video> element.
 */
export function useLazyVideoAutoplay(src: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Set src directly on DOM to avoid React render timing issues
    if (!loadedRef.current) {
      video.src = src;
      video.load();
      loadedRef.current = true;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return videoRef;
}
