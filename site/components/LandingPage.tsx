"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { WelcomeLogo } from "./WelcomeLogo";
import { ImageCycler } from "./ImageCycler";
import { ImageSquiggle } from "./ImageSquiggle";
import styles from "./LandingPage.module.css";

const LANDING_IMAGES = [
  "/images/redbull_1.png",
  "/images/redbull_2.png",
  "/images/uniqlo_2.png",
  "/images/uniqlo_3.png",
];

/* ----------------------------------------------------------------
   Timing constants (ms)
   ---------------------------------------------------------------- */
const BORDER_DRAW_MS  = 900;   // SVG trim-path draw-on
const FILL_FADE_MS    = 400;   // background fill fade
const CHAR_FADE_MS    = 250;   // per-character fade duration
const CHAR_TRAVEL     = 6;     // px each char drifts up
const CHAR_STAGGER_MS = 18;    // base stagger between chars
const ELEM_GAP_MS     = 80;    // gap between element groups (logo → title → desc → …)
const IMAGE_DELAY_MS  = 200;   // extra pause before ImageCycler appears

// Total time ImageSquiggle should wait before starting
const SQUIGGLE_DELAY  = BORDER_DRAW_MS + FILL_FADE_MS + 1400; // rough total

/* ----------------------------------------------------------------
   CharReveal — splits children text into per-character spans
   while preserving inner elements (<span>, <br>, <a>, etc.)
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
    return node.split("").map((ch, i) => {
      const idx = charCounter++;
      // Use the shuffled slot for this character's delay
      const slot = shuffledDelays[idx] ?? idx;
      const delay = slot * CHAR_STAGGER_MS;
      return (
        <span
          key={idx}
          className={wrapperClass}
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
    // Preserve <br> as-is
    if (el.type === "br") return node;

    // Recurse into children but keep the wrapper element (e.g. <span className={underline}>)
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
  // Set the global counter so this group's chars start from the right offset
  const savedCounter = charCounter;
  charCounter = Math.round(baseDelay / CHAR_STAGGER_MS);
  const result = flattenToCharSpans(children, revealed);
  // Don't reset — let it accumulate so next group staggers after this one
  return <>{result}</>;
};

/* ----------------------------------------------------------------
   LandingPage component
   ---------------------------------------------------------------- */
export const LandingPage: React.FC = () => {
  const clusterRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGRectElement>(null);

  const [phase, setPhase] = useState<
    "hidden" | "border" | "fill" | "chars" | "done"
  >("hidden");

  // Measure cluster for SVG border rect
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    if (!clusterRef.current) return;
    const { width, height } = clusterRef.current.getBoundingClientRect();
    setBoxSize({ w: width, h: height });
  }, []);

  // Run intro sequence
  useEffect(() => {
    measure();
    // Small delay so the browser has painted
    const t0 = setTimeout(() => setPhase("border"), 100);
    return () => clearTimeout(t0);
  }, [measure]);

  // Phase transitions
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "border") {
      // After border finishes drawing → fill
      timer = setTimeout(() => setPhase("fill"), BORDER_DRAW_MS);
    } else if (phase === "fill") {
      // After fill fades → chars
      timer = setTimeout(() => setPhase("chars"), FILL_FADE_MS);
    } else if (phase === "chars") {
      // After chars are all in → done
      timer = setTimeout(() => setPhase("done"), 1200);
    }
    return () => clearTimeout(timer);
  }, [phase]);

  // Re-measure on resize
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const borderReady = phase !== "hidden";
  const fillReady = phase === "fill" || phase === "chars" || phase === "done";
  const charsReady = phase === "chars" || phase === "done";

  // Perimeter for stroke-dasharray
  const perim = 2 * (boxSize.w + boxSize.h);

  // Char reveal delay offsets for each text group
  let runningDelay = 0;
  const logoDelay = runningDelay;
  runningDelay += ELEM_GAP_MS;
  const titleDelay = runningDelay;
  runningDelay += 14 * CHAR_STAGGER_MS + ELEM_GAP_MS; // ~"Welcome LABS" length
  const descDelay = runningDelay;
  runningDelay += 80 * CHAR_STAGGER_MS + ELEM_GAP_MS; // description chars
  const linksDelay = runningDelay;

  // Reset char counter and build shuffled delays before each render.
  // Use ~200 slots (generous upper bound for all text characters).
  charCounter = 0;
  if (shuffledDelays.length === 0) {
    buildShuffledDelays(200);
  }

  return (
    <section id="landing-page" className={styles.landing}>
      <ImageSquiggle delayStart={SQUIGGLE_DELAY} />
      <div
        ref={clusterRef}
        className={`${styles.cluster} ${styles.introCluster}`}
        style={{
          border: "none",
          background: fillReady ? "#ffffff" : "transparent",
          transition: fillReady
            ? `background ${FILL_FADE_MS}ms ease-out`
            : "none",
        }}
      >
        {/* SVG border — trim-path draw-on */}
        {boxSize.w > 0 && (
          <svg
            className={styles.borderSvg}
            width={boxSize.w}
            height={boxSize.h}
            viewBox={`0 0 ${boxSize.w} ${boxSize.h}`}
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

        {/* Logo */}
        <div
          style={{
            opacity: charsReady ? 1 : 0,
            transform: charsReady ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
            transition: `opacity ${CHAR_FADE_MS}ms ${logoDelay}ms ease-out, transform ${CHAR_FADE_MS}ms ${logoDelay}ms ease-out`,
          }}
        >
          <WelcomeLogo className={styles.logo} width={24} height={21} />
        </div>

        {/* Title — per-character reveal */}
        <h1 className={styles.title}>
          <CharReveal revealed={charsReady} baseDelay={titleDelay}>
            Welcome LABS
          </CharReveal>
        </h1>

        {/* Description — per-character reveal preserving underline spans */}
        <p className={styles.description}>
          <CharReveal revealed={charsReady} baseDelay={descDelay}>
            {"Introducing new ideas to the culture"}
          </CharReveal>
          <br />
          <br />
          <CharReveal revealed={charsReady} baseDelay={descDelay + 36 * CHAR_STAGGER_MS}>
            {"through "}
            <span className={styles.underline}>design</span>
            {", "}
            <span className={styles.underline}>talent</span>
            {", "}
            <span className={styles.underline}>tools</span>
            {", and "}
            <span className={styles.underline}>distribution</span>
            {"."}
          </CharReveal>
        </p>

        {/* Image cycler — fades in after text */}
        <div
          className={styles.imageCyclerWrap}
          style={{
            opacity: charsReady ? 1 : 0,
            transition: `opacity ${CHAR_FADE_MS}ms ${linksDelay + IMAGE_DELAY_MS}ms ease-out`,
          }}
        >
          <ImageCycler images={LANDING_IMAGES} interval={3500} />
        </div>

        {/* Client links — per-character reveal */}
        <nav className={styles.clientLinks} aria-label="Featured clients">
          {["REDBULL", "PUMA", "UNIQLO"].map((name, i) => {
            const linkDelay = linksDelay + IMAGE_DELAY_MS + 200 + i * 8 * CHAR_STAGGER_MS;
            return (
              <a
                key={name}
                href={`#section-${name.toLowerCase()}`}
                className={styles.clientLink}
              >
                <CharReveal revealed={charsReady} baseDelay={linkDelay}>
                  {name}
                </CharReveal>
              </a>
            );
          })}
        </nav>

        {/* Down arrow */}
        <svg
          id="landing-down-arrow"
          className={styles.downArrow}
          width="14"
          height="20"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{
            opacity: charsReady ? 0.5 : 0,
            transition: `opacity 400ms ${linksDelay + IMAGE_DELAY_MS + 600}ms ease-out`,
          }}
        >
          <path
            d="M10 1 L10 25 M3 19 L10 26 L17 19"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
};
