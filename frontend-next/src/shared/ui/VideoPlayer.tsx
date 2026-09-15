'use client';

import { useEffect, useRef, useCallback } from 'react';

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
}

/**
 * Client-side video component with IntersectionObserver-based play/pause.
 * Automatically pauses when scrolled out of view to save memory.
 */
export default function VideoPlayer({ src, poster, autoPlay, ...props }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isVisibleRef = useRef(false);

  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVisibleRef.current) return;
    video.play().catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          // Wait for video to be ready before playing
          if (video.readyState >= 2) {
            video.play().catch(() => {});
          } else {
            video.addEventListener('loadeddata', tryPlay, { once: true });
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.removeEventListener('loadeddata', tryPlay);
    };
  }, [tryPlay]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      preload="none"
      autoPlay={autoPlay}
      {...props}
    />
  );
}
