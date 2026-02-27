"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import styles from "./ContentBlock.module.css";

const PIXEL_START  = 48;     // max block size (fully pixelated)
const PIXELATE_MS  = 400;   // time to fully pixelate
const HOLD_MS      = 120;   // pause while swapped (fully pixelated)
const RESOLVE_MS   = 400;   // time to de-pixelate
const CYCLE_PAUSE  = 3000;  // pause between swaps

interface CaseStudyGalleryProps {
  images: { src: string; alt: string }[];
}

/** Ease-in-out cubic for smooth acceleration/deceleration */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Compute the destination rect that replicates CSS `object-fit: contain`.
 * Returns { dx, dy, dw, dh } — the area within the canvas to draw into.
 */
function containRect(
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (nw === 0 || nh === 0) return { dx: 0, dy: 0, dw: canvasW, dh: canvasH };

  const imgRatio    = nw / nh;
  const canvasRatio = canvasW / canvasH;

  let dw: number, dh: number;
  if (imgRatio > canvasRatio) {
    // Image is wider → fit to width, letterbox top/bottom
    dw = canvasW;
    dh = canvasW / imgRatio;
  } else {
    // Image is taller → fit to height, letterbox sides
    dh = canvasH;
    dw = canvasH * imgRatio;
  }
  const dx = canvasW - dw; // right-aligned to match object-position: right top
  const dy = 0;            // top-aligned
  return { dx, dy, dw, dh };
}

/**
 * Compute the source crop rect that replicates CSS `object-fit: cover`.
 * Returns { sx, sy, sw, sh } — the region of the source image to draw.
 */
function coverCrop(
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (nw === 0 || nh === 0) return { sx: 0, sy: 0, sw: nw, sh: nh };

  const imgRatio    = nw / nh;
  const canvasRatio = canvasW / canvasH;

  let sw: number, sh: number, sx: number, sy: number;
  if (imgRatio > canvasRatio) {
    sh = nh;
    sw = nh * canvasRatio;
    sx = (nw - sw) / 2;
    sy = 0;
  } else {
    sw = nw;
    sh = nw / canvasRatio;
    sx = 0;
    sy = (nh - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

type FitMode = "contain" | "cover";

/** Draw an image pixelated onto a canvas at a given block size */
function drawPixelated(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  blockSize: number,
  fit: FitMode = "contain",
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  if (blockSize <= 1) {
    canvas.style.opacity = "0";
    return;
  }

  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;

  if (fit === "cover") {
    // Cover: crop source to fill entire canvas
    const { sx, sy, sw, sh } = coverCrop(img, w, h);
    const cols = Math.max(1, Math.ceil(w / blockSize));
    const rows = Math.max(1, Math.ceil(h / blockSize));
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const offCtx = off.getContext("2d")!;
    offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
    ctx.drawImage(off, 0, 0, cols, rows, 0, 0, w, h);
  } else {
    // Contain: fit full image into destination rect
    const { dx, dy, dw, dh } = containRect(img, w, h);
    const cols = Math.max(1, Math.ceil(dw / blockSize));
    const rows = Math.max(1, Math.ceil(dh / blockSize));
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const offCtx = off.getContext("2d")!;
    offCtx.drawImage(img, 0, 0, cols, rows);
    ctx.drawImage(off, 0, 0, cols, rows, dx, dy, dw, dh);
  }

  canvas.style.opacity = "1";
}

/**
 * Animate pixelation continuously.
 *  - "in"  = clear → fully pixelated (block size 1 → PIXEL_START)
 *  - "out" = fully pixelated → clear (block size PIXEL_START → 1)
 * Uses eased interpolation every frame for smooth transitions.
 */
function animatePixelation(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  direction: "in" | "out",
  durationMs: number,
  fit: FitMode = "contain",
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let lastBlock = -1;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const rawT = Math.min(1, elapsed / durationMs);
      const easedT = easeInOutCubic(rawT);

      // Interpolate block size: "in" goes 1→PIXEL_START, "out" goes PIXEL_START→1
      let blockSize: number;
      if (direction === "in") {
        blockSize = 1 + (PIXEL_START - 1) * easedT;
      } else {
        blockSize = PIXEL_START - (PIXEL_START - 1) * easedT;
      }

      const rounded = Math.max(1, Math.round(blockSize));

      // Only redraw when the rounded block size actually changes
      if (rounded !== lastBlock) {
        lastBlock = rounded;
        drawPixelated(canvas, img, rounded, fit);
      }

      if (rawT < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

export const CaseStudyGallery: React.FC<CaseStudyGalleryProps> = ({ images }) => {
  const [focusIndex, setFocusIndex] = useState(0);

  const focusCanvasRef = useRef<HTMLCanvasElement>(null);
  const focusImgRef = useRef<HTMLImageElement>(null);
  const focusWrapRef = useRef<HTMLDivElement>(null);
  const thumbCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const thumbImgRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Preloaded Image objects — never change src, always available for canvas drawing
  const preloadedRef = useRef<HTMLImageElement[]>([]);

  // All mutable state in refs so the async swap never sees stale closures
  const focusRef = useRef(0);
  const busyRef = useRef(false);
  const unmountedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Preload all images once on mount
  useEffect(() => {
    preloadedRef.current = images.map((img) => {
      const el = new Image();
      el.src = img.src;
      return el;
    });
  }, [images]);

  /** Sync canvas size to CSS display size (no-op if already matched) */
  const syncCanvas = useCallback((c: HTMLCanvasElement) => {
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }, []);

  // Thumbnail indices derived from current render's focusIndex
  const thumbIndices = images.map((_, i) => i).filter((i) => i !== focusIndex);

  /** Get the preloaded Image for a given image index */
  const getPreloaded = useCallback((idx: number): HTMLImageElement | null => {
    return preloadedRef.current[idx] ?? null;
  }, []);

  /** Core swap — uses preloaded images for canvas draws */
  const doSwap = useCallback(async (targetIdx: number) => {
    if (busyRef.current) return;
    const curFocus = focusRef.current;
    if (targetIdx === curFocus) return;

    // Cancel any pending auto-cycle so we don't stack timers
    clearTimeout(timerRef.current);

    const focusPreloaded = getPreloaded(curFocus);
    const targetPreloaded = getPreloaded(targetIdx);
    if (!focusPreloaded?.complete || !targetPreloaded?.complete) return;

    // Find the thumb slot for the target image
    const curThumbIndices = images.map((_, i) => i).filter((i) => i !== curFocus);
    const thumbSlot = curThumbIndices.indexOf(targetIdx);

    const focusCanvas = focusCanvasRef.current;
    const thumbCanvas = thumbCanvasRefs.current[thumbSlot];

    if (!focusCanvas || !thumbCanvas) return;

    busyRef.current = true;

    // Size canvases once
    syncCanvas(focusCanvas);
    syncCanvas(thumbCanvas);

    // 1. Pixelate both (clear → mosaic) — draw from preloaded images
    await Promise.all([
      animatePixelation(focusCanvas, focusPreloaded, "in", PIXELATE_MS, "contain"),
      animatePixelation(thumbCanvas, targetPreloaded, "in", PIXELATE_MS, "cover"),
    ]);
    if (unmountedRef.current) return;

    // 2. Swap while fully pixelated
    focusRef.current = targetIdx;
    setFocusIndex(targetIdx);

    await new Promise((r) => setTimeout(r, HOLD_MS));
    if (unmountedRef.current) return;

    // Wait for React to flush the new DOM img srcs
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    if (unmountedRef.current) return;

    // 3. De-pixelate both — draw from preloaded images (always correct dimensions)
    const newFocusCanvas = focusCanvasRef.current;
    const newThumbIndices = images.map((_, i) => i).filter((i) => i !== targetIdx);
    const oldFocusSlot = newThumbIndices.indexOf(curFocus);
    const newThumbCanvas = thumbCanvasRefs.current[oldFocusSlot];

    if (newFocusCanvas && newThumbCanvas) {
      syncCanvas(newFocusCanvas);
      drawPixelated(newFocusCanvas, targetPreloaded, PIXEL_START, "contain");
      syncCanvas(newThumbCanvas);
      drawPixelated(newThumbCanvas, focusPreloaded, PIXEL_START, "cover");

      await Promise.all([
        animatePixelation(newFocusCanvas, targetPreloaded, "out", RESOLVE_MS, "contain"),
        animatePixelation(newThumbCanvas, focusPreloaded, "out", RESOLVE_MS, "cover"),
      ]);
    }

    if (unmountedRef.current) return;
    busyRef.current = false;

    // Schedule next swap
    const next = (focusRef.current + 1) % images.length;
    timerRef.current = setTimeout(() => {
      if (!unmountedRef.current) doSwap(next);
    }, CYCLE_PAUSE);
  }, [images, syncCanvas]);

  // Initial kick-off: start cycling once preloaded images are ready
  useEffect(() => {
    unmountedRef.current = false;

    const waitAndStart = () => {
      const allReady = preloadedRef.current.length === images.length &&
        preloadedRef.current.every((img) => img.complete && img.naturalWidth > 0);
      if (allReady) {
        const next = (focusRef.current + 1) % images.length;
        timerRef.current = setTimeout(() => {
          if (!unmountedRef.current) doSwap(next);
        }, CYCLE_PAUSE);
      } else {
        timerRef.current = setTimeout(waitAndStart, 500);
      }
    };

    waitAndStart();

    return () => {
      unmountedRef.current = true;
      clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.caseStudyGallery}>
      {/* Focus image — full height */}
      <div
        ref={focusWrapRef}
        className={styles.caseStudyFocus}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={focusImgRef}
          src={images[focusIndex].src}
          alt={images[focusIndex].alt}
        />
        <canvas ref={focusCanvasRef} />
      </div>

      {/* Thumbnail strip */}
      <div className={styles.caseStudyThumbs}>
        {thumbIndices.map((imgIdx, slotIdx) => (
          <div
            key={imgIdx}
            className={styles.caseStudyThumb}
            onClick={() => !busyRef.current && doSwap(imgIdx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => { thumbImgRefs.current[slotIdx] = el; }}
              src={images[imgIdx].src}
              alt={images[imgIdx].alt}
            />
            <canvas ref={(el) => { thumbCanvasRefs.current[slotIdx] = el; }} />
          </div>
        ))}
      </div>
    </div>
  );
};
