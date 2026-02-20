"use client";

import React, { useRef, useState, useEffect } from "react";
import { imageRevealConfig } from "@/lib/levaConfig";
import { observe } from "@/lib/sharedObserver";
import styles from "./ScrollImageReveal.module.css";

const PIXEL_STEPS = 6;

interface ScrollImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export const ScrollImageReveal: React.FC<ScrollImageRevealProps> = ({
  src,
  alt,
  className,
  loading = "lazy",
}) => {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const rafRef    = useRef(0);

  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(!window.matchMedia("(pointer: fine)").matches);
  }, []);

  /* ---- Handle cached / already-loaded images ---- */
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  /* ---- Intersection Observer (shared) ---- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    return observe(el, setVisible, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  }, []);

  /* ---- Pixelation animation (desktop only) ---- */
  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !loaded) return;

    const { pixelate, pixelStart, duration } = imageRevealConfig;
    const resolveMs = duration * 0.85;

    if (!pixelate) {
      canvas.style.opacity = "0";
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the displayed size (CSS pixels) so block size is visually consistent
    const displayW = img.clientWidth;
    const displayH = img.clientHeight;
    if (displayW === 0 || displayH === 0) return;

    // Set canvas internal resolution to match display size (1:1 CSS pixel mapping)
    canvas.width  = displayW;
    canvas.height = displayH;

    // Offscreen buffer so we never read and write the visible canvas in the
    // same drawImage call (that caused a ghost-image artefact in the top-left).
    const offscreen = document.createElement("canvas");
    const offCtx    = offscreen.getContext("2d")!;

    const drawPixelated = (blockSize: number) => {
      const cols = Math.max(1, Math.ceil(displayW / blockSize));
      const rows = Math.max(1, Math.ceil(displayH / blockSize));

      // Shrink image into the tiny offscreen buffer (bilinear)
      offscreen.width  = cols;
      offscreen.height = rows;
      offCtx.drawImage(img, 0, 0, cols, rows);

      // Scale the tiny buffer up to the visible canvas (nearest-neighbor → mosaic)
      ctx.clearRect(0, 0, displayW, displayH);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, cols, rows, 0, 0, displayW, displayH);
    };

    // Build step sizes: e.g. 48 → 29 → 17 → 10 → 6 → 4 → 1
    const sizes: number[] = [];
    let s = pixelStart;
    for (let i = 0; i < PIXEL_STEPS; i++) {
      sizes.push(Math.max(2, Math.round(s)));
      s *= 0.6;
    }
    sizes.push(1);

    if (visible) {
      canvas.style.opacity = "1";
      const stepDuration = resolveMs / sizes.length;

      // Draw the first (most pixelated) frame immediately
      drawPixelated(sizes[0]);

      // Animate remaining steps via rAF — stays in sync with the paint cycle
      // so it never starves the scroll's rAF loop
      const startTime = performance.now();
      let lastStep = 0;

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const step = Math.min(sizes.length - 1, Math.floor(elapsed / stepDuration));

        if (step !== lastStep) {
          lastStep = step;
          if (sizes[step] <= 1) {
            canvas.style.opacity = "0";
            return; // done
          }
          drawPixelated(sizes[step]);
        }

        if (step < sizes.length - 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      drawPixelated(pixelStart);
      canvas.style.opacity = "1";
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible, loaded, isMobile]);

  // Read config for CSS transitions (re-read each render)
  const { duration, travel } = imageRevealConfig;

  // Only reveal once the image is BOTH in viewport AND loaded (has dimensions)
  const active = visible && loaded;

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ""}`}
      style={{
        opacity:    active ? 1 : 0,
        transform:  active ? "translateY(0)" : `translateY(${travel}px)`,
        transition: active
          ? `opacity ${duration * 0.4}ms ease-out, transform ${duration}ms ease-out`
          : `opacity 200ms ease-in, transform 200ms ease-in`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={styles.image}
        loading={loading}
        onLoad={() => setLoaded(true)}
      />
      {!isMobile && <canvas ref={canvasRef} className={styles.canvas} />}
    </div>
  );
};
