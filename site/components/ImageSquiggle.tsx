"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useControls, folder, Leva } from "leva";
import { transitionConfig } from "@/lib/levaConfig";
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

export const ImageSquiggle: React.FC<{ delayStart?: number }> = ({ delayStart = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTweensRef = useRef<gsap.core.Timeline[]>([]);
  const [levaHidden, setLevaHidden] = useState(true);

  // Scatter-fall state
  const scatterImgsRef = useRef<{ el: HTMLImageElement; speed: number; y: number }[]>([]);
  const scatterRafRef = useRef<number | null>(null);
  const scatterSpawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFrameRef = useRef<number>(0);

  // Throw physics state
  type ThrownEntry = {
    el: HTMLImageElement;
    x: number;
    y: number;
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
        value: "arc",
        options: ["arc", "linear", "scatter"],
      },
    }),
    General: folder({
      imagesPerLine: { value: isMobile ? 24 : 70, min: 3, max: 100, step: 1 },
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
        value: 3,
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
  });

  // Sync ref every render (cheap assignment, no effect restart).
  controlsRef.current = controls;

  // Sync page transition config to shared module
  transitionConfig.duration = controls.transitionDuration;
  transitionConfig.easePower = controls.transitionEasePower;

  /* ---------- Toggle leva panel with "L" key ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "l" || e.key === "L") {
        setLevaHidden((h) => !h);
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

    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const tick = () => {
      const c = controlsRef.current as typeof controls;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const radius = c.proximityRadius;
      const maxScale = c.proximityScale;
      const ease = c.proximityEase;

      const imgs = container.querySelectorAll<HTMLImageElement>(
        `.${styles.squiggleImage}`
      );
      imgs.forEach((img) => {
        if (focusedRef.current === img || isFocusingRef.current) return;
        if (img.dataset.dragging) return;

        const left = parseFloat(img.style.left) || 0;
        const top = parseFloat(img.style.top) || 0;
        const cx = left + img.offsetWidth / 2;
        const cy = top + img.offsetHeight / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const t = Math.pow(1 - dist / radius, ease);
          const scale = 1 + (maxScale - 1) * t;
          img.style.transform = `scale(${scale})`;
        } else {
          img.style.transform = "scale(1)";
        }
      });

      proximityRafRef.current = requestAnimationFrame(tick);
    };

    proximityRafRef.current = requestAnimationFrame(tick);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
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

        const w = t.el.offsetWidth;
        const h = t.el.offsetHeight;

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

        t.el.style.left = `${t.x}px`;
        t.el.style.top = `${t.y}px`;

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

  const attachInteractionHandlers = (img: HTMLImageElement) => {
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
        // Move the image with cursor
        const imgLeft = parseFloat(img.style.left) || 0;
        const imgTop = parseFloat(img.style.top) || 0;
        const moveX = e.clientX - lastX;
        const moveY = e.clientY - lastY;
        img.style.left = `${imgLeft + moveX}px`;
        img.style.top = `${imgTop + moveY}px`;

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

        thrownImgsRef.current.push({
          el: img,
          x: parseFloat(img.style.left) || 0,
          y: parseFloat(img.style.top) || 0,
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

  /* ---------- Scatter-fall helpers ---------- */
  const spawnScatterBatch = () => {
    const container = containerRef.current;
    if (!container || IMAGE_POOL.length === 0) return;
    if (!cycleRunningRef.current) return;

    const c = controlsRef.current as typeof controls;
    const vw = container.clientWidth;
    const sizeRange = c.maxImageSize - c.minImageSize;
    const batchSize = c.scatterBatchSize;

    const images = pickRandom(IMAGE_POOL, batchSize);

    for (let i = 0; i < batchSize; i++) {
      const size = c.minImageSize + Math.random() * sizeRange;
      const padding = c.scatterPadding;
      const x = padding + Math.random() * (vw - padding * 2 - size);
      // Start above the viewport
      const startY = -(size + Math.random() * 100);

      const img = document.createElement("img");
      const srcPath = images[i % images.length];
      img.src = srcPath;
      img.dataset.srcPath = srcPath;
      img.alt = "";
      img.loading = "eager";
      img.className = styles.squiggleImage;
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.style.left = `${x}px`;
      img.style.top = `${startY}px`;
      img.style.opacity = "0";

      // Attach hover/drag/click/throw handlers
      attachInteractionHandlers(img);

      container.appendChild(img);

      // Fade in
      gsap.to(img, {
        opacity: c.maxOpacity,
        duration: 0.6,
        ease: "power2.out",
      });

      // Parallax speed — random between min and max
      const speed =
        c.fallSpeedMin +
        Math.random() * (c.fallSpeedMax - c.fallSpeedMin);

      scatterImgsRef.current.push({ el: img, speed, y: startY });
    }
  };

  const startScatterFall = () => {
    const c = controlsRef.current as typeof controls;

    // Start the RAF loop
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastFrameRef.current) / 1000; // seconds
      lastFrameRef.current = now;

      const container = containerRef.current;
      if (!container) {
        scatterRafRef.current = requestAnimationFrame(tick);
        return;
      }
      const vh = container.clientHeight;

      // Update each falling image
      const alive: typeof scatterImgsRef.current = [];
      for (const entry of scatterImgsRef.current) {
        // If hovered or focused, pause falling
        if (entry.el.dataset.hovered || focusedRef.current === entry.el) {
          alive.push(entry);
          continue;
        }
        entry.y += entry.speed * dt;
        entry.el.style.top = `${entry.y}px`;

        // Kill if below viewport
        if (entry.y > vh + 50) {
          gsap.killTweensOf(entry.el);
          entry.el.remove();
        } else {
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

      const img = document.createElement("img");
      const srcPath = images[i % images.length];
      img.src = srcPath;
      img.dataset.srcPath = srcPath;
      img.alt = "";
      img.loading = "eager";
      img.className = styles.squiggleImage;
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.style.left = `${pos.x - half}px`;
      img.style.top = `${pos.y - half}px`;

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
        onComplete: () => el.remove(),
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

    // Animate the image
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
      },
    });
  };

  const unfocusImage = () => {
    const img = focusedRef.current;
    const captionEl = focusedCaptionRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    isFocusingRef.current = true;

    // Fade out caption first (if present)
    if (captionEl) {
      gsap.to(captionEl, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => captionEl.remove(),
      });
      focusedCaptionRef.current = null;
    }

    // Fade out the focused image
    gsap.to(img, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        img.remove();
        focusedRef.current = null;
        isFocusingRef.current = false;

        // Restore container pointer-events
        container.style.pointerEvents = "";
        container.style.cursor = "";

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
