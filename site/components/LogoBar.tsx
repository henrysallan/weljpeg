"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { WelcomeLogo } from "./WelcomeLogo";
import { Separator } from "./Separator";
import styles from "./LogoBar.module.css";

interface LogoBarProps {
  className?: string;
}

const NAV_ITEMS = ["Work", "Services", "Insight", "Contact"] as const;

const WORK_SUBITEMS = [
  { label: "Redbull", sectionId: "redbull" },
  { label: "Uniqlo", sectionId: "uniqlo" },
  { label: "Puma", sectionId: "puma" },
] as const;

/* ----------------------------------------------------------------
   Animation timing (ms)
   ---------------------------------------------------------------- */
const STEM_DRAW_MS   = 250;   // stem line draws down
const BORDER_DRAW_MS = 350;   // SVG rect draw-on
const FILL_FADE_MS   = 200;   // background fill fades in
const CHAR_FADE_MS   = 180;   // per-character fade
const CHAR_TRAVEL    = 5;     // px each char drifts up
const CHAR_STAGGER   = 18;    // ms between characters
const SEP_DRAW_MS    = 250;   // separator scale-x
const CLOSE_MS       = 200;   // exit duration

/* ----------------------------------------------------------------
   WorkDropdown — animated hover menu
   ---------------------------------------------------------------- */
const WorkDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"closed" | "stem" | "border" | "fill" | "chars" | "done" | "closing">("closed");
  const menuRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGRectElement>(null);
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    phaseTimersRef.current.forEach(clearTimeout);
    phaseTimersRef.current = [];
  }, []);

  // Open: set open + stem phase (measurement deferred to layout effect)
  const handleOpen = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (open && phase === "done") return; // already open
    clearTimers();
    setOpen(true);
    setPhase("stem");
  }, [open, phase, clearTimers]);

  // Close: fast reverse
  const handleClose = useCallback(() => {
    clearTimers();
    setPhase("closing");
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setPhase("closed");
      setBoxSize({ w: 0, h: 0 });
      closeTimerRef.current = null;
    }, CLOSE_MS);
  }, [clearTimers]);

  // Measure synchronously before paint, then kick off phase timers
  useLayoutEffect(() => {
    if (!open || phase !== "stem" || !menuRef.current) return;
    const { width, height } = menuRef.current.getBoundingClientRect();
    setBoxSize({ w: width, h: height });

    // Timers start AFTER measurement — border phase waits for the
    // SVG to render with the initial dashoffset before transitioning.
    const raf = requestAnimationFrame(() => {
      const t1 = setTimeout(() => setPhase("border"), STEM_DRAW_MS * 0.6);
      const t2 = setTimeout(() => setPhase("fill"), STEM_DRAW_MS * 0.6 + BORDER_DRAW_MS * 0.5);
      const t3 = setTimeout(() => setPhase("chars"), STEM_DRAW_MS * 0.6 + BORDER_DRAW_MS * 0.7);
      const t4 = setTimeout(() => setPhase("done"), STEM_DRAW_MS + BORDER_DRAW_MS + 200);
      phaseTimersRef.current = [t1, t2, t3, t4];
    });

    return () => cancelAnimationFrame(raf);
  }, [open, phase]);

  // Delayed close on mouse leave (allows moving to dropdown)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    handleOpen();
  }, [handleOpen]);

  const handleMouseLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      handleClose();
    }, 80);
  }, [handleClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, [clearTimers]);

  // Re-measure on resize
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (!menuRef.current) return;
      const { width, height } = menuRef.current.getBoundingClientRect();
      setBoxSize({ w: width, h: height });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  const perim = 2 * (boxSize.w + boxSize.h);
  const stemReady = phase !== "closed" && phase !== "closing";
  const borderReady = phase === "border" || phase === "fill" || phase === "chars" || phase === "done";
  const fillReady = phase === "fill" || phase === "chars" || phase === "done";
  const charsReady = phase === "chars" || phase === "done";
  const isClosing = phase === "closing";

  // Build per-character spans for each label
  const renderChars = (label: string, itemIndex: number) => {
    const baseDelay = itemIndex * label.length * CHAR_STAGGER;
    return label.split("").map((ch, ci) => {
      const delay = baseDelay + ci * CHAR_STAGGER;
      const show = charsReady && !isClosing;
      return (
        <span
          key={ci}
          style={{
            display: "inline-block",
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
            transition: show
              ? `opacity ${CHAR_FADE_MS}ms ${delay}ms ease-out, transform ${CHAR_FADE_MS}ms ${delay}ms ease-out`
              : `opacity ${CLOSE_MS * 0.5}ms ease-in, transform ${CLOSE_MS * 0.5}ms ease-in`,
          }}
        >
          {ch}
        </span>
      );
    });
  };

  return (
    <div
      className={styles.navDropdownWrap}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href="#section-redbull"
        className={styles.navBtn}
        data-nav="work"
      >
        Work
      </a>

      {open && (
        <div className={`${styles.dropdown} ${styles.dropdownVisible}`}>
          {/* Stem — draws down */}
          <div
            className={styles.dropdownStem}
            style={{
              transform: stemReady ? "scaleY(1)" : "scaleY(0)",
              transition: isClosing
                ? `transform ${CLOSE_MS * 0.4}ms ease-in`
                : `transform ${STEM_DRAW_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          />

          {/* Menu box — SVG border + fill + content */}
          <div
            ref={menuRef}
            className={styles.dropdownMenu}
            style={{
              background: fillReady && !isClosing ? "var(--color-bg)" : "transparent",
              transition: isClosing
                ? `background ${CLOSE_MS * 0.3}ms ease-in`
                : `background ${FILL_FADE_MS}ms ease-out`,
              borderColor: "transparent",
            }}
          >
            {/* SVG border draw-on */}
            {boxSize.w > 0 && (
              <svg
                className={styles.dropdownBorderSvg}
                width={boxSize.w}
                height={boxSize.h}
                viewBox={`0 0 ${boxSize.w} ${boxSize.h}`}
                fill="none"
              >
                <rect
                  ref={svgRef}
                  x="0.25"
                  y="0.25"
                  width={boxSize.w - 0.5}
                  height={boxSize.h - 0.5}
                  stroke="var(--color-text)"
                  strokeWidth="0.5"
                  fill="none"
                  strokeDasharray={perim}
                  strokeDashoffset={borderReady && !isClosing ? 0 : perim}
                  style={{
                    transition: isClosing
                      ? `stroke-dashoffset ${CLOSE_MS * 0.5}ms ease-in`
                      : `stroke-dashoffset ${BORDER_DRAW_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  }}
                />
              </svg>
            )}

            {WORK_SUBITEMS.map((item, i) => (
              <React.Fragment key={item.sectionId}>
                {i > 0 && (
                  <div
                    className={styles.dropdownSep}
                    style={{
                      transform: charsReady && !isClosing ? "scaleX(1)" : "scaleX(0)",
                      transition: isClosing
                        ? `transform ${CLOSE_MS * 0.3}ms ease-in`
                        : `transform ${SEP_DRAW_MS}ms ${i * 40}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    }}
                  />
                )}
                <a
                  href={`#section-${item.sectionId}`}
                  className={styles.dropdownItem}
                >
                  {renderChars(item.label, i)}
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Logo bar -- always collapsed size (41px). Starts in normal
 * document flow. When it reaches the viewport top on scroll,
 * position: sticky keeps it there permanently.
 */
export const LogoBar: React.FC<LogoBarProps> = ({ className }) => {
  const scale = 24;               // change this one number to resize
  const ratio = 36 / 41;          // aspect ratio (h:w = 36:41)

  return (
    <div
      id="logo-bar"
      className={`${styles.logoBar} ${className ?? ""}`}
    >
      <Separator className={styles.topSep} />
      <div className={styles.logoWrap}>
        <button id="logo-home-btn" className={styles.logoBtn} aria-label="Back to top">
          <WelcomeLogo width={scale} height={scale * ratio} />
        </button>
        <nav id="logo-nav" className={styles.nav}>
          {NAV_ITEMS.map((label) => {
            if (label === "Work") {
              return <WorkDropdown key={label} />;
            }
            if (label === "Services") {
              return (
                <a
                  key={label}
                  href="#section-services"
                  className={styles.navBtn}
                  data-nav="services"
                >
                  {label}
                </a>
              );
            }
            if (label === "Insight") {
              return (
                <a
                  key={label}
                  href="#section-insight"
                  className={styles.navBtn}
                  data-nav="insight"
                >
                  {label}
                </a>
              );
            }
            if (label === "Contact") {
              return (
                <a
                  key={label}
                  href="#section-contact"
                  className={styles.navBtn}
                  data-nav="contact"
                >
                  {label}
                </a>
              );
            }
            return null;
          })}
        </nav>
      </div>
      <Separator />
    </div>
  );
};
