"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/* ================================================================
   Layout constants
   ================================================================ */
let LOGO_BAR_H = 52; // measured at runtime from #logo-bar
const HEADER_BLOCK_COLLAPSED_H = 26.5; // 0.5px sep + 25.5px row + 0.5px sep
const HEADER_ROW_COLLAPSED_H = 25.5;
const COLLAPSED_TITLE_SIZE = 20.6;
const MAX_VISIBLE_SLOTS = 2;
// Multiplier: 1 = collapse consumes exactly the px it shrinks (1:1 scroll).
const COLLAPSE_SPEED = 1;

/**
 * ScrollManager -- invisible component that wires up:
 *   1. Lenis smooth scroll
 *   2. Section header sticky-stack (declarative two-phase reconciler)
 *
 * The logo bar is purely CSS sticky -- no JS needed.
 * All header animations are scroll-linked and fully reversible.
 */
export const ScrollManager: React.FC = () => {
  const lenisRef = useRef<Lenis | null>(null);
  const lenisTickerRef = useRef<((time: number) => void) | null>(null);
  const [lenisEnabled, setLenisEnabled] = useState(false);

  /* ------------------------------------------------
     1. Lenis smooth scroll — create/destroy based on toggle
     ------------------------------------------------ */
  useEffect(() => {
    if (!lenisEnabled) {
      // Destroy existing instance so native scroll takes over
      if (lenisRef.current) {
        if (lenisTickerRef.current) {
          gsap.ticker.remove(lenisTickerRef.current);
          lenisTickerRef.current = null;
        }
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lenis = new Lenis({
      lerp: prefersReduced ? 1 : 0.08,
      smoothWheel: !prefersReduced,
      syncTouch: true,
      wheelMultiplier: 0.7,
      touchMultiplier: 0.7,
    });

    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tickerFn = (time: number) => lenis.raf(time * 1000);
    lenisTickerRef.current = tickerFn;
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      if (lenisTickerRef.current) {
        gsap.ticker.remove(lenisTickerRef.current);
        lenisTickerRef.current = null;
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [lenisEnabled]);

  /* ------------------------------------------------
     Listen for lenis-lock / lenis-unlock custom events
     (used by LandingPage to freeze scroll during intro)
     ------------------------------------------------ */
  useEffect(() => {
    const lock = () => { lenisRef.current?.stop(); };
    const unlock = () => { lenisRef.current?.start(); };
    window.addEventListener("lenis-lock", lock);
    window.addEventListener("lenis-unlock", unlock);
    return () => {
      window.removeEventListener("lenis-lock", lock);
      window.removeEventListener("lenis-unlock", unlock);
    };
  }, []);

  /* ------------------------------------------------
     Toggle Lenis on/off via "K" key
     ------------------------------------------------ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" || e.key === "K") {
        setLenisEnabled((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ------------------------------------------------
     2-3. GSAP ScrollTrigger animations
     ------------------------------------------------ */
  useGSAP(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Use a double-rAF to ensure the DOM is fully laid out and
    // Lenis (from the useEffect) is initialised before we read
    // element dimensions and attach gate handlers.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setupAnimations(prefersReduced, lenisRef);
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return null;
};

/* ================================================================
   Types
   ================================================================ */

/** Static info about a header -- never changes after setup. */
interface HeaderRef {
  id: string;
  block: HTMLElement;
  row: HTMLElement;
  section: HTMLElement;
  title: HTMLElement;
  tags: HTMLElement | null;
  expandedContent: HTMLElement | null;
  sectionContent: HTMLElement | null;
  bottomSep: HTMLElement | null;
  placeholder: HTMLElement | null;
  expandedBlockH: number;
  expandedRowH: number;
  expandedTitleSize: number;
}

/** Desired state for one header, computed fresh each frame. */
interface DerivedState {
  id: string;
  /** What this header should be doing right now. */
  mode: "expanded" | "collapsing" | "collapsed" | "exiting" | "dismissed";
  /** 0 = fully expanded, 1 = fully collapsed. Only meaningful when
   *  mode is "collapsing" or "collapsed". */
  progress: number;
  /** Desired viewport-Y for the top of this header (fixed positioning). */
  topPx: number;
  /** Desired opacity (used only during exit). */
  opacity: number;
  /** Which slot this header occupies (0 or 1), or -1 if none. */
  slot: number;
  /** z-index to apply. */
  zIndex: number;
}

/** Mutable per-header state that persists between frames for diffing. */
interface LiveState {
  currentMode: string;
  lastProgress: number;
  lastTopPx: number;
  lastOpacity: number;
  /** The viewport-Y at which this header first contacted the stack.
   *  Set once when transitioning expanded -> collapsing. */
  contactY: number;
}

/* ================================================================
   Setup
   ================================================================ */

function setupAnimations(
  prefersReduced: boolean,
  lenisRef: React.RefObject<Lenis | null>
) {
  const lenis = lenisRef.current;

  if (lenis) {
    // Intercept hash links (e.g. #section-redbull) and smooth-scroll.
    const hashClickHandler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href^='#section-']");
      if (!anchor) return;

      e.preventDefault();
      const targetId = (anchor as HTMLAnchorElement).getAttribute("href")!.slice(1);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      lenis.scrollTo(targetEl, {
        offset: -LOGO_BAR_H,
        duration: 0.8,
      });
    };

    document.addEventListener("click", hashClickHandler);

    // Down-arrow click — smooth scroll past landing
    const downArrow = document.getElementById("landing-down-arrow");
    const landing = document.getElementById("landing-page");
    const arrowClickHandler = () => {
      if (landing) {
        lenis.scrollTo(landing.offsetHeight, { duration: 0.8 });
      }
    };
    if (downArrow) {
      downArrow.addEventListener("click", arrowClickHandler);
    }

    // Logo click — scroll back to top
    const logoHomeBtn = document.getElementById("logo-home-btn");
    const logoClickHandler = () => {
      lenis.scrollTo(0, { duration: 0.8 });
    };
    if (logoHomeBtn) {
      logoHomeBtn.addEventListener("click", logoClickHandler);
    }
  }

  /* -- 3. Header sticky-stack -- */
  const sectionIds = ["redbull", "uniqlo", "puma", "services", "insight"];

  const headerRefs: HeaderRef[] = [];
  const liveStates: Record<string, LiveState> = {};

  for (const sectionId of sectionIds) {
    const block = document.getElementById(`header-block-${sectionId}`);
    const row = document.getElementById(`header-${sectionId}`);
    const section = document.getElementById(`section-${sectionId}`);
    if (!block || !row || !section) continue;

    const title = row.querySelector<HTMLElement>("[class*='title']");
    const tags = row.querySelector<HTMLElement>("[class*='tags']");
    if (!title) continue;

    const expandedContent = block.querySelector<HTMLElement>("[class*='expandedContent']");
    const sectionContent = section.querySelector<HTMLElement>("[class*='sectionContent']");
    const bottomSep = block.querySelector<HTMLElement>("hr:last-of-type");

    // Promote animated elements to their own compositor layers
    // Use only compositor-friendly properties to avoid layout thrashing.
    block.style.willChange = "clip-path, top, transform, opacity";
    row.style.willChange = "transform";
    title.style.willChange = "transform";

    headerRefs.push({
      id: sectionId,
      block,
      row,
      section,
      title,
      tags,
      expandedContent,
      sectionContent,
      bottomSep,
      placeholder: null, // set when goFixed creates it
      expandedBlockH: block.offsetHeight,
      expandedRowH: row.offsetHeight,
      expandedTitleSize: parseFloat(getComputedStyle(title).fontSize),
    });

    liveStates[sectionId] = {
      currentMode: "expanded",
      lastProgress: -1,
      lastTopPx: -1,
      lastOpacity: -1,
      contactY: 0,
    };

    // Click collapsed header -> scroll to its section
    block.addEventListener("click", () => {
      const state = block.dataset.state || "expanded";
      if (state !== "expanded") {
        lenisRef.current?.scrollTo(section, {
          offset: -LOGO_BAR_H,
          duration: 0.8,
        });
      }
    });
  }

  const firstRef = headerRefs[0];
  const RAW_COLLAPSE_DISTANCE = firstRef
    ? firstRef.expandedBlockH - HEADER_BLOCK_COLLAPSED_H
    : 40;
  // Multiplier > 1 stretches the collapse over more scroll distance,
  // making it feel slower/more gradual.
  const COLLAPSE_DISTANCE = RAW_COLLAPSE_DISTANCE * COLLAPSE_SPEED;

  /* Fade the logo bar's top separator once it's stuck at the top */
  const logoBar = document.getElementById("logo-bar");
  const logoTopSep = logoBar?.querySelector<HTMLElement>("hr:first-of-type");

  // Measure actual logo bar height from the DOM (getBoundingClientRect
  // gives sub-pixel accuracy, unlike offsetHeight which rounds)
  if (logoBar) {
    LOGO_BAR_H = logoBar.getBoundingClientRect().height;
  }

  /* Frame-by-frame reconciliation */
  ScrollTrigger.create({
    trigger: document.getElementById("main-content")!,
    start: "top bottom",
    end: "bottom top",
    onUpdate: () => {
      // Fade top separator when logo bar is stuck (top ≈ 0)
      if (logoBar && logoTopSep) {
        const barTop = logoBar.getBoundingClientRect().top;
        logoTopSep.style.opacity = barTop <= 1 ? "0" : "";
      }
      reconcile(headerRefs, liveStates, COLLAPSE_DISTANCE);
    },
  });
}

/* ================================================================
   PHASE 1: DERIVE
   Pure function. Reads DOM positions, returns desired state for
   every header. Zero DOM writes.
   ================================================================ */

function deriveStates(
  refs: HeaderRef[],
  live: Record<string, LiveState>,
  collapseDistance: number
): DerivedState[] {
  // Nudge all slots up so slot 0 overlaps the logo bar bottom separator,
  // closing any sub-pixel gap.
  const slotTop = (s: number) => LOGO_BAR_H - 1 + s * HEADER_BLOCK_COLLAPSED_H;

  // Step 1: Read every header's "natural top" -- where it would be
  // in document flow. For fixed/stacked headers we read their placeholder.
  const naturalTops: Record<string, number> = {};
  for (const ref of refs) {
    const state = ref.block.dataset.state || "expanded";
    if (state === "expanded") {
      naturalTops[ref.id] = ref.block.getBoundingClientRect().top;
    } else {
      naturalTops[ref.id] = ref.placeholder
        ? ref.placeholder.getBoundingClientRect().top
        : -9999;
    }
  }

  // Step 2: Walk headers in section order and determine which ones
  // want to be stacked. A header wants to stack when its naturalTop
  // is at or above the contact line (bottom of the current stack).
  //
  // We build an ordered list of "wants to stack" headers. The contact
  // line rises as we add headers, so we iterate until stable.
  const wantsStack: string[] = [];
  for (const ref of refs) {
    const contactLine = slotTop(Math.min(wantsStack.length, MAX_VISIBLE_SLOTS));
    if (naturalTops[ref.id] <= contactLine) {
      wantsStack.push(ref.id);
    }
  }

  // Step 3: From wantsStack, determine slots and exit/dismiss.
  // Only the last MAX_VISIBLE_SLOTS are visible. Everything before
  // those is dismissed. The last one that's not yet fully collapsed
  // is "collapsing" (actively animating).
  const results: DerivedState[] = [];

  for (const ref of refs) {
    const idx = wantsStack.indexOf(ref.id);

    if (idx === -1) {
      // This header does NOT want to be in the stack -- it's expanded.
      results.push({
        id: ref.id,
        mode: "expanded",
        progress: 0,
        topPx: 0,
        opacity: 1,
        slot: -1,
        zIndex: 0,
      });
      continue;
    }

    // How many visible headers are after this one in the stack?
    const totalInStack = wantsStack.length;
    const visibleStartIdx = Math.max(0, totalInStack - MAX_VISIBLE_SLOTS);

    if (idx < visibleStartIdx) {
      // --- This header is older than the visible window ---
      // It should be dismissed. But if there's a header actively
      // collapsing into the stack (the newest), the MOST RECENTLY
      // dismissed header (idx === visibleStartIdx - 1) should be
      // in "exiting" state, with its exit driven by the newest
      // header's collapse progress.

      if (idx === visibleStartIdx - 1) {
        // This is the header being pushed out right now.
        // Its exit progress is driven by the incoming header's
        // collapse progress.
        const incomingId = wantsStack[totalInStack - 1];
        const incomingProgress = computeProgress(
          incomingId, refs, live, naturalTops, collapseDistance
        );

        if (incomingProgress < 1) {
          // Still animating -- this header is mid-exit.
          const slideUp = incomingProgress * HEADER_BLOCK_COLLAPSED_H;
          results.push({
            id: ref.id,
            mode: "exiting",
            progress: 1, // still visually collapsed
            topPx: slotTop(0) - slideUp,
            opacity: 1,
            slot: -1,
            zIndex: 80,
          });
          continue;
        }
      }

      // Fully dismissed.
      results.push({
        id: ref.id,
        mode: "dismissed",
        progress: 1,
        topPx: 0,
        opacity: 0,
        slot: -1,
        zIndex: 0,
      });
      continue;
    }

    // --- This header is in the visible window ---
    const visibleSlot = idx - visibleStartIdx; // 0 or 1
    const progress = computeProgress(
      ref.id, refs, live, naturalTops, collapseDistance
    );

    // If progress is 0 and this is the last in the stack,
    // it should actually be expanded (it has scrolled back to
    // its contact point).
    if (progress <= 0 && idx === totalInStack - 1) {
      results.push({
        id: ref.id,
        mode: "expanded",
        progress: 0,
        topPx: 0,
        opacity: 1,
        slot: -1,
        zIndex: 0,
      });
      continue;
    }

    // Determine target top position.
    // If there's an exiting header (visibleStartIdx > 0 and the
    // exit is still in progress), this header's slot is shifted:
    // - slot 0 header is actually sliding FROM slot 1 TO slot 0
    //   driven by the incoming progress.
    // - slot 1 header is the incoming one, lerping from contactY
    //   to slotTop(1).
    let targetTop: number;
    const isIncoming = idx === totalInStack - 1 && progress < 1;

    if (isIncoming) {
      // Incoming: lerp from contactY to slot target
      targetTop = lerp(live[ref.id].contactY, slotTop(visibleSlot), progress);
    } else if (
      visibleSlot === 0 &&
      visibleStartIdx > 0 &&
      totalInStack > MAX_VISIBLE_SLOTS
    ) {
      // This header was in slot 1 and is sliding to slot 0 as the
      // oldest exits. Drive the slide by the incoming header's progress.
      const incomingId = wantsStack[totalInStack - 1];
      const incomingProgress = computeProgress(
        incomingId, refs, live, naturalTops, collapseDistance
      );
      targetTop = lerp(slotTop(1), slotTop(0), incomingProgress);
    } else {
      targetTop = slotTop(visibleSlot);
    }

    const mode = progress >= 1 ? "collapsed" : "collapsing";

    results.push({
      id: ref.id,
      mode,
      progress,
      topPx: targetTop,
      opacity: 1,
      slot: visibleSlot,
      zIndex: 80 - visibleSlot * 10,
    });
  }

  return results;
}

/** Compute collapse progress (0-1) for a single header. */
function computeProgress(
  id: string,
  refs: HeaderRef[],
  live: Record<string, LiveState>,
  naturalTops: Record<string, number>,
  collapseDistance: number
): number {
  const ls = live[id];
  if (!ls || ls.contactY === 0) return 0;
  const dist = ls.contactY - naturalTops[id];
  return clamp(dist / collapseDistance, 0, 1);
}

/* ================================================================
   PHASE 2: APPLY
   Diffs derived state against current DOM and applies minimal
   mutations. Manages placeholders and inline styles.
   ================================================================ */

function applyStates(
  refs: HeaderRef[],
  derived: DerivedState[],
  live: Record<string, LiveState>,
  collapseDistance: number
) {
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const d = derived[i];
    const ls = live[ref.id];
    const prevMode = ls.currentMode;

    // --- State transitions ---

    if (d.mode === "expanded" && prevMode !== "expanded") {
      // Returning to document flow.
      returnToFlow(ref);
      ls.currentMode = "expanded";
      ls.lastProgress = -1;
      ls.lastTopPx = -1;
      ls.lastOpacity = -1;
      ls.contactY = 0;
      continue;
    }

    if (d.mode === "expanded") {
      // Already expanded, nothing to do.
      continue;
    }

    if (
      (d.mode === "collapsing" || d.mode === "collapsed") &&
      prevMode === "expanded"
    ) {
      // Entering the stack for the first time.
      goFixed(ref, d, ls);
      ls.currentMode = d.mode;
    }

    if (d.mode === "dismissed" && prevMode !== "dismissed") {
      // Fully dismissed.
      ref.block.dataset.state = "dismissed";
      ref.block.style.visibility = "hidden";
      ref.block.style.transform = "";
      ref.block.style.opacity = "";
      ls.currentMode = "dismissed";
      ls.lastProgress = -1;
      ls.lastTopPx = -1;
      ls.lastOpacity = -1;
      continue;
    }

    if (d.mode === "dismissed") {
      // Already dismissed, skip.
      continue;
    }

    if (d.mode === "exiting") {
      if (prevMode === "dismissed") {
        // Un-dismiss: restore visibility for exit animation.
        ref.block.style.visibility = "";
        ref.block.dataset.state = "exiting";
      }
      ls.currentMode = "exiting";
    } else {
      // collapsing or collapsed
      if (prevMode === "dismissed" || prevMode === "exiting") {
        // Restore into the stack (scrolled back up).
        ref.block.style.visibility = "";
        ref.block.style.transform = "";
        ref.block.style.opacity = "";
        ref.block.dataset.state = "stacked";
      }
      ls.currentMode = d.mode;
      ref.block.dataset.state = "stacked";
    }

    // --- Continuous updates (every frame) ---

    // Progress-driven visual interpolation
    if (
      d.mode === "collapsing" ||
      d.mode === "collapsed" ||
      d.mode === "exiting"
    ) {
      const progressChanged = Math.abs(d.progress - ls.lastProgress) > 0.0005;
      const topChanged = Math.abs(d.topPx - ls.lastTopPx) > 0.1;
      const opacityChanged = Math.abs(d.opacity - ls.lastOpacity) > 0.005;

      if (progressChanged) {
        interpolateHeader(ref, d.progress);
        ls.lastProgress = d.progress;
      }

      if (topChanged) {
        ref.block.style.top = `${d.topPx}px`;
        ls.lastTopPx = d.topPx;
      }

      if (d.mode === "exiting") {
        // Exit animation: slide up via transform + fade
        const slideUp = (1 - d.opacity) * HEADER_BLOCK_COLLAPSED_H;
        ref.block.style.transform = `translateY(${-slideUp}px)`;
        if (opacityChanged) {
          ref.block.style.opacity = `${d.opacity}`;
          ls.lastOpacity = d.opacity;
        }
      } else {
        // Not exiting: clear any residual transform/opacity
        if (ref.block.style.transform) ref.block.style.transform = "";
        if (ref.block.style.opacity !== "" && ref.block.style.opacity !== "1") {
          ref.block.style.opacity = "";
        }
      }

      ref.block.style.zIndex = `${d.zIndex}`;
    }
  }

  // --- Separator dedup pass ---
  // When two fixed headers are touching (one's bottom meets another's
  // top), hide the upper header's bottom separator so there's a single
  // line between them instead of a double.
  for (let i = 0; i < refs.length; i++) {
    const d = derived[i];
    const bottomSep = refs[i].block.querySelector(
      "hr:last-of-type"
    ) as HTMLElement | null;
    const topSep = refs[i].block.querySelector(
      "hr:first-of-type"
    ) as HTMLElement | null;

    // Only applies to headers that are fixed (in a slot or exiting)
    if (d.mode === "expanded" || d.mode === "dismissed") {
      if (bottomSep) bottomSep.style.opacity = "";
      // Restore top separator when returning to expanded
      if (topSep && topSep !== bottomSep) topSep.style.opacity = "";
      continue;
    }

    // Fade out the top separator when this header's top edge is touching
    // the logo bar's bottom (within 2px). This prevents a double line
    // between the logo bar and slot 0.
    if (topSep && topSep !== bottomSep) {
      const touchingLogoBar = Math.abs(d.topPx - (LOGO_BAR_H - 1)) < 2;
      topSep.style.opacity = touchingLogoBar ? "0" : "";
    }

    if (!bottomSep) continue;

    // With clip-path cropping, the bottom separator is positioned inside
    // the clipped area. The incoming header's top separator sits at its
    // own top edge. They no longer physically overlap, so hiding the
    // bottom sep would leave a gap. Instead, hide the TOP separator of
    // the header below (handled above via touchingLogoBar for slot 0,
    // and by the top-sep pass for stacked headers meeting each other).

    // Compute this header's visual bottom edge
    const blockH = lerp(refs[i].expandedBlockH, HEADER_BLOCK_COLLAPSED_H, d.progress);
    const bottomEdge = d.topPx + blockH;

    // Check if any other non-expanded header's top is within 2px
    // If so, hide THAT header's top separator (not this header's bottom).
    for (let j = 0; j < derived.length; j++) {
      if (j === i) continue;
      const other = derived[j];
      if (other.mode === "expanded" || other.mode === "dismissed") continue;
      if (Math.abs(other.topPx - bottomEdge) < 2) {
        const otherTopSep = refs[j].block.querySelector(
          "hr:first-of-type"
        ) as HTMLElement | null;
        if (otherTopSep) otherTopSep.style.opacity = "0";
      }
    }
  }
}

/* ================================================================
   reconcile -- called every scroll frame
   ================================================================ */

function reconcile(
  refs: HeaderRef[],
  live: Record<string, LiveState>,
  collapseDistance: number
) {
  // Before deriving, ensure contactY is set for any header that
  // is about to cross the contact line for the first time.
  updateContactPoints(refs, live);

  const derived = deriveStates(refs, live, collapseDistance);
  applyStates(refs, derived, live, collapseDistance);
}

/**
 * Scan expanded headers and set their contactY if they're at or
 * near the contact line. This must happen BEFORE deriveStates so
 * that computeProgress has a valid contactY to work with.
 */
function updateContactPoints(
  refs: HeaderRef[],
  live: Record<string, LiveState>
) {
  // Count how many headers are currently non-expanded (in the stack
  // or dismissed). We need this to know where the contact line is.
  let stackCount = 0;
  for (const ref of refs) {
    const mode = live[ref.id].currentMode;
    if (mode !== "expanded") stackCount++;
  }

  // Now check each expanded header to see if it's at or past the
  // contact line. We walk in order so we account for multiple
  // headers entering in the same frame.
  for (const ref of refs) {
    const ls = live[ref.id];
    if (ls.currentMode !== "expanded") continue;

    const contactLine =
      LOGO_BAR_H + Math.min(stackCount, MAX_VISIBLE_SLOTS) * HEADER_BLOCK_COLLAPSED_H;
    const naturalTop = ref.block.getBoundingClientRect().top;

    if (naturalTop <= contactLine && ls.contactY === 0) {
      // First contact -- capture the exact contact line position.
      ls.contactY = contactLine;
      stackCount++;
    }
  }
}

/* ================================================================
   DOM mutation helpers
   ================================================================ */

/** Transition a header from expanded (in-flow) to fixed. */
function goFixed(ref: HeaderRef, d: DerivedState, ls: LiveState) {
  const { block } = ref;

  // Create placeholder if needed
  let ph = ref.placeholder;
  if (!ph) {
    ph = document.createElement("div");
    ph.dataset.placeholderFor = block.id;
    ph.style.height = `${ref.expandedBlockH}px`;
    ph.style.visibility = "hidden";
    ph.style.pointerEvents = "none";
    block.parentElement?.insertBefore(ph, block);
    ref.placeholder = ph;
  }

  block.dataset.state = "stacked";
  Object.assign(block.style, {
    position: "fixed",
    top: `${d.topPx}px`,
    left: "0",
    width: "100%",
    height: `${ref.expandedBlockH}px`,  // lock at expanded size; clip-path crops visually
    overflow: "hidden",
    zIndex: `${d.zIndex}`,
    cursor: "pointer",
  });

  // Set static (one-time) props for collapse animation elements
  if (ref.expandedContent) {
    ref.expandedContent.style.position = "absolute";
    ref.expandedContent.style.left = "0";
    ref.expandedContent.style.right = "0";
    ref.expandedContent.style.top = `${0.5 + ref.expandedRowH}px`; // anchor below row (constant)
    ref.expandedContent.style.pointerEvents = "none";
  }
  if (ref.bottomSep) {
    ref.bottomSep.style.position = "absolute";
    ref.bottomSep.style.left = "0";
    ref.bottomSep.style.width = "100%";
    ref.bottomSep.style.zIndex = "999";  // always above header row content
    ref.bottomSep.style.bottom = "";  // clear any stale bottom
    ref.bottomSep.style.top = `${ref.expandedBlockH - 1}px`; // initial position, updated per-frame
  }

  ls.lastTopPx = d.topPx;
}

/** Return a fixed header to normal document flow. */
function returnToFlow(ref: HeaderRef) {
  const { block, row, title, tags } = ref;

  block.dataset.state = "expanded";
  gsap.set(block, { clearProps: "y,opacity" });

  // Remove placeholder
  if (ref.placeholder) {
    ref.placeholder.remove();
    ref.placeholder = null;
  }

  block.style.position = "";
  block.style.top = "";
  block.style.left = "";
  block.style.width = "";
  block.style.height = "";
  block.style.clipPath = "";
  block.style.overflow = "";
  block.style.zIndex = "";
  block.style.cursor = "";
  block.style.visibility = "";
  block.style.transform = "";
  block.style.opacity = "";

  row.style.height = "";
  row.style.transform = "";
  title.style.fontSize = "";
  title.style.transform = "";
  if (tags) {
    tags.style.flexDirection = "";
    tags.style.opacity = "";
    tags.style.paddingTop = "";
    tags.style.padding = "";
    tags.style.alignSelf = "";
  }

  // Clear expanded content styles
  if (ref.expandedContent) {
    ref.expandedContent.style.position = "";
    ref.expandedContent.style.top = "";
    ref.expandedContent.style.left = "";
    ref.expandedContent.style.right = "";
    ref.expandedContent.style.pointerEvents = "";
  }

  // Clear any separator overrides
  if (ref.bottomSep) {
    ref.bottomSep.style.opacity = "";
    ref.bottomSep.style.position = "";
    ref.bottomSep.style.top = "";
    ref.bottomSep.style.left = "";
    ref.bottomSep.style.width = "";
    ref.bottomSep.style.zIndex = "";
  }
  const topSep = block.querySelector("hr:first-of-type") as HTMLElement | null;
  if (topSep && topSep !== ref.bottomSep) topSep.style.opacity = "";
}

/** Lerp all visual properties based on collapse progress (0 = expanded, 1 = collapsed).
 *
 *  Single smooth pass — all properties interpolate together.
 *  Uses only compositor-friendly properties to avoid layout thrashing:
 *  - Block: clip-path (instead of height) crops the visible area.
 *  - Row: transform translateY (instead of height) shifts content up.
 *  - Title: transform scale (instead of font-size) shrinks text.
 */
function interpolateHeader(ref: HeaderRef, t: number) {
  // Linear — no easing. With COLLAPSE_SPEED=1, every px of scroll =
  // every px of header shrink, so content stays perfectly pinned to
  // the header's bottom edge.

  // Block: clip from the bottom instead of changing height (avoids layout reflow).
  const blockH = lerp(ref.expandedBlockH, HEADER_BLOCK_COLLAPSED_H, t);
  const clipBottom = ref.expandedBlockH - blockH;
  ref.block.style.clipPath = clipBottom > 0.1
    ? `inset(0 0 ${clipBottom}px 0)`
    : "none";

  // Row: shift content up via transform instead of shrinking height.
  // This keeps the title visually centred within the clipped area.
  const rowH = lerp(ref.expandedRowH, HEADER_ROW_COLLAPSED_H, t);
  const rowShift = (ref.expandedRowH - rowH) / 2;
  ref.row.style.transform = rowShift > 0.1
    ? `translateY(${-rowShift}px)`
    : "";

  // Title: scale instead of font-size (avoids text-layout reflow every frame).
  const titleScale = lerp(1, COLLAPSED_TITLE_SIZE / ref.expandedTitleSize, t);
  ref.title.style.transform = titleScale < 0.999
    ? `scale(${titleScale})`
    : "";

  // Bottom separator: track the visual bottom edge (clip-path boundary).
  // Position the separator so it's fully inside the visible region.
  if (ref.bottomSep) {
    ref.bottomSep.style.top = `${blockH - 1}px`;
  }

  // Expanded content: positioned once in goFixed, clip-path hides it.

  // Tags crossfade: column -> fade out -> switch to row -> fade in
  if (ref.tags) {
    if (t < 0.5) {
      ref.tags.style.flexDirection = "column";
      ref.tags.style.opacity = "1";
      ref.tags.style.alignSelf = "";
      ref.tags.style.padding = "";
    } else if (t < 0.65) {
      ref.tags.style.flexDirection = "column";
      ref.tags.style.opacity = `${1 - (t - 0.5) / 0.15}`;
      ref.tags.style.alignSelf = "";
      ref.tags.style.padding = "";
    } else if (t < 0.8) {
      ref.tags.style.flexDirection = "row";
      ref.tags.style.opacity = `${(t - 0.65) / 0.15}`;
      ref.tags.style.alignSelf = "center";
      ref.tags.style.padding = "3px 0";
    } else {
      ref.tags.style.flexDirection = "row";
      ref.tags.style.opacity = "1";
      ref.tags.style.alignSelf = "center";
      ref.tags.style.padding = "3px 0";
    }
  }
}

/* ================================================================
   Helpers
   ================================================================ */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
