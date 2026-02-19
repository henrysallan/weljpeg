"use client";

import React, { useRef, useState, useEffect } from "react";
import { imageRevealConfig } from "@/lib/levaConfig";
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
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const parallaxRef = useRef(0);  // current parallax offset (px)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(!window.matchMedia("(pointer: fine)").matches);
  }, []);

  /* ---- Parallax on scroll (desktop only) ---- */
  useEffect(() => {
    if (isMobile) return;
    const wrap = wrapRef.current;
    if (!wrap || !loaded) return;

    const RANGE   = 30;            // max px the image drifts up/down
    let ticking   = false;

    const update = () => {
      ticking = false;
      const rect = wrap.getBoundingClientRect();
      const vh   = window.innerHeight;
      // 0 when element bottom touches viewport top, 1 when top touches viewport bottom
      const t = (rect.top + rect.height) / (vh + rect.height);
      // Map to -RANGE … +RANGE
      const offset = (t - 0.5) * 2 * RANGE;
      parallaxRef.current = offset;

      // Apply directly to img + canvas via transform (no re-render)
      // scale(1.22) is set in CSS — we only add the translateY here
      const imgEl    = imgRef.current;
      const canvasEl = canvasRef.current;
      const tx = `scale(1.22) translateY(${offset}px)`;
      if (imgEl)    imgEl.style.transform = tx;
      if (canvasEl) canvasEl.style.transform = tx;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // initial position
    return () => window.removeEventListener("scroll", onScroll);
  }, [loaded, isMobile]);

  /* ---- Handle cached / already-loaded images ---- */
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  /* ---- Intersection Observer ---- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
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

    // Clear any pending step timers from previous runs
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const drawPixelated = (blockSize: number) => {
      // How many mosaic cells fit across each axis
      const cols = Math.max(1, Math.ceil(displayW / blockSize));
      const rows = Math.max(1, Math.ceil(displayH / blockSize));

      // Draw the image tiny, then upscale with nearest-neighbor
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, displayW, displayH);

      // Step 1: draw image downscaled into top-left corner
      ctx.drawImage(img, 0, 0, cols, rows);

      // Step 2: grab those pixels
      const pixelData = ctx.getImageData(0, 0, cols, rows);

      // Step 3: clear and draw each block as a filled rect
      ctx.clearRect(0, 0, displayW, displayH);
      const data = pixelData.data;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
          ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
      }
    };

    if (visible) {
      canvas.style.opacity = "1";

      // Build step sizes: e.g. 48 → 29 → 17 → 10 → 6 → 4 → 1
      const sizes: number[] = [];
      let s = pixelStart;
      for (let i = 0; i < PIXEL_STEPS; i++) {
        sizes.push(Math.max(2, Math.round(s)));
        s *= 0.6;
      }
      sizes.push(1);

      const stepDuration = resolveMs / sizes.length;

      // Draw the first (most pixelated) frame immediately
      drawPixelated(sizes[0]);

      // Schedule each subsequent step
      for (let i = 1; i < sizes.length; i++) {
        const timer = setTimeout(() => {
          if (sizes[i] <= 1) {
            canvas.style.opacity = "0";
          } else {
            drawPixelated(sizes[i]);
          }
        }, stepDuration * i);
        timersRef.current.push(timer);
      }
    } else {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      drawPixelated(pixelStart);
      canvas.style.opacity = "1";
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [visible, loaded, isMobile]);

  // Read config for CSS transitions (re-read each render)
  const { blur, blurAmount, duration, travel } = imageRevealConfig;

  // Only reveal once the image is BOTH in viewport AND loaded (has dimensions)
  const active = visible && loaded;

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ""}`}
      style={{
        opacity:    active ? 1 : 0,
        transform:  active ? "translateY(0)" : `translateY(${travel}px)`,
        filter:     blur
          ? (active ? "blur(0px)" : `blur(${blurAmount}px)`)
          : "none",
        transition: active
          ? `opacity ${duration * 0.4}ms ease-out, transform ${duration}ms ease-out, filter 250ms ease-out`
          : `opacity 200ms ease-in, transform 200ms ease-in, filter 150ms ease-in`,
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
