"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { WelcomeLogo } from "./WelcomeLogo";
import { ImageSquiggle } from "./ImageSquiggle";
import styles from "./LandingPage.module.css";

/* ----------------------------------------------------------------
   Timing constants (ms)
   ---------------------------------------------------------------- */
const BORDER_DRAW_MS  = 900;   // SVG trim-path draw-on
const FILL_FADE_MS    = 400;   // background fill fade
const CHAR_FADE_MS    = 250;   // per-character fade duration
const CHAR_TRAVEL     = 6;     // px each char drifts up
const CHAR_STAGGER_MS = 2;     // base stagger between chars
const ELEM_GAP_MS     = 80;    // gap between element groups (logo → title → desc → …)
const IMAGE_DELAY_MS  = 200;   // extra pause before ImageCycler appears
const SHRINK_MS       = 900;   // how long the fullscreen → normal shrink takes

// Total time ImageSquiggle should wait before starting
// (starts after the shrink completes, so only a small delay after "done")
const SQUIGGLE_DELAY  = 200;

/** How much of the landing section's scroll range drives the reverse.
 *  0.35 = reverse completes by 35% scrolled. */
const REVERSE_SCROLL_SPAN = 0.35;

/* ----------------------------------------------------------------
   CharReveal — splits children text into per-character spans
   while preserving inner elements (<span>, <br>, <a>, etc.)

   During intro: CSS transitions drive each char.
   During scroll/focus reverse: a rAF loop writes directly to the
   span DOM nodes via data-slot attributes (no React re-render).
   ---------------------------------------------------------------- */
interface CharRevealProps {
  children: React.ReactNode;
  revealed: boolean;
  baseDelay: number;       // ms offset for this group
  onLastChar?: (delay: number) => void;
}

let charCounter = 0; // running index for stagger across groups
let shuffledDelays: number[] = []; // pre-shuffled delay slots

/** Build a shuffled mapping: character index → random delay slot.
 *  Called once per render with the total char count. */
function buildShuffledDelays(totalChars: number) {
  // Create array [0, 1, 2, ..., totalChars-1]
  const indices = Array.from({ length: totalChars }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  shuffledDelays = indices;
}

function flattenToCharSpans(
  node: React.ReactNode,
  revealed: boolean,
  wrapperClass?: string,
): React.ReactNode {
  if (typeof node === "string") {
    const totalSlots = shuffledDelays.length || 1;

    return node.split("").map((ch, i) => {
      const idx = charCounter++;
      const slot = shuffledDelays[idx] ?? idx;
      const delay = slot * CHAR_STAGGER_MS;

      return (
        <span
          key={idx}
          className={wrapperClass}
          data-char-slot={slot}
          data-char-total={totalSlots}
          style={{
            display: "inline-block",
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
            transition: `opacity ${CHAR_FADE_MS}ms ${delay}ms ease-out, transform ${CHAR_FADE_MS}ms ${delay}ms ease-out`,
            whiteSpace: ch === " " ? "pre" : undefined,
          }}
        >
          {ch}
        </span>
      );
    });
  }

  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<any>;
    if (el.type === "br") return node;

    const kids = React.Children.map(el.props.children, (child) =>
      flattenToCharSpans(child, revealed, el.props.className)
    );
    return React.cloneElement(el, { ...el.props, key: el.key }, kids);
  }

  if (Array.isArray(node)) {
    return node.map((child) => flattenToCharSpans(child, revealed));
  }

  return node;
}

const CharReveal: React.FC<CharRevealProps> = ({
  children,
  revealed,
  baseDelay,
}) => {
  charCounter = Math.round(baseDelay / CHAR_STAGGER_MS);
  const result = flattenToCharSpans(children, revealed);
  return <>{result}</>;
};

/* ----------------------------------------------------------------
   Direct-DOM updater for scroll/focus reverse
   Runs in a rAF loop — zero React re-renders.
   ---------------------------------------------------------------- */
function applyReverseVis(
  vis: number,
  reverseT: number,
  clusterEl: HTMLDivElement | null,
  svgRectEl: SVGRectElement | null,
  logoWrapEl: HTMLDivElement | null,
  companyLogosEl: HTMLDivElement | null,
  perim: number,
) {
  if (!clusterEl) return;

  // Cluster opacity
  clusterEl.style.opacity = `${vis}`;

  // SVG border dashoffset
  if (svgRectEl) {
    svgRectEl.setAttribute("stroke-dashoffset", `${perim * reverseT}`);
    svgRectEl.style.transition = "none";
  }

  // Logo
  if (logoWrapEl) {
    logoWrapEl.style.opacity = `${vis}`;
    logoWrapEl.style.transform = `translateY(${(1 - vis) * CHAR_TRAVEL}px)`;
    logoWrapEl.style.transition = "none";
  }

  // Company logos
  if (companyLogosEl) {
    companyLogosEl.style.opacity = `${vis}`;
    companyLogosEl.style.transform = `translateY(${(1 - vis) * CHAR_TRAVEL}px)`;
    companyLogosEl.style.transition = "none";
  }

  // Per-character spans
  const charSpans = clusterEl.querySelectorAll<HTMLSpanElement>("[data-char-slot]");
  for (let i = 0; i < charSpans.length; i++) {
    const span = charSpans[i];
    const slot = Number(span.dataset.charSlot);
    const totalSlots = Number(span.dataset.charTotal) || 1;
    const norm = slot / totalSlots;
    const BAND = 0.4;
    const bandStart = (1 - norm) * (1 - BAND);
    const bandEnd = bandStart + BAND;
    const charVis = Math.max(0, Math.min(1,
      (vis - bandStart) / (bandEnd - bandStart)
    ));
    span.style.opacity = `${charVis}`;
    span.style.transform = `translateY(${(1 - charVis) * CHAR_TRAVEL}px)`;
    span.style.transition = "none";
  }
}

/** Clear reverse overrides so CSS transitions work again. */
function clearReverseVis(
  clusterEl: HTMLDivElement | null,
  svgRectEl: SVGRectElement | null,
  logoWrapEl: HTMLDivElement | null,
  companyLogosEl: HTMLDivElement | null,
) {
  if (!clusterEl) return;

  clusterEl.style.opacity = "";

  if (svgRectEl) {
    svgRectEl.style.transition = "";
  }

  if (logoWrapEl) {
    logoWrapEl.style.transition = "";
  }

  if (companyLogosEl) {
    companyLogosEl.style.transition = "";
  }

  const charSpans = clusterEl.querySelectorAll<HTMLSpanElement>("[data-char-slot]");
  for (let i = 0; i < charSpans.length; i++) {
    const span = charSpans[i];
    span.style.transition = "";
  }
}

/* ----------------------------------------------------------------
   LandingPage component
   ---------------------------------------------------------------- */
/** Module-level flag — ensures the fullscreen intro only runs once per page load. */
let introPlayed = false;

export const LandingPage: React.FC = () => {
  const clusterRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGRectElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const companyLogosRef = useRef<HTMLDivElement>(null);
  const landingRef = useRef<HTMLElement>(null);

  const [phase, setPhase] = useState<
    "hidden" | "border" | "fill" | "chars" | "shrink" | "done"
  >(introPlayed ? "done" : "border");

  // --- Scroll & focus visibility stored in refs (no re-renders) ---
  const scrollProgRef = useRef(0);
  const focusVisRef = useRef(1);
  const focusTweenRef = useRef<{ kill: () => void } | null>(null);
  /** Whether the rAF reverse loop is currently active. */
  const reverseActiveRef = useRef(false);
  const reverseRafRef = useRef(0);
  /** Cached perimeter for SVG dashoffset. */
  const perimRef = useRef(0);

  const handleImageFocus = useCallback(() => {
    focusTweenRef.current?.kill();
    const obj = { v: 1 };
    focusVisRef.current = 1;
    const tween = gsap.to(obj, {
      v: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onUpdate: () => { focusVisRef.current = obj.v; },
    });
    focusTweenRef.current = tween;
  }, []);

  const handleImageUnfocus = useCallback(() => {
    focusTweenRef.current?.kill();
    const obj = { v: focusVisRef.current };
    const tween = gsap.to(obj, {
      v: 1,
      duration: 0.6,
      ease: "power2.inOut",
      onUpdate: () => { focusVisRef.current = obj.v; },
    });
    focusTweenRef.current = tween;
  }, []);

  // Measure cluster for SVG border rect
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  /** Final (non-fullscreen) cluster rect, measured once on mount. */
  const targetRectRef = useRef<{ w: number; h: number; x: number; y: number }>({
    w: 0, h: 0, x: 0, y: 0,
  });

  const measure = useCallback(() => {
    if (!clusterRef.current) return;
    const { width, height } = clusterRef.current.getBoundingClientRect();
    setBoxSize({ w: width, h: height });
  }, []);

  /**
   * Measure what the cluster *would* be without fullscreen overrides.
   * We temporarily remove the fullscreen class, measure, then restore.
   */
  const measureTarget = useCallback(() => {
    const el = clusterRef.current;
    if (!el) return;
    // Remove fullscreen class to get the "natural" size
    el.classList.remove(styles.fullscreen);
    el.classList.remove(styles.shrinking);
    // Force reflow
    const rect = el.getBoundingClientRect();
    targetRectRef.current = { w: rect.width, h: rect.height, x: rect.x, y: rect.y };
    // Restore fullscreen
    el.classList.add(styles.fullscreen);
  }, []);

  // Run intro sequence
  useEffect(() => {
    if (introPlayed) {
      // Intro already ran — just measure for SVG border and bail
      measure();
      return;
    }
    // Lock scroll during fullscreen intro (both native & Lenis)
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("lenis-lock"));
    measure();
    // Capture what the cluster's final size will be (before we start)
    measureTarget();
  }, [measure, measureTarget]);

  // Phase transitions
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "border") {
      timer = setTimeout(() => setPhase("fill"), BORDER_DRAW_MS - 400);
    } else if (phase === "fill") {
      timer = setTimeout(() => setPhase("chars"), FILL_FADE_MS * 0.4);
    } else if (phase === "chars") {
      timer = setTimeout(() => setPhase("shrink"), 1200);
    } else if (phase === "shrink") {
      // GSAP-driven shrink from fullscreen → target rect
      const el = clusterRef.current;
      if (!el) return;

      // Re-measure target in case of resize
      measureTarget();
      const target = targetRectRef.current;

      // Get current (fullscreen) rect BEFORE any class changes
      const from = el.getBoundingClientRect();

      // Set explicit starting size/position FIRST (while still fullscreen)
      gsap.set(el, {
        width: from.width,
        height: from.height,
        left: from.x,
        top: from.y,
      });

      // NOW swap classes — element keeps its size via GSAP inline styles
      el.classList.remove(styles.fullscreen);
      el.classList.add(styles.shrinking);

      gsap.to(el, {
        width: target.w,
        height: target.h,
        left: target.x,
        top: target.y,
        duration: SHRINK_MS / 1000,
        ease: "power3.inOut",
        onComplete: () => {
          // Clear GSAP inline styles
          gsap.set(el, { clearProps: "width,height,left,top" });
          el.classList.remove(styles.shrinking);
          // Mark intro as played so it never replays
          introPlayed = true;
          // Unlock scroll (both native & Lenis)
          document.body.style.overflow = "";
          window.dispatchEvent(new Event("lenis-unlock"));
          // Final measure for SVG border
          measure();
          setPhase("done");
        },
      });
    }
    return () => clearTimeout(timer);
  }, [phase, measure, measureTarget]);

  // Re-measure on resize
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Keep perimRef in sync
  useEffect(() => {
    perimRef.current = 2 * (boxSize.w + boxSize.h);
  }, [boxSize]);

  // --- Scroll listener: updates ref only, no setState ---
  useEffect(() => {
    const onScroll = () => {
      const el = landingRef.current;
      if (!el) return;
      const h = el.offsetHeight;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      scrollProgRef.current = Math.min(1, Math.max(0, h > 0 ? scrollY / h : 0));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- rAF loop: runs only when in "done" phase and reverse is active ---
  useEffect(() => {
    if (phase !== "done") return;

    let prevVis = -1;
    let wasReversing = false;

    const tick = () => {
      const scrollProg = scrollProgRef.current;
      const focusVis = focusVisRef.current;

      const reverseT = Math.min(1, scrollProg / REVERSE_SCROLL_SPAN);
      const scrollReversing = reverseT > 0;
      const focusReversing = focusVis < 1;
      const isReversing = scrollReversing || focusReversing;

      if (isReversing) {
        const scrollVis = scrollReversing ? 1 - reverseT : 1;
        const vis = Math.min(scrollVis, focusVis);

        // Only write DOM when vis actually changed
        if (Math.abs(vis - prevVis) > 0.001) {
          applyReverseVis(
            vis, reverseT,
            clusterRef.current, svgRef.current,
            logoWrapRef.current, companyLogosRef.current,
            perimRef.current,
          );
          prevVis = vis;
        }
        wasReversing = true;
      } else if (wasReversing) {
        // Just stopped reversing — clear overrides so CSS transitions work
        clearReverseVis(
          clusterRef.current, svgRef.current,
          logoWrapRef.current, companyLogosRef.current,
        );
        prevVis = -1;
        wasReversing = false;
      }

      reverseRafRef.current = requestAnimationFrame(tick);
    };

    reverseRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reverseRafRef.current);
  }, [phase]);

  const borderReady = phase !== "hidden";
  const fillReady = phase === "fill" || phase === "chars" || phase === "shrink" || phase === "done";
  const charsReady = phase === "chars" || phase === "shrink" || phase === "done";
  const isFullscreen = phase !== "done";

  // Perimeter for stroke-dasharray (used in JSX for intro only)
  const perim = 2 * (boxSize.w + boxSize.h);

  // Char reveal delay offsets
  let runningDelay = 0;
  const logoDelay = runningDelay;
  runningDelay += ELEM_GAP_MS;
  const textDelay = runningDelay;

  // Reset char counter and build shuffled delays before each render.
  charCounter = 0;
  if (shuffledDelays.length === 0) {
    buildShuffledDelays(200);
  }

  return (
    <section id="landing-page" ref={landingRef} className={styles.landing}>
      {phase === "done" && (
        <ImageSquiggle delayStart={SQUIGGLE_DELAY} onFocus={handleImageFocus} onUnfocus={handleImageUnfocus} />
      )}
      <div
        ref={clusterRef}
        className={`${styles.cluster} ${styles.introCluster}${isFullscreen ? ` ${styles.fullscreen}` : ""}`}
        style={{
          border: "none",
          background: (isFullscreen || fillReady) ? "var(--color-cluster-bg)" : "transparent",
          transition: (!isFullscreen && fillReady) ? `background ${FILL_FADE_MS}ms ease-out` : "none",
        }}
      >
        {/* SVG border — trim-path draw-on */}
        {boxSize.w > 0 && (
          <svg
            className={styles.borderSvg}
            width="100%"
            height="100%"
            viewBox={`0 0 ${boxSize.w} ${boxSize.h}`}
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              ref={svgRef}
              x="0.25"
              y="0.25"
              width={boxSize.w - 0.5}
              height={boxSize.h - 0.5}
              stroke="var(--color-text, #1A1C21)"
              strokeWidth="0.5"
              fill="none"
              strokeDasharray={perim}
              strokeDashoffset={borderReady ? 0 : perim}
              style={{
                transition: borderReady
                  ? `stroke-dashoffset ${BORDER_DRAW_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
                  : "none",
              }}
            />
          </svg>
        )}

        {/* Logo — large W */}
        <div
          ref={logoWrapRef}
          className={styles.logoWrap}
          style={{
            opacity: charsReady ? 1 : 0,
            transform: charsReady ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
            transition: `opacity ${CHAR_FADE_MS}ms ${logoDelay}ms ease-out, transform ${CHAR_FADE_MS}ms ${logoDelay}ms ease-out`,
          }}
        >
          <WelcomeLogo className={styles.logo} width={280} height={245} />
        </div>

        {/* Bottom row: tagline left, company logos right */}
        <div className={styles.bottomRow}>
          <p className={styles.tagline}>
            <CharReveal revealed={charsReady} baseDelay={textDelay}>
              {"We are experts at"}
              <br />
              {"introducing new"}
              <br />
              {"ideas to the"}
              <br />
              {"culture"}
            </CharReveal>
          </p>

          <div
            ref={companyLogosRef}
            className={styles.companyLogos}
            style={{
              opacity: charsReady ? 1 : 0,
              transition: `opacity ${CHAR_FADE_MS}ms ${textDelay + 400}ms ease-out`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/companylogos/image 47.png"
              alt="Red Bull"
              className={styles.companyLogo}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/companylogos/Puma_logo_PNG3 2.png"
              alt="Puma"
              className={styles.companyLogo}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/companylogos/uniqlologo.png"
              alt="Uniqlo"
              className={styles.companyLogo}
            />
          </div>
        </div>
      </div>
    </section>
  );
};