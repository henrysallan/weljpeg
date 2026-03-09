"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import styles from "./ContentBlock.module.css";
import { VimeoEmbed } from "./VimeoEmbed";
import { AnimatedWelcomeLogo } from "./AnimatedWelcomeLogo";
import type { MediaItem } from "@/lib/data";
import { fetchVimeoThumbnail } from "@/lib/vimeoThumbnails";

const PIXEL_START  = 48;     // max block size (fully pixelated)
const SWAP_MS      = 700;   // total time for one through-animation (peak at midpoint)
const CYCLE_PAUSE  = 3000;  // pause between swaps
const FADE_ZONE    = 0.001;  // ±6% around midpoint = crossfade from 0.44→0.56

interface CaseStudyGalleryProps {
  images: MediaItem[];
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
  hAlign: "right" | "center" = "right",
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
  const dx = hAlign === "center" ? (canvasW - dw) / 2 : canvasW - dw;
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
  vAlign: "top" | "center" = "center",
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
    sy = vAlign === "top" ? 0 : (nh - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

type FitMode = "contain" | "cover";

/* ---- Cached offscreen canvas (reused every frame to avoid GC churn) ---- */
let _offCanvas: HTMLCanvasElement | null = null;
let _offCtx: CanvasRenderingContext2D | null = null;

function getOffscreen(): CanvasRenderingContext2D {
  if (!_offCanvas) {
    _offCanvas = document.createElement("canvas");
    _offCtx = _offCanvas.getContext("2d")!;
  }
  return _offCtx!;
}

/* ---- Display-resolution bitmap cache (avoids resampling every frame) ---- */
const _bitmapCache = new Map<string, HTMLCanvasElement>();

/**
 * Lazily create (and cache) a canvas with the image pre-rendered at the
 * exact display dimensions + fit mode.  Subsequent calls with the same
 * image / size / mode return the cached canvas instantly.
 */
function getDisplayBitmap(
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  fit: FitMode,
  hAlign: "right" | "center" = "right",
  vAlign: "top" | "center" = "center",
): HTMLCanvasElement {
  const key = `${img.src}-${fit}-${hAlign}-${vAlign}-${canvasW}x${canvasH}`;
  let cached = _bitmapCache.get(key);
  if (cached) return cached;

  cached = document.createElement("canvas");
  cached.width = canvasW;
  cached.height = canvasH;
  const ctx = cached.getContext("2d")!;

  if (fit === "cover") {
    const { sx, sy, sw, sh } = coverCrop(img, canvasW, canvasH, vAlign);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
  } else {
    const { dx, dy, dw, dh } = containRect(img, canvasW, canvasH, hAlign);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
  }

  _bitmapCache.set(key, cached);
  return cached;
}

/**
 * Draw a display-resolution bitmap pixelated onto a canvas at a given block size.
 * The bitmap is already at canvas dimensions with fit/crop baked in,
 * so every frame is a simple downsample → upsample (no contain/cover math).
 */
function drawPixelated(
  canvas: HTMLCanvasElement,
  bitmap: HTMLCanvasElement,
  blockSize: number,
  alpha: number = 1,
  clear: boolean = true,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  if (blockSize <= 1) {
    canvas.style.opacity = "0";
    return;
  }

  if (clear) ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;

  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha;

  const offCtx = getOffscreen();
  const off = _offCanvas!;

  const cols = Math.max(1, Math.ceil(w / blockSize));
  const rows = Math.max(1, Math.ceil(h / blockSize));
  off.width = cols;
  off.height = rows;
  offCtx.drawImage(bitmap, 0, 0, cols, rows);
  ctx.drawImage(off, 0, 0, cols, rows, 0, 0, w, h);

  ctx.globalAlpha = prevAlpha;
  canvas.style.opacity = "1";
}

/**
 * Single continuous animation: clear → peak pixelation → clear.
 * Around the midpoint, both images are crossfaded under heavy pixelation
 * so the swap is completely invisible.  `onMid` fires at 50 % for the
 * React state update (hidden behind the opaque mosaic).
 */
function animateThrough(
  canvas: HTMLCanvasElement,
  bitmapA: HTMLCanvasElement,
  bitmapB: HTMLCanvasElement,
  durationMs: number,
  onMid?: () => void,
  signal?: { cancelled: boolean },
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let lastBlock = -1;
    let lastAlphaA = -1;
    let midFired = false;

    const tick = () => {
      if (signal?.cancelled) {
        canvas.style.opacity = "0";
        resolve();
        return;
      }

      const elapsed = performance.now() - startTime;
      const rawT = Math.min(1, elapsed / durationMs);

      // First half 0→1 ramps up, second half 1→0 ramps down
      const halfT = rawT <= 0.5 ? rawT * 2 : (1 - rawT) * 2;
      const easedT = easeInOutCubic(halfT);
      const blockSize = 1 + (PIXEL_START - 1) * easedT;
      const rounded = Math.max(1, Math.round(blockSize));

      // Fire midpoint callback exactly once
      if (!midFired && rawT >= 0.5) {
        midFired = true;
        onMid?.();
      }

      // Crossfade zone: blend both images around the midpoint
      const fadeStart = 0.5 - FADE_ZONE;
      const fadeEnd   = 0.5 + FADE_ZONE;
      let alphaA: number, alphaB: number;

      if (rawT <= fadeStart) {
        alphaA = 1; alphaB = 0;
      } else if (rawT >= fadeEnd) {
        alphaA = 0; alphaB = 1;
      } else {
        // Smooth blend within the zone
        const fadeT = (rawT - fadeStart) / (fadeEnd - fadeStart);
        const easedFade = easeInOutCubic(fadeT);
        alphaA = 1 - easedFade;
        alphaB = easedFade;
      }

      const roundedAlphaA = Math.round(alphaA * 100);
      const needsRedraw = rounded !== lastBlock || roundedAlphaA !== lastAlphaA;

      if (needsRedraw) {
        lastBlock = rounded;
        lastAlphaA = roundedAlphaA;

        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (alphaA > 0.01) drawPixelated(canvas, bitmapA, rounded, alphaA, false);
        if (alphaB > 0.01) drawPixelated(canvas, bitmapB, rounded, alphaB, false);
      }

      if (rawT < 1) {
        requestAnimationFrame(tick);
      } else {
        canvas.style.opacity = "0";
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

export const CaseStudyGallery: React.FC<CaseStudyGalleryProps> = ({ images }) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const [resolvedImages, setResolvedImages] = useState<MediaItem[]>(images);
  const [thumbsReady, setThumbsReady] = useState(false);
  const [animating, setAnimating] = useState(false);
  /** Set of video indices whose playback has started (buffered & rendering) */
  const [videoReady, setVideoReady] = useState<Set<number>>(new Set());

  // If any item is a video, disable auto-cycling (manual clicks only)
  const hasVideo = images.some((m) => !!m.vimeoId);

  const galleryRef = useRef<HTMLDivElement>(null);
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
  const visibleRef = useRef(true);
  const cancelRef = useRef<{ cancelled: boolean } | null>(null);

  /* ---- Resolve Vimeo thumbnails, then preload all sources ---- */
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const needsFetch = images.some((m) => m.vimeoId && !m.src);
      const resolved = needsFetch
        ? await Promise.all(
            images.map(async (item) => {
              if (item.vimeoId && !item.src) {
                const thumb = await fetchVimeoThumbnail(item.vimeoId);
                return { ...item, src: thumb };
              }
              return item;
            }),
          )
        : images;

      if (cancelled) return;
      setResolvedImages(resolved);

      // Preload all resolved images (incl. Vimeo thumbnails)
      preloadedRef.current = resolved.map((img) => {
        const el = new Image();
        if (img.src) el.src = img.src;
        return el;
      });

      setThumbsReady(true);
    }

    resolve();
    return () => { cancelled = true; };
  }, [images]);

  /** Sync canvas size to CSS display size (no-op if already matched) */
  const syncCanvas = useCallback((c: HTMLCanvasElement) => {
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }, []);

  // Compute aspect ratio: 4/5 for portrait, 5/4 for landscape
  const focusAspect = (() => {
    const img = preloadedRef.current[focusIndex];
    if (!img || !img.naturalWidth) return "5 / 4";
    return img.naturalHeight > img.naturalWidth ? "4 / 5" : "5 / 4";
  })();

  // Thumbnail indices derived from current render's focusIndex
  const thumbIndices = images.map((_, i) => i).filter((i) => i !== focusIndex);

  /** Get the preloaded Image for a given image index */
  const getPreloaded = useCallback((idx: number): HTMLImageElement | null => {
    return preloadedRef.current[idx] ?? null;
  }, []);

  /** Core swap — interruptible animation per canvas, zero pause at peak */
  const doSwap = useCallback(async (targetIdx: number) => {
    const fromIdx = focusRef.current;
    if (targetIdx === fromIdx) return;

    // Cancel any in-flight animation & pending auto-cycle
    if (cancelRef.current) cancelRef.current.cancelled = true;
    clearTimeout(timerRef.current);

    const signal = { cancelled: false };
    cancelRef.current = signal;

    const focusPreloaded = getPreloaded(fromIdx);
    const targetPreloaded = getPreloaded(targetIdx);
    if (!focusPreloaded?.complete || !targetPreloaded?.complete) return;

    const focusCanvas = focusCanvasRef.current;
    if (!focusCanvas) return;

    // Find the thumb slot for the target image in the current layout
    const curThumbIndices = images.map((_, i) => i).filter((i) => i !== fromIdx);
    const thumbSlot = curThumbIndices.indexOf(targetIdx);
    const thumbCanvas = thumbCanvasRefs.current[thumbSlot];

    busyRef.current = true;
    setAnimating(true);

    // Size canvases once
    syncCanvas(focusCanvas);

    // Match CSS object-position: center on mobile (≤767px), right on desktop
    const hAlign = window.innerWidth <= 767 ? "center" as const : "right" as const;

    // Get display-resolution bitmaps (cached after first call per image+size)
    const focusBitmapA = getDisplayBitmap(focusPreloaded, focusCanvas.width, focusCanvas.height, "cover", hAlign, "top");
    const focusBitmapB = getDisplayBitmap(targetPreloaded, focusCanvas.width, focusCanvas.height, "cover", hAlign, "top");

    // Build parallel animations — focus always, thumb only if canvas available
    const animations: Promise<void>[] = [
      animateThrough(
        focusCanvas, focusBitmapA, focusBitmapB, SWAP_MS,
        () => {
          // Midpoint — swap React state (canvas is fully opaque mosaic)
          focusRef.current = targetIdx;
          setFocusIndex(targetIdx);
        },
        signal,
      ),
    ];

    if (thumbCanvas) {
      syncCanvas(thumbCanvas);
      const thumbBitmapA = getDisplayBitmap(targetPreloaded, thumbCanvas.width, thumbCanvas.height, "cover");
      const thumbBitmapB = getDisplayBitmap(focusPreloaded, thumbCanvas.width, thumbCanvas.height, "cover");
      animations.push(
        animateThrough(thumbCanvas, thumbBitmapA, thumbBitmapB, SWAP_MS, undefined, signal),
      );
    }

    await Promise.all(animations);

    // If we were cancelled mid-flight, a newer doSwap owns cleanup
    if (signal.cancelled || unmountedRef.current) return;
    busyRef.current = false;
    setAnimating(false);

    // Schedule next swap (only while gallery is in viewport, and no videos)
    if (visibleRef.current && !hasVideo) {
      const next = (focusRef.current + 1) % images.length;
      timerRef.current = setTimeout(() => {
        if (!unmountedRef.current) doSwap(next);
      }, CYCLE_PAUSE);
    }
  }, [images, syncCanvas, getPreloaded, hasVideo]);

  // Pause auto-cycling when gallery is off-screen, resume when visible
  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = visibleRef.current;
        visibleRef.current = entry.isIntersecting;

        // Scrolled back into view — restart cycle if idle (skip for video galleries)
        if (!hasVideo && !wasVisible && entry.isIntersecting && !busyRef.current && !unmountedRef.current) {
          clearTimeout(timerRef.current);
          const next = (focusRef.current + 1) % images.length;
          timerRef.current = setTimeout(() => {
            if (!unmountedRef.current) doSwap(next);
          }, CYCLE_PAUSE);
        }

        // Left viewport — cancel pending timer
        if (wasVisible && !entry.isIntersecting) {
          clearTimeout(timerRef.current);
        }
      },
      { threshold: 0 },
    );

    io.observe(el);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial kick-off: start cycling once preloaded images are ready (skip for video galleries)
  useEffect(() => {
    unmountedRef.current = false;

    if (!hasVideo) {
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
    }

    return () => {
      unmountedRef.current = true;
      clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (images.length === 0) {
    return null;
  }

  return (
    <div ref={galleryRef} className={styles.caseStudyGallery}>
      {/* Focus image/video — full height */}
      <div
        ref={focusWrapRef}
        className={styles.caseStudyFocus}
        style={{ aspectRatio: focusAspect }}
      >
        {/* Pre-render ALL video embeds so they buffer ahead of time.
            Only the active one is visible; the rest stay hidden but playing. */}
        {resolvedImages.map((item, idx) =>
          item.vimeoId ? (
            <div
              key={`video-${idx}`}
              className={styles.focusVideoLayer}
              style={{ visibility: idx === focusIndex && !animating ? "visible" : "hidden" }}
            >
              <VimeoEmbed
                vimeoId={item.vimeoId}
                alt={item.alt}
                onPlaying={() =>
                  setVideoReady((prev) => {
                    if (prev.has(idx)) return prev;
                    const next = new Set(prev);
                    next.add(idx);
                    return next;
                  })
                }
              />
            </div>
          ) : null,
        )}

        {/* Thumbnail image — covers the video until idle, then fades out */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={focusImgRef}
          src={resolvedImages[focusIndex].src}
          alt={resolvedImages[focusIndex].alt}
          style={resolvedImages[focusIndex].vimeoId ? { objectPosition: "center center" } : undefined}
          className={
            resolvedImages[focusIndex].vimeoId && !animating && videoReady.has(focusIndex)
              ? styles.focusImgHidden
              : ""
          }
        />
        <canvas ref={focusCanvasRef} />

        {/* Buffering overlay — animated logo while video is loading */}
        {resolvedImages[focusIndex].vimeoId &&
          !animating &&
          !videoReady.has(focusIndex) && (
            <div className={styles.bufferingOverlay}>
              <AnimatedWelcomeLogo
                width={48}
                height={42}
                color="rgba(255,255,255,0.7)"
                autoLoop
              />
            </div>
          )}
      </div>

      {/* Thumbnail strip */}
      <div className={styles.caseStudyThumbs}>
        {thumbIndices.map((imgIdx, slotIdx) => (
          <div
            key={imgIdx}
            className={styles.caseStudyThumb}
            onClick={() => doSwap(imgIdx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => { thumbImgRefs.current[slotIdx] = el; }}
              src={resolvedImages[imgIdx].src}
              alt={resolvedImages[imgIdx].alt}
            />
            <canvas ref={(el) => { thumbCanvasRefs.current[slotIdx] = el; }} />
          </div>
        ))}
      </div>
    </div>
  );
};
