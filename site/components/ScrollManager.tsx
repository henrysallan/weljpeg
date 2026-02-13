"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/* -- Layout constants -- */
const LOGO_BAR_H = 41;
const HEADER_BLOCK_COLLAPSED_H = 36.5; // 1px sep + 34.5px row + 1px sep
const HEADER_ROW_COLLAPSED_H = 34.5;

/**
 * ScrollManager - invisible component that wires up:
 * 1. Lenis smooth scroll
 * 2. Landing -> Content snap transition
 * 3. Section header sticky-stack system
 *
 * The logo bar is purely CSS sticky -- no GSAP needed.
 * All animations are scroll-linked (scrubbed) and fully reversible.
 */
export const ScrollManager: React.FC = () => {
  const lenisRef = useRef<Lenis | null>(null);

  /* ------------------------------------------------
     1. Lenis smooth scroll setup
     ------------------------------------------------ */
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lenis = new Lenis({
      lerp: prefersReduced ? 1 : 0.1,
      duration: 1.2,
      smoothWheel: !prefersReduced,
      syncTouch: false,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  /* ------------------------------------------------
     2-4. GSAP ScrollTrigger animations
     ------------------------------------------------ */
  useGSAP(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Wait one frame for DOM measurements to settle
    requestAnimationFrame(() => {
      setupAnimations(prefersReduced, lenisRef);
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return null;
};

/* ============================================================
   Animation setup - called after DOM is ready
   ============================================================ */

function setupAnimations(
  prefersReduced: boolean,
  lenisRef: React.RefObject<Lenis | null>
) {
  /* -- 2. Landing -> Content snap -- */
  const landing = document.getElementById("landing-page");
  if (landing) {
    ScrollTrigger.create({
      trigger: landing,
      start: "top top",
      end: "bottom top",
      snap: prefersReduced
        ? undefined
        : {
            snapTo: [0, 1],
            duration: { min: 0.4, max: 0.8 },
            ease: "power2.inOut",
          },
    });
  }

  /* -- 3. Header-block sticky-stack -- */
  const sectionIds = ["redbull", "uniqlo", "puma", "services"];

  // Ordered stack of stacked header IDs (oldest first). Max 2 visible.
  const collapsedStack: string[] = [];

  // Transition state when a 3rd header enters:
  // - exitingId: header being pushed out of slot 0 (slides up + fades)
  // - slidingId: header shifting from slot 1 to slot 0 (top lerps)
  // Both are driven by the incoming header's collapse progress.
  const exitState: { exitingId: string | null; slidingId: string | null } = {
    exitingId: null,
    slidingId: null,
  };

  // Cache element references + expanded measurements
  interface HeaderInfo {
    block: HTMLElement;
    row: HTMLElement;
    section: HTMLElement;
    title: HTMLElement;
    tags: HTMLElement;
    expandedBlockH: number;
    expandedRowH: number;
    expandedTitleSize: number;
    lastProgress: number; // -1 = not stacked
    contactY: number; // viewport Y where this header first contacted the stack
  }
  const headers: Record<string, HeaderInfo> = {};

  sectionIds.forEach((sectionId) => {
    const block = document.getElementById(`header-block-${sectionId}`);
    const row = document.getElementById(`header-${sectionId}`);
    const section = document.getElementById(`section-${sectionId}`);
    if (!block || !row || !section) return;

    const title = row.querySelector<HTMLElement>("[class*='title']");
    const tags = row.querySelector<HTMLElement>("[class*='tags']");
    if (!title || !tags) return;

    headers[sectionId] = {
      block,
      row,
      section,
      title,
      tags,
      expandedBlockH: block.offsetHeight,
      expandedRowH: row.offsetHeight,
      expandedTitleSize: parseFloat(getComputedStyle(title).fontSize),
      lastProgress: -1,
      contactY: 0,
    };

    // Click collapsed header -> scroll to section
    block.addEventListener("click", () => {
      const state = block.dataset.state || "expanded";
      if (state === "stacked") {
        const slot = collapsedStack.indexOf(sectionId);
        const stickyTop =
          slot === 0 ? LOGO_BAR_H : LOGO_BAR_H + HEADER_BLOCK_COLLAPSED_H;
        lenisRef.current?.scrollTo(section, {
          offset: -stickyTop,
          duration: 0.8,
        });
      }
    });
  });

  // The scroll distance over which the collapse animation plays.
  // Matches the height difference so it feels 1:1 with scroll.
  const firstInfo = headers[sectionIds[0]];
  const COLLAPSE_DISTANCE = firstInfo
    ? firstInfo.expandedBlockH - HEADER_BLOCK_COLLAPSED_H
    : 40;

  /* Frame-by-frame reconciliation */
  ScrollTrigger.create({
    trigger: document.getElementById("main-content")!,
    start: "top bottom",
    end: "bottom top",
    onUpdate: () => {
      reconcileHeaderStack(sectionIds, headers, collapsedStack, exitState, COLLAPSE_DISTANCE);
    },
  });
}

/* ============================================================
   reconcileHeaderStack -- called every scroll frame
   ============================================================ */

function reconcileHeaderStack(
  sectionIds: string[],
  headers: Record<string, {
    block: HTMLElement;
    row: HTMLElement;
    section: HTMLElement;
    title: HTMLElement;
    tags: HTMLElement;
    expandedBlockH: number;
    expandedRowH: number;
    expandedTitleSize: number;
    lastProgress: number;
    contactY: number;
  }>,
  collapsedStack: string[],
  exitState: { exitingId: string | null; slidingId: string | null },
  collapseDistance: number
) {
  const slot0Top = LOGO_BAR_H;
  const slot1Top = LOGO_BAR_H + HEADER_BLOCK_COLLAPSED_H;

  /* ---- READ PHASE ---- */
  const measurements: Record<string, {
    naturalTop: number;
    state: string;
  }> = {};

  for (const id of sectionIds) {
    const info = headers[id];
    if (!info) continue;
    const state = info.block.dataset.state || "expanded";

    if (state === "expanded") {
      measurements[id] = {
        naturalTop: info.block.getBoundingClientRect().top,
        state,
      };
    } else {
      // stacked, exiting, or dismissed: read placeholder position
      const ph = info.block.parentElement?.querySelector(
        `[data-placeholder-for="${info.block.id}"]`
      ) as HTMLElement | null;
      measurements[id] = {
        naturalTop: ph ? ph.getBoundingClientRect().top : -9999,
        state,
      };
    }
  }

  /* ---- LOGIC + WRITE ---- */

  // Pass 1: Cancel exit/slide transitions when scrolling back up
  // and the stack has room. (Actual un-stacking happens in Pass 3
  // when progress reaches 0, so the reverse animation is smooth.)
  if (collapsedStack.length > 0 && exitState.exitingId) {
    const lastId = collapsedStack[collapsedStack.length - 1];
    const m = measurements[lastId];
    if (m) {
      const headersAbove = collapsedStack.length - 1;
      const contactLine = LOGO_BAR_H + headersAbove * HEADER_BLOCK_COLLAPSED_H;
      // If the last stacked header is pulling away from the stack, the user
      // is scrolling up, so cancel the exit/slide transitions.
      if (m.naturalTop > contactLine) {
        const exitInfo = headers[exitState.exitingId];
        if (exitInfo && collapsedStack.length < 2) {
          // Restore exiting header to slot 0
          exitInfo.block.dataset.state = "stacked";
          exitInfo.block.style.top = `${slot0Top}px`;
          exitInfo.block.style.transform = "";
          exitInfo.block.style.opacity = "";
          exitInfo.block.style.visibility = "";
          exitInfo.block.style.zIndex = "80";
          exitInfo.lastProgress = 1;
          collapsedStack.unshift(exitState.exitingId);
          exitState.exitingId = null;

          // Also snap the sliding header back to slot 1
          if (exitState.slidingId) {
            const slideInfo = headers[exitState.slidingId];
            if (slideInfo) {
              slideInfo.block.style.top = `${slot1Top}px`;
              slideInfo.block.style.zIndex = "70";
            }
            exitState.slidingId = null;
          }
        }
      }
    }
  }

  // Pass 2: Check if any expanded header should enter the stack (scroll down)
  for (const sectionId of sectionIds) {
    const info = headers[sectionId];
    const m = measurements[sectionId];
    if (!info || !m || m.state !== "expanded") continue;

    const contactLine =
      LOGO_BAR_H +
      Math.min(collapsedStack.length, 2) * HEADER_BLOCK_COLLAPSED_H;

    if (m.naturalTop <= contactLine) {
      // Contact! This header has reached the stack.
      if (collapsedStack.length >= 2) {
        // Start pushing the oldest out (scroll-linked, not instant)
        const oldestId = collapsedStack.shift()!;
        const oldest = headers[oldestId];
        if (oldest) {
          oldest.block.dataset.state = "exiting";
          oldest.lastProgress = -1; // force interpolation
          exitState.exitingId = oldestId;
        }

        // The remaining header slides from slot 1 -> slot 0
        // (scroll-linked, not instant)
        if (collapsedStack[0]) {
          exitState.slidingId = collapsedStack[0];
        }
      }

      // Enter the stack
      const slot = collapsedStack.length;
      collapsedStack.push(sectionId);
      enterStack(
        info,
        slot === 0 ? slot0Top : slot1Top,
        sectionIds.indexOf(sectionId),
        contactLine
      );
      measurements[sectionId] = { ...m, state: "stacked" };
    }
  }

  // Pass 3: Interpolate all stacked headers based on scroll progress
  // Also track the incoming (last) header's progress for the exit animation.
  let incomingProgress = 0;

  for (let slot = 0; slot < collapsedStack.length; slot++) {
    const id = collapsedStack[slot];
    const info = headers[id];
    if (!info) continue;
    if (info.block.dataset.state !== "stacked") continue;

    const m = measurements[id];
    if (!m) continue;

    // Use the stored contactY (where it actually touched the stack)
    // to compute progress — not a recomputed slot-based contactLine.
    const distPastContact = info.contactY - m.naturalTop;
    const progress = Math.max(
      0,
      Math.min(1, distPastContact / collapseDistance)
    );

    // If the last stacked header has fully reversed back to progress 0,
    // un-stack it and return it to document flow.
    if (
      progress <= 0 &&
      slot === collapsedStack.length - 1 &&
      !exitState.exitingId
    ) {
      collapsedStack.pop();
      expandHeaderBlock(info);
      // Re-run the loop since indices shifted
      slot--;
      continue;
    }

    // Track incoming header's progress (the last one in the stack)
    if (slot === collapsedStack.length - 1) {
      incomingProgress = progress;
    }

    if (Math.abs(progress - info.lastProgress) < 0.001) continue;
    info.lastProgress = progress;

    interpolateHeader(info, progress);

    // Interpolate top from contact position to final slot position.
    // Skip headers that are mid-slide (handled in Pass 4b).
    if (exitState.slidingId !== id) {
      const targetTop = slot === 0 ? slot0Top : slot1Top;
      info.block.style.top = `${lerp(info.contactY, targetTop, progress)}px`;
    }
  }

  // Pass 3b: Restore dismissed headers when scrolling back up.
  // If the stack has room (< 2) and there are dismissed headers
  // whose sections are still in view, bring the most recent one back.
  if (collapsedStack.length < 2 && !exitState.exitingId) {
    // Find the earliest stacked header to know which dismissed
    // headers are before it
    const firstStackedIdx = collapsedStack.length > 0
      ? sectionIds.indexOf(collapsedStack[0])
      : sectionIds.length;

    for (let i = firstStackedIdx - 1; i >= 0; i--) {
      const prevId = sectionIds[i];
      const prev = headers[prevId];
      if (!prev) continue;
      if (prev.block.dataset.state !== "dismissed") continue;

      const pm = measurements[prevId];
      if (!pm) continue;

      // Only restore if its placeholder is still above the contact line
      // (i.e., the section hasn't scrolled back into view)
      const restoreContact = LOGO_BAR_H +
        collapsedStack.length * HEADER_BLOCK_COLLAPSED_H;
      if (pm.naturalTop <= restoreContact) {
        // Bring it back into the stack at the first available slot
        const slot = collapsedStack.length;
        prev.block.dataset.state = "stacked";
        prev.block.style.visibility = "";
        prev.block.style.transform = "";
        prev.block.style.opacity = "";
        prev.block.style.top = `${slot === 0 ? slot0Top : slot1Top}px`;
        prev.block.style.zIndex = `${80 - slot * 10}`;
        prev.lastProgress = 1; // already fully collapsed
        collapsedStack.unshift(prevId); // oldest first
        break;
      }
    }
  }

  // Pass 4: Interpolate exiting + sliding headers (scroll-linked)
  const transitionT = incomingProgress;

  // 4a: Exiting header slides up and fades out
  if (exitState.exitingId) {
    const exitInfo = headers[exitState.exitingId];
    if (exitInfo) {
      if (Math.abs(transitionT - exitInfo.lastProgress) > 0.001) {
        exitInfo.lastProgress = transitionT;
        const slideUp = transitionT * HEADER_BLOCK_COLLAPSED_H;
        exitInfo.block.style.transform = `translateY(${-slideUp}px)`;
        exitInfo.block.style.opacity = `${1 - transitionT}`;
      }

      // When fully pushed out, finalize
      if (transitionT >= 0.99) {
        exitInfo.block.dataset.state = "dismissed";
        exitInfo.block.style.visibility = "hidden";
        exitInfo.block.style.transform = "";
        exitInfo.block.style.opacity = "";
        exitInfo.lastProgress = -1;
        exitState.exitingId = null;
      }
    }
  }

  // 4b: Sliding header moves from slot 1 -> slot 0
  if (exitState.slidingId) {
    const slideInfo = headers[exitState.slidingId];
    if (slideInfo) {
      const currentTop = lerp(slot1Top, slot0Top, transitionT);
      slideInfo.block.style.top = `${currentTop}px`;

      // When transition completes, snap to final position
      if (transitionT >= 0.99) {
        slideInfo.block.style.top = `${slot0Top}px`;
        slideInfo.block.style.zIndex = "80";
        exitState.slidingId = null;
      }
    }
  }
}

/* ============================================================
   Header-block state transitions
   ============================================================ */

/** Called once when a header first contacts the stack. Sets up
 *  fixed positioning + placeholder but keeps expanded size.
 *  Starts at the header's current viewport position so there
 *  is no visual pop. interpolateHeader() then smoothly drives
 *  it to the collapsed slot position each frame. */
function enterStack(
  info: {
    block: HTMLElement;
    row: HTMLElement;
    expandedBlockH: number;
    lastProgress: number;
    contactY: number;
  },
  stickyTop: number,
  index: number,
  contactLine: number
) {
  const { block } = info;

  // Use the exact computed contact line (bottom of the stack)
  // rather than getBoundingClientRect which can be sub-pixel off.
  info.contactY = contactLine;

  // Create placeholder before going fixed
  let ph = block.parentElement?.querySelector(
    `[data-placeholder-for="${block.id}"]`
  ) as HTMLElement | null;
  if (!ph) {
    ph = document.createElement("div");
    ph.dataset.placeholderFor = block.id;
    ph.style.height = `${info.expandedBlockH}px`;
    ph.style.visibility = "hidden";
    ph.style.pointerEvents = "none";
    block.parentElement?.insertBefore(ph, block);
  }

  block.dataset.state = "stacked";
  info.lastProgress = -1; // force first interpolation

  Object.assign(block.style, {
    position: "fixed",
    // Start at the exact contact line so there's no sub-pixel gap.
    top: `${contactLine}px`,
    left: "0",
    width: "100%",
    overflow: "hidden",
    zIndex: `${80 - index * 10}`,
    cursor: "pointer",
  });
}

/** Lerp all visual properties based on scroll progress (0-1). */
function interpolateHeader(
  info: {
    block: HTMLElement;
    row: HTMLElement;
    title: HTMLElement;
    tags: HTMLElement;
    expandedBlockH: number;
    expandedRowH: number;
    expandedTitleSize: number;
  },
  t: number
) {
  // Height
  const blockH = lerp(info.expandedBlockH, HEADER_BLOCK_COLLAPSED_H, t);
  const rowH = lerp(info.expandedRowH, HEADER_ROW_COLLAPSED_H, t);
  info.block.style.height = `${blockH}px`;
  info.row.style.height = `${rowH}px`;

  // Title font-size
  const titleSize = lerp(info.expandedTitleSize, COLLAPSED_TITLE_SIZE, t);
  info.title.style.fontSize = `${titleSize}px`;

  // Tags crossfade: column -> fade out -> switch to row -> fade in
  // 0.0 - 0.5 : column layout, full opacity (clipped by shrinking header)
  // 0.5 - 0.65: fade out (still column)
  // 0.65       : switch to row
  // 0.65 - 0.8: fade in (now row)
  // 0.8 - 1.0 : row layout, full opacity
  if (t < 0.5) {
    info.tags.style.flexDirection = "column";
    info.tags.style.opacity = "1";
  } else if (t < 0.65) {
    info.tags.style.flexDirection = "column";
    info.tags.style.opacity = `${1 - (t - 0.5) / 0.15}`;
  } else if (t < 0.8) {
    info.tags.style.flexDirection = "row";
    info.tags.style.opacity = `${(t - 0.65) / 0.15}`;
  } else {
    info.tags.style.flexDirection = "row";
    info.tags.style.opacity = "1";
  }
}

function expandHeaderBlock(info: {
  block: HTMLElement;
  row: HTMLElement;
  title: HTMLElement;
  tags: HTMLElement;
  lastProgress: number;
}) {
  const { block, row, title, tags } = info;
  block.dataset.state = "expanded";
  info.lastProgress = -1;
  gsap.set(block, { clearProps: "y,opacity" });

  // Remove placeholder
  const ph = block.parentElement?.querySelector(
    `[data-placeholder-for="${block.id}"]`
  );
  if (ph) ph.remove();

  block.style.position = "";
  block.style.top = "";
  block.style.left = "";
  block.style.width = "";
  block.style.height = "";
  block.style.overflow = "";
  block.style.zIndex = "";
  block.style.cursor = "";
  block.style.visibility = "";

  row.style.height = "";
  title.style.fontSize = "";
  tags.style.flexDirection = "";
  tags.style.opacity = "";
}

/** Instant dismiss -- used only as a fallback. Normal exits
 *  are scroll-linked via the exiting state in Pass 4. */
function dismissHeaderBlock(info: {
  block: HTMLElement;
  lastProgress: number;
}) {
  info.block.dataset.state = "dismissed";
  info.lastProgress = -1;
  info.block.style.visibility = "hidden";
  info.block.style.transform = "";
  info.block.style.opacity = "";
}

/* ---- Helpers ---- */

const COLLAPSED_TITLE_SIZE = 35.6;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
