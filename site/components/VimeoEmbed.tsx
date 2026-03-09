"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Player from "@vimeo/player";
import styles from "./VimeoEmbed.module.css";

interface VimeoEmbedProps {
  /** Vimeo video ID, e.g. "123456789" */
  vimeoId: string;
  /** Alt text */
  alt?: string;
  /** Extra class on the outer wrapper */
  className?: string;
  /** Fires once the video has started playing (buffered & rendering frames) */
  onPlaying?: () => void;
}

/**
 * Vimeo background-mode player.
 *
 * - Autoplays, loops, muted (background=1)
 * - No player chrome
 * - Fills its container via oversized iframe + overflow: hidden
 * - Parent stacks a thumbnail <img> on top; this component
 *   just renders the iframe and stays behind.
 * - Calls onPlaying once video begins actual playback.
 */
export const VimeoEmbed: React.FC<VimeoEmbedProps> = ({
  vimeoId,
  alt = "",
  className,
  onPlaying,
}) => {
  const [inView, setInView] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firedRef = useRef(false);

  // Lazy-load: only mount iframe once wrapper scrolls into view
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Detect playback via Vimeo Player SDK
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || firedRef.current) return;

    try {
      const player = new Player(iframe);
      player.on("playing", () => {
        if (!firedRef.current) {
          firedRef.current = true;
          onPlaying?.();
        }
        player.off("playing");
      });
    } catch {
      // If SDK fails, fire after a short fallback delay
      setTimeout(() => {
        if (!firedRef.current) {
          firedRef.current = true;
          onPlaying?.();
        }
      }, 3000);
    }
  }, [onPlaying]);

  const embedUrl = `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1&autopause=0`;

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${className ?? ""}`}
    >
      {inView && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className={styles.iframe}
          allow="autoplay; fullscreen"
          title={alt || `Vimeo video ${vimeoId}`}
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
};
