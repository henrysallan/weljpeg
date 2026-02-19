"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useControls, folder, Leva } from "leva";
import { transitionConfig, imageRevealConfig } from "@/lib/levaConfig";
import styles from "./ImageSquiggle.module.css";

/* ================================================================
   Image pool
   ================================================================ */
interface Post {
  shortcode: string;
  images: string[];
  caption?: string;
}

let IMAGE_POOL: string[] = [];
let IMAGE_CAPTION_MAP: Record<string, string> = {};
let poolReady = false;

async function loadImagePool() {
  if (poolReady) return;
  try {
    const res = await fetch("/images/landingimages/posts.json");
    const posts: Post[] = await res.json();
    IMAGE_POOL = posts.flatMap((p) =>
      p.images.map((img) => `/images/landingimages/${img}`)
    );
    // Map each image path to its post caption
    for (const p of posts) {
      if (!p.caption) continue;
      for (const img of p.images) {
        IMAGE_CAPTION_MAP[`/images/landingimages/${img}`] = p.caption;
      }
    }
    poolReady = true;
  } catch (e) {
    console.warn("ImageSquiggle: failed to load posts.json", e);
  }
}

/* ================================================================
   Image element cache — reuse decoded bitmaps via cloneNode
   ================================================================ */
const imageCache = new Map<string, HTMLImageElement>();

/** Pre-decode an image and cache the source element for cloning. */
async function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src)) return;
  const img = new Image();
  img.src = src;
  img.decoding = "async";
  try {
    await img.decode();
  } catch {
    // Fallback — image may still work even if decode() fails
  }
  imageCache.set(src, img);
}

/** Create a cheap image element. Clones a cached node if available,
 *  so the browser reuses the already-decoded bitmap (instancing). */
function createCachedImage(src: string, size: number): HTMLImageElement {
  const cached = imageCache.get(src);
  let img: HTMLImageElement;
  if (cached) {
    img = cached.cloneNode(true) as HTMLImageElement;
  } else {
    img = document.createElement("img");
    img.src = src;
    img.decoding = "async";
  }
  img.alt = "";
  img.draggable = false;
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  return img;
}

/* ================================================================
   Path generators
   ================================================================ */

type Pt = { x: number; y: number };

/** Arc — sweeps around the viewport center with noise */
function generateArcPath(
  numPoints: number,
  vw: number,
  vh: number,
  opts: {
    minRadius: number;
    maxRadius: number;
    arcSpan: number;
    noise: number;
    exclusionRadius: number;
  }
): Pt[] {
  const cx = vw / 2;
  const cy = vh / 2;
  const dim = Math.min(vw, vh);
  const { minRadius, maxRadius, arcSpan, noise, exclusionRadius } = opts;

  const radius =
    (minRadius + Math.random() * (maxRadius - minRadius)) * dim * 0.5;
  const startAngle = Math.random() * Math.PI * 2;
  const spanRad = (arcSpan * Math.PI) / 180;

  const pts: Pt[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = startAngle + t * spanRad;
    const noiseOffset = (Math.random() - 0.5) * 2 * noise * dim * 0.5;
    const r = Math.max(radius + noiseOffset, exclusionRadius * dim * 0.5);
    pts.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  return pts;
}

/** Linear — left to right with vertical wobble */
function generateLinearPath(
  numPoints: number,
  vw: number,
  vh: number,
  opts: { padding: number; wobble: number }
): Pt[] {
  const pts: Pt[] = [];
  const usableW = vw - opts.padding * 2;
  const midY = vh / 2;
  const wobbleRange = vh * opts.wobble;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    pts.push({
      x:
        opts.padding +
        t * usableW +
        (Math.random() - 0.5) * usableW * 0.15,
      y: midY + (Math.random() - 0.5) * wobbleRange,
    });
  }
  return pts;
}

/** Scatter — random positions with exclusion zone */
function generateScatterPath(
  numPoints: number,
  vw: number,
  vh: number,
  opts: { padding: number; exclusionRadius: number }
): Pt[] {
  const cx = vw / 2;
  const cy = vh / 2;
  const dim = Math.min(vw, vh);
  const exclPx = opts.exclusionRadius * dim * 0.5;
  const pts: Pt[] = [];

  let attempts = 0;
  while (pts.length < numPoints && attempts < numPoints * 20) {
    attempts++;
    const x = opts.padding + Math.random() * (vw - opts.padding * 2);
    const y = opts.padding + Math.random() * (vh - opts.padding * 2);
    const dx = x - cx;
    const dy = y - cy;
    if (Math.sqrt(dx * dx + dy * dy) >= exclPx) {
      pts.push({ x, y });
    }
  }
  return pts;
}

/* ================================================================
   Catmull-Rom spline
   ================================================================ */

function evalCatmullRom(points: Pt[], t: number): Pt {
  const n = points.length;
  if (n < 2) return points[0];

  const tClamped = Math.max(0, Math.min(1, t));
  const segments = n - 1;
  const raw = tClamped * segments;
  const seg = Math.min(Math.floor(raw), segments - 1);
  const local = raw - seg;

  const p0 = points[Math.max(0, seg - 1)];
  const p1 = points[seg];
  const p2 = points[Math.min(n - 1, seg + 1)];
  const p3 = points[Math.min(n - 1, seg + 2)];

  const tt = local;
  const tt2 = tt * tt;
  const tt3 = tt2 * tt;

  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * tt +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tt3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * tt +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tt3),
  };
}

/** Pick n random items */
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/* ================================================================
   Component
   ================================================================ */

export const ImageSquiggle: React.FC<{
  delayStart?: number;
  onFocus?: () => void;
  onUnfocus?: () => void;
}> = ({ delayStart = 0, onFocus, onUnfocus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTweensRef = useRef<gsap.core.Timeline[]>([]);
  const [levaHidden, setLevaHidden] = useState(true);

  // Scatter-fall state — TrackedImage stores position/size so we
  // never read layout (offsetWidth/Height) in the hot loop.
  type TrackedImage = {
    el: HTMLImageElement;
    x: number;
    y: number;
    size: number;
    speed: number;
    baseScale: number;
  };
  const scatterImgsRef = useRef<TrackedImage[]>([]);
  const scatterRafRef = useRef<number | null>(null);
  const scatterSpawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFrameRef = useRef<number>(0);

  // Throw physics state
  type ThrownEntry = {
    el: HTMLImageElement;
    x: number;
    y: number;
    size: number;
    vx: number;
    vy: number;
  };
  const thrownImgsRef = useRef<ThrownEntry[]>([]);
  const throwRafRef = useRef<number | null>(null);
  const throwLastFrameRef = useRef<number>(0);
  const THROW_FRICTION = 0.985; // velocity damping per frame

  // Focus mode state
  const focusedRef = useRef<HTMLImageElement | null>(null);
  const focusedCaptionRef = useRef<HTMLParagraphElement | null>(null);
  const focusedCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const focusedTweenRef = useRef<gsap.core.Tween | null>(null);
  const isFocusingRef = useRef(false);
  const cycleRunningRef = useRef(true);
  const cancelledRef = useRef(false);
  const runCycleRef = useRef<(() => void) | null>(null);

  // Store controls in a ref so the cycle loop reads the latest
  // values without restarting when they change.
  const controlsRef = useRef<Record<string, unknown>>({});

  // Detect mobile for smaller defaults
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  /* ---------- Leva controls ---------- */
  const controls = useControls({
    Mode: folder({
      mode: {
        value: "scatter",
        options: ["arc", "linear", "scatter"],
      },
    }),
    General: folder({
      imagesPerLine: { value: isMobile ? 24 : 30, min: 3, max: 100, step: 1 },
      minImageSize: { value: isMobile ? 30 : 20, min: 20, max: 250, step: 5, label: "img size min" },
      maxImageSize: { value: isMobile ? 60 : 60, min: 20, max: 250, step: 5, label: "img size max" },
      curvePoints: {
        value: 5,
        min: 3,
        max: 12,
        step: 1,
        label: "curve pts",
      },
      linesPerCycle: {
        value: 2,
        min: 1,
        max: 5,
        step: 1,
        label: "lines/cycle",
      },
      lineDelay: {
        value: 0.1,
        min: 0,
        max: 2,
        step: 0.1,
        label: "line delay (s)",
      },
    }),
    Proximity: folder({
      proximityRadius: {
        value: 150,
        min: 50,
        max: 500,
        step: 10,
        label: "radius (px)",
      },
      proximityScale: {
        value: 1.5,
        min: 1.0,
        max: 3.0,
        step: 0.05,
        label: "max scale",
      },
      proximityEase: {
        value: 2,
        min: 0.5,
        max: 5,
        step: 0.1,
        label: "falloff curve",
      },
    }),
    "Arc Settings": folder({
      arcSpan: {
        value: isMobile ? 100 : 100,
        min: 30,
        max: 360,
        step: 5,
        label: "arc span (°)",
      },
      minRadius: {
        value: 0.35,
        min: 0.1,
        max: 1.5,
        step: 0.05,
        label: "min radius",
      },
      maxRadius: {
        value: 1.5,
        min: 0.2,
        max: 2,
        step: 0.05,
        label: "max radius",
      },
      arcNoise: {
        value: 0.15,
        min: 0,
        max: 0.4,
        step: 0.01,
        label: "noise",
      },
      exclusionRadius: {
        value: 0.29,
        min: 0.05,
        max: 0.6,
        step: 0.01,
        label: "exclusion zone",
      },
    }),
    "Linear Settings": folder({
      linearPadding: {
        value: 60,
        min: 0,
        max: 200,
        step: 10,
        label: "padding",
      },
      linearWobble: {
        value: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
        label: "wobble",
      },
    }),
    "Scatter Settings": folder({
      scatterPadding: {
        value: 40,
        min: 0,
        max: 200,
        step: 10,
        label: "padding",
      },
      scatterExclusion: {
        value: 0.2,
        min: 0.05,
        max: 0.6,
        step: 0.01,
        label: "exclusion zone",
      },
      fallSpeedMin: {
        value: 15,
        min: 5,
        max: 100,
        step: 1,
        label: "fall speed min (px/s)",
      },
      fallSpeedMax: {
        value: 60,
        min: 10,
        max: 200,
        step: 1,
        label: "fall speed max (px/s)",
      },
      scatterSpawnInterval: {
        value: 0.6,
        min: 0.1,
        max: 3,
        step: 0.1,
        label: "spawn interval (s)",
      },
      scatterBatchSize: {
        value: 3,
        min: 1,
        max: 10,
        step: 1,
        label: "batch size",
      },
      scatterGrowZone: {
        value: 0.07,
        min: 0.02,
        max: 0.5,
        step: 0.01,
        label: "grow zone",
      },
      scatterShrinkZone: {
        value: 0.07,
        min: 0.02,
        max: 0.5,
        step: 0.01,
        label: "shrink zone",
      },
      scatterEasing: {
        value: 6,
        min: 1,
        max: 6,
        step: 0.5,
        label: "easing strength",
      },
    }),
    Timing: folder({
      fadeInDuration: {
        value: 0.02,
        min: 0.02,
        max: 1,
        step: 0.01,
        label: "fade in (s)",
      },
      fadeInStagger: {
        value: 0.05,
        min: 0.02,
        max: 0.5,
        step: 0.01,
        label: "stagger in (s)",
      },
      fadeOutDuration: {
        value: 0.05,
        min: 0.1,
        max: 2,
        step: 0.05,
        label: "fade out (s)",
      },
      fadeOutStagger: {
        value: 0.07,
        min: 0.02,
        max: 0.5,
        step: 0.01,
        label: "stagger out (s)",
      },
      holdDuration: {
        value: 0.2,
        min: 0.2,
        max: 5,
        step: 0.1,
        label: "hold (s)",
      },
      cycleInterval: {
        value: 2,
        min: 1,
        max: 15,
        step: 0.5,
        label: "cycle (s)",
      },
      maxOpacity: {
        value: 0.85,
        min: 0.1,
        max: 1,
        step: 0.05,
        label: "max opacity",
      },
      staggerEase: {
        value: 1.0,
        min: 0.2,
        max: 4,
        step: 0.1,
        label: "stagger ease",
      },
    }),
    Debug: folder({
      showDebugPath: { value: false, label: "show path" },
    }),
    "Page Transition": folder({
      transitionDuration: {
        value: 0.5,
        min: 0.3,
        max: 5,
        step: 0.1,
        label: "duration (s)",
      },
      transitionEasePower: {
        value: 4,
        min: 1,
        max: 10,
        step: 0.5,
        label: "ease power",
      },
    }),
    "Image Reveal": folder({
      revealBlur: { value: true, label: "blur" },
      revealPixelate: { value: true, label: "pixelate" },
      revealPixelStart: { value: 48, min: 4, max: 120, step: 4, label: "pixel size" },
      revealBlurAmount: { value: 10, min: 2, max: 40, step: 1, label: "blur amount" },
      revealDuration: { value: 400, min: 200, max: 2000, step: 50, label: "duration (ms)" },
      revealTravel: { value: 0, min: 0, max: 40, step: 1, label: "travel (px)" },
    }),
  });

  // Sync ref every render (cheap assignment, no effect restart).
  controlsRef.current = controls;

  // Sync page transition config to shared module
  transitionConfig.duration = controls.transitionDuration;
  transitionConfig.easePower = controls.transitionEasePower;

  // Sync image reveal config to shared module
  imageRevealConfig.blur = controls.revealBlur;
  imageRevealConfig.pixelate = controls.revealPixelate;
  imageRevealConfig.pixelStart = controls.revealPixelStart;
  imageRevealConfig.blurAmount = controls.revealBlurAmount;
  imageRevealConfig.duration = controls.revealDuration;
  imageRevealConfig.travel = controls.revealTravel;

  /* ---------- Toggle leva panel with "L" key ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "l" || e.key === "L") {
        setLevaHidden((h) => {
          const next = !h;
          // Toggle CSS class so the panel is visible/hidden without flash
          const root = document.getElementById("leva__root");
          if (root) {
            if (next) root.classList.remove("leva--visible");
            else root.classList.add("leva--visible");
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------- Proximity scale effect ---------- */
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const proximityRafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    // Listen on window so proximity works even when cursor
    // is over empty space (container has pointer-events: none).
    window.addEventListener("mousemove", onMouseMove);

    const tick = () => {
      const c = controlsRef.current as typeof controls;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const radius = c.proximityRadius;
      const maxScale = c.proximityScale;
      const ease = c.proximityEase;

      // Iterate tracked scatter images (no DOM query)
      for (const entry of scatterImgsRef.current) {
        if (focusedRef.current === entry.el || isFocusingRef.current) continue;
        if (entry.el.dataset.dragging) continue;

        const cx = entry.x + entry.size / 2;
        const cy = entry.y + entry.size / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const bs = entry.baseScale;
        if (dist < radius) {
          const t = Math.pow(1 - dist / radius, ease);
          const scale = bs * (1 + (maxScale - 1) * t);
          entry.el.style.transform = `translate(${entry.x}px,${entry.y}px) scale(${scale})`;
        } else {
          entry.el.style.transform = `translate(${entry.x}px,${entry.y}px) scale(${bs})`;
        }
      }

      // Also handle thrown images
      for (const t of thrownImgsRef.current) {
        if (t.el.dataset.dragging) continue;
        const cx = t.x + t.size / 2;
        const cy = t.y + t.size / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const tt = Math.pow(1 - dist / radius, ease);
          const scale = 1 + (maxScale - 1) * tt;
          t.el.style.transform = `translate(${t.x}px,${t.y}px) scale(${scale})`;
        } else {
          t.el.style.transform = `translate(${t.x}px,${t.y}px) scale(1)`;
        }
      }

      proximityRafRef.current = requestAnimationFrame(tick);
    };

    proximityRafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (proximityRafRef.current) {
        cancelAnimationFrame(proximityRafRef.current);
        proximityRafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Throw physics RAF loop ---------- */
  const startThrowLoop = () => {
    if (throwRafRef.current) return; // already running
    throwLastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - throwLastFrameRef.current) / 1000, 0.05);
      throwLastFrameRef.current = now;

      const container = containerRef.current;
      if (!container) {
        throwRafRef.current = requestAnimationFrame(tick);
        return;
      }
      const vw = container.clientWidth;
      const vh = container.clientHeight;

      const alive: ThrownEntry[] = [];
      const BOUNCE_DAMPING = 0.6;

      for (const t of thrownImgsRef.current) {
        t.vx *= THROW_FRICTION;
        t.vy *= THROW_FRICTION;
        t.x += t.vx * dt;
        t.y += t.vy * dt;

        const w = t.size;
        const h = t.size;

        // Bounce off edges
        if (t.x < 0) {
          t.x = 0;
          t.vx = Math.abs(t.vx) * BOUNCE_DAMPING;
        } else if (t.x + w > vw) {
          t.x = vw - w;
          t.vx = -Math.abs(t.vx) * BOUNCE_DAMPING;
        }
        if (t.y < 0) {
          t.y = 0;
          t.vy = Math.abs(t.vy) * BOUNCE_DAMPING;
        } else if (t.y + h > vh) {
          t.y = vh - h;
          t.vy = -Math.abs(t.vy) * BOUNCE_DAMPING;
        }

        // Write position via transform only (no layout thrash)
        t.el.style.transform = `translate(${t.x}px,${t.y}px) scale(1)`;

        // Kill when nearly stopped
        const speed = Math.sqrt(t.vx * t.vx + t.vy * t.vy);
        if (speed < 5) {
          // Fade out gently
          gsap.to(t.el, {
            opacity: 0,
            duration: 0.6,
            ease: "power2.in",
            onComplete: () => t.el.remove(),
          });
        } else {
          alive.push(t);
        }
      }
      thrownImgsRef.current = alive;

      if (alive.length > 0) {
        throwRafRef.current = requestAnimationFrame(tick);
      } else {
        throwRafRef.current = null; // stop loop when no thrown images
      }
    };

    throwRafRef.current = requestAnimationFrame(tick);
  };

  /* ---------- Shared interaction handlers ---------- */
  const DRAG_THRESHOLD = 6; // px movement to count as drag vs click

  const attachInteractionHandlers = (img: HTMLImageElement, tracked?: TrackedImage) => {
    let isDragging = false;
    let didDrag = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let prevX = 0;
    let prevY = 0;
    let lastMoveTime = 0;
    let vx = 0;
    let vy = 0;

    // Hover: freeze + scale
    img.addEventListener("mouseenter", () => {
      if (isFocusingRef.current || focusedRef.current === img) return;
      img.dataset.hovered = "true";
      img.style.cursor = "grab";
    });

    img.addEventListener("mouseleave", () => {
      delete img.dataset.hovered;
    });

    // Prevent native image drag
    img.addEventListener("dragstart", (e) => e.preventDefault());

    // Stop click from bubbling to container (would dismiss focused image)
    img.addEventListener("click", (e) => e.stopPropagation());

    // Mousedown: start potential drag
    img.addEventListener("mousedown", (e) => {
      if (isFocusingRef.current || focusedRef.current) return;
      e.preventDefault();
      isDragging = true;
      didDrag = false;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      prevX = e.clientX;
      prevY = e.clientY;
      lastMoveTime = performance.now();
      vx = 0;
      vy = 0;
      img.style.cursor = "grabbing";
      img.style.zIndex = "10";
    });

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!didDrag && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        didDrag = true;
        // Remove from scatter tracking if applicable so it stops falling
        scatterImgsRef.current = scatterImgsRef.current.filter(
          (entry) => entry.el !== img
        );
        // Kill any GSAP tweens on this image
        gsap.killTweensOf(img);
        img.style.opacity = String(
          (controlsRef.current as typeof controls).maxOpacity
        );
        img.style.transform = "scale(1)";
        img.dataset.dragging = "true";
      }

      if (didDrag) {
        // Move the image with cursor — read position from tracked data
        const curX = tracked ? tracked.x : (parseFloat(img.dataset.posX || "0"));
        const curY = tracked ? tracked.y : (parseFloat(img.dataset.posY || "0"));
        const moveX = e.clientX - lastX;
        const moveY = e.clientY - lastY;
        const newX = curX + moveX;
        const newY = curY + moveY;

        if (tracked) {
          tracked.x = newX;
          tracked.y = newY;
        }
        img.dataset.posX = String(newX);
        img.dataset.posY = String(newY);
        img.style.transform = `translate(${newX}px,${newY}px) scale(1)`;

        // Track velocity (smoothed)
        const now = performance.now();
        const elapsed = (now - lastMoveTime) / 1000;
        if (elapsed > 0) {
          const instantVx = (e.clientX - prevX) / elapsed;
          const instantVy = (e.clientY - prevY) / elapsed;
          vx = vx * 0.6 + instantVx * 0.4;
          vy = vy * 0.6 + instantVy * 0.4;
        }
        prevX = e.clientX;
        prevY = e.clientY;
        lastMoveTime = now;
      }

      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      img.style.cursor = "grab";

      if (didDrag) {
        // Throw the image!
        img.style.zIndex = "";
        delete img.dataset.hovered;
        delete img.dataset.dragging;

        // Clamp velocity so it doesn't fly insanely far
        const maxV = 1800;
        vx = Math.max(-maxV, Math.min(maxV, vx));
        vy = Math.max(-maxV, Math.min(maxV, vy));

        const posX = tracked ? tracked.x : parseFloat(img.dataset.posX || "0");
        const posY = tracked ? tracked.y : parseFloat(img.dataset.posY || "0");
        const size = tracked ? tracked.size : (parseFloat(img.style.width) || 40);

        thrownImgsRef.current.push({
          el: img,
          x: posX,
          y: posY,
          size,
          vx,
          vy,
        });

        // Ensure throw physics loop is running
        startThrowLoop();
      } else {
        img.style.zIndex = "";
        // It was a click, not a drag — trigger focus
        if (!isFocusingRef.current) {
          focusImage(img);
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Store cleanup so we can remove listeners if img is removed
    (img as any).__throwCleanup = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  };

  /* ---------- Scatter-fall helpers (optimised) ---------- */
  /** Hard cap on total images in the container. */
  const isMobileDevice = typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches;
  const MAX_IMAGES = isMobileDevice ? 20 : 80;

  const spawnScatterBatch = () => {
    const container = containerRef.current;
    if (!container || IMAGE_POOL.length === 0) return;
    if (!cycleRunningRef.current) return;

    const c = controlsRef.current as typeof controls;
    const vw = container.clientWidth;
    const sizeRange = c.maxImageSize - c.minImageSize;
    const batchSize = c.scatterBatchSize;

    // Enforce hard cap — skip spawn if at limit
    if (scatterImgsRef.current.length >= MAX_IMAGES) return;
    const canSpawn = Math.min(batchSize, MAX_IMAGES - scatterImgsRef.current.length);

    const images = pickRandom(IMAGE_POOL, canSpawn);

    for (let i = 0; i < canSpawn; i++) {
      const size = c.minImageSize + Math.random() * sizeRange;
      const padding = c.scatterPadding;
      const x = padding + Math.random() * (vw - padding * 2 - size);
      const startY = 0;

      const srcPath = images[i % images.length];
      const img = createCachedImage(srcPath, size);
      img.className = styles.squiggleImage;
      img.dataset.srcPath = srcPath;
      img.style.opacity = String(c.maxOpacity);
      // Position via transform (no left/top — compositor only)
      img.style.transform = `translate(${x}px,${startY}px) scale(0)`;
      img.dataset.posX = String(x);
      img.dataset.posY = String(startY);

      const speed = c.fallSpeedMin + Math.random() * (c.fallSpeedMax - c.fallSpeedMin);

      const tracked: TrackedImage = {
        el: img,
        x,
        y: startY,
        size,
        speed,
        baseScale: 0,
      };

      attachInteractionHandlers(img, tracked);
      container.appendChild(img);
      scatterImgsRef.current.push(tracked);
    }
  };

  const startScatterFall = () => {
    const c = controlsRef.current as typeof controls;

    // Start the RAF loop
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = now;

      const container = containerRef.current;
      if (!container) {
        scatterRafRef.current = requestAnimationFrame(tick);
        return;
      }
      const vh = container.clientHeight;
      const c = controlsRef.current as typeof controls;
      const growH = c.scatterGrowZone * vh;
      const shrinkStart = vh * (1 - c.scatterShrinkZone);

      // Update each falling image
      const alive: TrackedImage[] = [];
      for (const entry of scatterImgsRef.current) {
        // If hovered or focused, pause falling
        if (entry.el.dataset.hovered || focusedRef.current === entry.el) {
          alive.push(entry);
          continue;
        }
        entry.y += entry.speed * dt;

        // Scale based on Y position: grow near top, shrink near bottom
        let t: number;
        if (entry.y < growH) {
          t = growH > 0 ? entry.y / growH : 1;
        } else if (entry.y > shrinkStart) {
          t = shrinkStart < vh ? (vh - entry.y) / (vh - shrinkStart) : 0;
        } else {
          t = 1;
        }
        t = Math.max(0, Math.min(1, t));
        // Ease-out for grow, ease-in for shrink (exponent from control)
        const exp = c.scatterEasing;
        const baseScale = entry.y <= growH
          ? 1 - Math.pow(1 - t, exp)   // easeOut
          : Math.pow(t, exp);           // easeIn
        entry.baseScale = baseScale;

        // Remove only when past the bottom edge or shrunk away at the bottom
        if (entry.y >= vh + 10 || (entry.y > shrinkStart && baseScale <= 0.01)) {
          const cleanup = (entry.el as any).__throwCleanup;
          if (cleanup) cleanup();
          entry.el.remove();
        } else {
          // Write position + scale (opacity is constant at maxOpacity)
          entry.el.style.transform = `translate(${entry.x}px,${entry.y}px) scale(${baseScale})`;
          alive.push(entry);
        }
      }
      scatterImgsRef.current = alive;

      scatterRafRef.current = requestAnimationFrame(tick);
    };

    scatterRafRef.current = requestAnimationFrame(tick);

    // Start periodic spawning
    spawnScatterBatch(); // immediate first batch
    scatterSpawnTimerRef.current = setInterval(() => {
      if (cycleRunningRef.current) spawnScatterBatch();
    }, c.scatterSpawnInterval * 1000);
  };

  const stopScatterFall = () => {
    if (scatterRafRef.current) {
      cancelAnimationFrame(scatterRafRef.current);
      scatterRafRef.current = null;
    }
    if (scatterSpawnTimerRef.current) {
      clearInterval(scatterSpawnTimerRef.current);
      scatterSpawnTimerRef.current = null;
    }
    // Remove remaining scatter images
    for (const entry of scatterImgsRef.current) {
      gsap.killTweensOf(entry.el);
      const cleanup = (entry.el as any).__throwCleanup;
      if (cleanup) cleanup();
      entry.el.remove();
    }
    scatterImgsRef.current = [];
  };

  /* ---------- Spawn one line (reads controlsRef) ---------- */
  const spawnLineRef = useRef(() => {});
  spawnLineRef.current = () => {
    const container = containerRef.current;
    if (!container || IMAGE_POOL.length === 0) return;

    const c = controlsRef.current as typeof controls;

    // Scatter mode uses its own continuous fall loop
    if (c.mode === "scatter") return;

    const vw = container.clientWidth;
    const vh = container.clientHeight;

    // Generate path based on mode
    let pathPoints: Pt[];

    switch (c.mode) {
      case "linear":
        pathPoints = generateLinearPath(c.curvePoints, vw, vh, {
          padding: c.linearPadding,
          wobble: c.linearWobble,
        });
        break;
      case "arc":
      default:
        pathPoints = generateArcPath(c.curvePoints, vw, vh, {
          minRadius: c.minRadius,
          maxRadius: c.maxRadius,
          arcSpan: c.arcSpan,
          noise: c.arcNoise,
          exclusionRadius: c.exclusionRadius,
        });
        break;
    }

    // Debug visualisation
    if (c.showDebugPath) {
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svg.setAttribute("width", `${vw}`);
      svg.setAttribute("height", `${vh}`);
      svg.style.cssText =
        "position:absolute;top:0;left:0;pointer-events:none;z-index:1;";

      const pathD: string[] = [];
      for (let i = 0; i <= 100; i++) {
        const p = evalCatmullRom(pathPoints, i / 100);
        pathD.push(`${i === 0 ? "M" : "L"}${p.x},${p.y}`);
      }
      const pathEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      pathEl.setAttribute("d", pathD.join(" "));
      pathEl.setAttribute("fill", "none");
      pathEl.setAttribute("stroke", "red");
      pathEl.setAttribute("stroke-width", "1");
      svg.appendChild(pathEl);

      container.appendChild(svg);
      const totalDur =
        c.fadeInStagger * c.imagesPerLine +
        c.holdDuration +
        c.fadeOutStagger * c.imagesPerLine +
        c.fadeOutDuration;
      setTimeout(() => svg.remove(), totalDur * 1000 + 500);
    }

    // Pick images
    const images = pickRandom(IMAGE_POOL, c.imagesPerLine);

    // Place images
    const imgEls: HTMLImageElement[] = [];
    const sizeRange = c.maxImageSize - c.minImageSize;

    for (let i = 0; i < c.imagesPerLine; i++) {
      const t = i / (c.imagesPerLine - 1);
      const pos = evalCatmullRom(pathPoints, t);

      const size = c.minImageSize + Math.random() * sizeRange;
      const half = size / 2;
      const x = pos.x - half;
      const y = pos.y - half;

      const srcPath = images[i % images.length];
      const img = createCachedImage(srcPath, size);
      img.className = styles.squiggleImage;
      img.dataset.srcPath = srcPath;
      // Position via transform
      img.style.transform = `translate(${x}px,${y}px) scale(1)`;
      img.dataset.posX = String(x);
      img.dataset.posY = String(y);

      // Attach hover/drag/click/throw handlers
      attachInteractionHandlers(img);

      container.appendChild(img);
      imgEls.push(img);
    }

    // Compute eased stagger delays
    // staggerEase < 1 = ease-out (fast start, slow end)
    // staggerEase = 1 = linear
    // staggerEase > 1 = ease-in (slow start, fast end)
    const n = imgEls.length;
    const totalInTime = c.fadeInStagger * (n - 1);
    const totalOutTime = c.fadeOutStagger * (n - 1);

    const easedDelay = (i: number, total: number) => {
      if (n <= 1) return 0;
      const t = i / (n - 1); // 0..1
      return Math.pow(t, c.staggerEase) * total;
    };

    // Animate
    const tl = gsap.timeline();

    // Fade in — each image at its eased offset
    for (let i = 0; i < n; i++) {
      tl.to(
        imgEls[i],
        {
          opacity: c.maxOpacity,
          duration: c.fadeInDuration,
          ease: "power2.out",
        },
        easedDelay(i, totalInTime)
      );
    }

    // Hold — starts after the last fade-in completes
    const holdStart = totalInTime + c.fadeInDuration;
    const fadeOutStart = holdStart + c.holdDuration;

    // Fade out — each image at its eased offset after hold
    for (let i = 0; i < n; i++) {
      const el = imgEls[i];
      tl.call(
        () => {
          // If hovered or focused, skip the fade-out for this image
          if (el.dataset.hovered || focusedRef.current === el) return;
          gsap.to(el, {
            opacity: 0,
            duration: c.fadeOutDuration,
            ease: "power2.in",
          });
        },
        undefined,
        fadeOutStart + easedDelay(i, totalOutTime)
      );
    }

    // Cleanup after everything finishes
    const cleanupTime =
      fadeOutStart + totalOutTime + c.fadeOutDuration + 0.1;
    tl.call(
      () => {
        imgEls.forEach((el) => {
          // Don't remove focused or hovered images
          if (el.dataset.hovered || focusedRef.current === el) return;
          const cleanup = (el as any).__throwCleanup;
          if (cleanup) cleanup();
          el.remove();
        });
        const idx = activeTweensRef.current.indexOf(tl);
        if (idx !== -1) activeTweensRef.current.splice(idx, 1);
      },
      undefined,
      cleanupTime
    );

    activeTweensRef.current.push(tl);
  };

  /* ---------- Focus / Unfocus ---------- */
  const focusImage = (img: HTMLImageElement) => {
    if (isFocusingRef.current) return;
    isFocusingRef.current = true;
    focusedRef.current = img;
    cycleRunningRef.current = false;
    onFocus?.();

    // Stop the cycle timer
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }

    // Stop scatter fall system entirely (will restart on unfocus)
    // First pull the focused image out of tracking so stopScatterFall won't remove it
    scatterImgsRef.current = scatterImgsRef.current.filter(
      (entry) => entry.el !== img
    );
    stopScatterFall();

    // Kill all running timelines (fades out other images naturally)
    activeTweensRef.current.forEach((t) => t.kill());
    activeTweensRef.current = [];

    const container = containerRef.current;
    if (!container) return;

    // Enable pointer-events on container so whitespace clicks work
    container.style.pointerEvents = "auto";
    container.style.cursor = "default";

    // Scale down all OTHER images currently in the container
    const allImgs = container.querySelectorAll<HTMLImageElement>(
      `.${styles.squiggleImage}`
    );
    allImgs.forEach((el) => {
      if (el === img) return;
      gsap.to(el, {
        scale: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          const cleanup = (el as any).__throwCleanup;
          if (cleanup) cleanup();
          el.remove();
        },
      });
    });

    // Clear scatter tracking for all other images
    scatterImgsRef.current = [];

    // Target: left side, vertically centered (image + caption as group)
    const targetSize = Math.min(320, container.clientWidth * 0.35);
    const captionText = IMAGE_CAPTION_MAP[img.dataset.srcPath || ""] || "";

    // Create caption element (hidden initially to measure height)
    let captionEl: HTMLParagraphElement | null = null;
    let captionH = 0;
    const captionGap = 14;

    if (captionText) {
      captionEl = document.createElement("p");
      captionEl.className = styles.focusCaption;
      captionEl.textContent = captionText;
      captionEl.style.width = `${targetSize}px`;
      captionEl.style.opacity = "0";
      container.appendChild(captionEl);
      captionH = captionEl.offsetHeight;
      focusedCaptionRef.current = captionEl;
    }

    // Total group height = image + gap + caption
    const groupH = targetSize + (captionH > 0 ? captionGap + captionH : 0);
    const groupTop = (container.clientHeight - groupH) / 2;
    const targetX = container.clientWidth * 0.12 - targetSize / 2;
    const targetY = groupTop;

    // Position caption below image target
    if (captionEl) {
      captionEl.style.position = "absolute";
      captionEl.style.left = `${targetX}px`;
      captionEl.style.top = `${targetY + targetSize + captionGap}px`;
      captionEl.style.width = `${targetSize}px`;
    }

    // Create close (X) button above the image on the left
    const closeBtn = document.createElement("button");
    closeBtn.className = styles.focusCloseBtn;
    closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" stroke-width="0.5"/><line x1="15" y1="1" x2="1" y2="15" stroke="currentColor" stroke-width="0.5"/></svg>`;
    closeBtn.style.position = "absolute";
    closeBtn.style.left = `${targetX}px`;
    closeBtn.style.top = `${targetY - 28}px`;
    closeBtn.style.opacity = "0";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      unfocusImage();
    });
    container.appendChild(closeBtn);
    focusedCloseBtnRef.current = closeBtn;

    // Animate the image: switch from transform to left/top for focus animation
    // since GSAP needs pixel properties for the target position.
    const currentX = parseFloat(img.dataset.posX || "0");
    const currentY = parseFloat(img.dataset.posY || "0");
    img.style.left = `${currentX}px`;
    img.style.top = `${currentY}px`;
    img.style.transform = "scale(1)";
    img.style.cursor = "default";
    focusedTweenRef.current = gsap.to(img, {
      left: targetX,
      top: targetY,
      width: targetSize,
      height: targetSize,
      scale: 1,
      opacity: 1,
      duration: 0.9,
      ease: "power4.inOut",
      onComplete: () => {
        isFocusingRef.current = false;
        // Fade in caption after image settles
        if (captionEl) {
          gsap.to(captionEl, {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          });
        }
        // Fade in close button
        if (focusedCloseBtnRef.current) {
          gsap.to(focusedCloseBtnRef.current, {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          });
        }
      },
    });
  };

  const unfocusImage = () => {
    const img = focusedRef.current;
    const captionEl = focusedCaptionRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    isFocusingRef.current = true;

    // Slide the focused image off the left edge
    const imgWidth = img.offsetWidth || parseFloat(img.style.width) || 0;
    const currentLeft = parseFloat(img.style.left) || 0;
    const offScreenX = -(imgWidth + currentLeft + 40);

    // Fade out close button simultaneously
    const closeBtn = focusedCloseBtnRef.current;
    if (closeBtn) {
      gsap.to(closeBtn, {
        left: `+=${offScreenX - currentLeft}`,
        opacity: 0,
        duration: 0.6,
        ease: "power3.in",
        onComplete: () => closeBtn.remove(),
      });
      focusedCloseBtnRef.current = null;
    }

    // Fade out caption simultaneously (if present)
    if (captionEl) {
      gsap.to(captionEl, {
        left: `+=${offScreenX - currentLeft}`,
        opacity: 0,
        duration: 0.6,
        ease: "power3.in",
        onComplete: () => captionEl.remove(),
      });
      focusedCaptionRef.current = null;
    }

    gsap.to(img, {
      left: offScreenX,
      duration: 0.6,
      ease: "power3.in",
      onComplete: () => {
        const cleanup = (img as any).__throwCleanup;
        if (cleanup) cleanup();
        img.remove();
        focusedRef.current = null;
        isFocusingRef.current = false;

        // Restore container pointer-events
        container.style.pointerEvents = "";
        container.style.cursor = "";

        onUnfocus?.();

        // Restart the cycle
        cycleRunningRef.current = true;
        if (runCycleRef.current && !cancelledRef.current) {
          runCycleRef.current();
        }
      },
    });
  };

  /* ---------- Container click (dismiss focused image) ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      // Only dismiss if we have a focused image and the click
      // is NOT on the focused image itself
      if (!focusedRef.current || isFocusingRef.current) return;
      if (e.target === focusedRef.current) return;
      if (e.target === focusedCaptionRef.current) return;
      unfocusImage();
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Stable cycle loop (runs once, reads refs) ---------- */
  useEffect(() => {
    cancelledRef.current = false;

    const init = async () => {
      await loadImagePool();
      if (cancelledRef.current) return;

      // Pre-decode all images so cloneNode reuses decoded bitmaps
      await Promise.all(IMAGE_POOL.map((src) => preloadImage(src)));
      if (cancelledRef.current) return;

      // Wait for landing intro animation before starting
      if (delayStart > 0) {
        await new Promise((r) => setTimeout(r, delayStart));
      }
      if (cancelledRef.current) return;

      const runCycle = () => {
        if (cancelledRef.current) return;
        if (!cycleRunningRef.current) return;

        const c = controlsRef.current as typeof controls;

        // Scatter mode uses the continuous fall system instead
        if (c.mode === "scatter") {
          // Start scatter if not already running
          if (!scatterRafRef.current) startScatterFall();
          cycleTimerRef.current = setTimeout(runCycle, c.cycleInterval * 1000);
          return;
        }

        // Stop scatter if we switched away from it
        if (scatterRafRef.current) stopScatterFall();

        const lines = c.linesPerCycle;
        const delay = c.lineDelay * 1000;

        for (let i = 0; i < lines; i++) {
          if (i === 0) {
            spawnLineRef.current();
          } else {
            setTimeout(() => {
              if (!cancelledRef.current && cycleRunningRef.current) {
                spawnLineRef.current();
              }
            }, delay * i);
          }
        }

        cycleTimerRef.current = setTimeout(
          runCycle,
          c.cycleInterval * 1000
        );
      };

      runCycleRef.current = runCycle;
      runCycle();
    };

    init();

    return () => {
      cancelledRef.current = true;
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      stopScatterFall();
      if (throwRafRef.current) {
        cancelAnimationFrame(throwRafRef.current);
        throwRafRef.current = null;
      }
      thrownImgsRef.current.forEach((t) => {
        const cleanup = (t.el as any).__throwCleanup;
        if (cleanup) cleanup();
      });
      thrownImgsRef.current = [];
      activeTweensRef.current.forEach((t) => t.kill());
      activeTweensRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Leva
        hidden={levaHidden}
        collapsed={false}
        titleBar={{ title: "Squiggle Controls" }}
      />
      <div ref={containerRef} className={styles.container} />
    </>
  );
};
