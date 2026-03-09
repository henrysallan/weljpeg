"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import gsap from "gsap";
import { interpolate as flubberInterpolate } from "flubber";
import { logoAnimConfig } from "@/lib/levaConfig";

/* ============================================================
   AnimatedWelcomeLogo

   Three-phase morph between a single centred dot ● and the
   five-piece "W" logo mark:

     DOT → LOGO (expand)
     1. Dot splits into 5 circles that spread out onto a radial ring
     2. Circles spin around the centre in an even radial array
     3. As spin decelerates, circles migrate to W positions & morph

     LOGO → DOT (collapse)  — reverse of the above

   Uses flubber for shape interpolation, GSAP for timing.
   ============================================================ */

/* ---- The 5 original blob paths forming the W ---- */
const BLOB_PATHS = [
  "M0.624741 5.20879C-0.225122 1.96017 -0.217248 1.51999 0.705709 0.597035C1.74315 -0.440408 3.77301 -0.0713061 4.47527 1.28254C4.88839 2.07889 5.98601 6.52791 5.99469 7.44218C6.00882 8.89012 4.53686 9.95139 3.1081 9.52333C1.87339 9.15342 1.47561 8.46226 0.624741 5.20879Z",
  "M31.7434 1.21773C31.916 0.925554 32.296 0.538077 32.5878 0.357161C33.4176 -0.157926 34.6901 -0.0783713 35.4178 0.534039C36.366 1.33201 36.3852 1.99611 35.5517 5.19022C34.7436 8.2872 34.4599 8.8245 33.3379 9.38178C32.6865 9.70525 32.4596 9.72686 31.7969 9.52837C30.779 9.22348 30.1904 8.46165 30.1904 7.44905C30.1904 6.46329 31.3185 1.93715 31.7434 1.21773Z",
  "M15.1691 3.4497C15.8096 1.11031 15.9144 0.905768 16.7261 0.410873C17.0799 0.195227 17.6874 0.0185509 18.0761 0.0185509C18.8545 0.0185509 19.961 0.599664 20.2637 1.16725C20.6495 1.89092 21.5085 5.38769 21.5085 6.23614C21.5089 7.76081 20.4759 9.05408 18.8747 9.53383C17.8912 9.82842 16.7798 9.54756 15.8569 8.77099C14.497 7.62673 14.3457 6.45663 15.1691 3.4497Z",
  "M6.05487 24.7518C6.23195 23.609 6.99377 22.56 8.01345 22.0554C9.11611 21.5097 10.2341 21.5046 11.3408 22.0403C12.2817 22.4958 12.9733 23.4283 13.2485 24.6127C13.5122 25.7477 12.375 29.7371 11.5225 30.6676C10.4724 31.8134 8.61859 31.7704 7.53693 30.5751C6.99054 29.9713 5.90626 25.7109 6.05487 24.7518Z",
  "M23.207 23.6817C23.5733 22.9806 24.4983 22.1049 25.1432 21.8485C27.17 21.0426 29.7109 22.457 30.116 24.6167C30.291 25.5496 29.3087 29.6844 28.7405 30.4069C27.6401 31.8059 25.669 31.8683 24.4688 30.5422C23.9666 29.9873 22.93 26.3958 22.9256 25.196C22.9237 24.6632 23.0503 23.9817 23.207 23.6817Z",
];

/* ---- SVG geometry ---- */
const VB_W = 36.1541;
const VB_H = 31.5;
const CX = VB_W / 2;
const CY = VB_H / 2;
const DOT_R = 3;

/* Pad the viewBox so orbiting circles aren't clipped */
const PAD = 4;
const VB_X = -PAD;
const VB_Y = -PAD;
const VB_FULL_W = VB_W + PAD * 2;
const VB_FULL_H = VB_H + PAD * 2;

/** Approximate bounding-box centres for each blob (= W target positions) */
const BLOB_CENTERS: { x: number; y: number }[] = [
  { x: 3.0, y: 4.8 },
  { x: 33.3, y: 4.8 },
  { x: 18.0, y: 4.9 },
  { x: 9.7, y: 26.3 },
  { x: 26.6, y: 26.5 },
];

/** Radius of the radial ring the dots orbit on */
const RING_R = 10;

/** Base angles for 5 dots evenly distributed on the ring (72° apart) */
const BASE_ANGLES = [0, 1, 2, 3, 4].map((i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);

/** 4-arc cubic-bézier circle path */
function circlePath(cx: number, cy: number, r: number): string {
  const k = r * 0.5522847498;
  return [
    `M${cx},${cy - r}`,
    `C${cx + k},${cy - r},${cx + r},${cy - k},${cx + r},${cy}`,
    `C${cx + r},${cy + k},${cx + k},${cy + r},${cx},${cy + r}`,
    `C${cx - k},${cy + r},${cx - r},${cy + k},${cx - r},${cy}`,
    `C${cx - r},${cy - k},${cx - k},${cy - r},${cx},${cy - r}`,
    `Z`,
  ].join(" ");
}

/** Circle path positioned at each blob's final centre */
const BLOB_CIRCLES = BLOB_CENTERS.map((c) => circlePath(c.x, c.y, DOT_R));

/* ---- Public imperative handle ---- */
export interface AnimatedLogoHandle {
  toLogo: (duration?: number) => gsap.core.Timeline;
  toDot: (duration?: number) => gsap.core.Timeline;
  loop: (opts?: LoopOptions) => void;
  stopLoop: () => void;
  setProgress: (p: number) => void;
}

export interface LoopOptions {
  expandDuration?: number;
  collapseDuration?: number;
  holdLogo?: number;
  holdDot?: number;
}

/* ---- Props ---- */
interface AnimatedLogoProps {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
  initialProgress?: number;
  autoLoop?: boolean;
  loopOptions?: LoopOptions;
  "aria-label"?: string;
}

const EASE = "power4.out";

/* ---- Component ---- */
export const AnimatedWelcomeLogo = forwardRef<
  AnimatedLogoHandle,
  AnimatedLogoProps
>(function AnimatedWelcomeLogo(
  {
    className,
    width = 36,
    height = 31.5,
    color = "currentColor",
    initialProgress = 0,
    autoLoop = false,
    loopOptions,
    "aria-label": ariaLabel = "Welcome Labs logo",
  },
  ref,
) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  /**
   * Anim state — GSAP tweens these, paint() reads them.
   *
   *  radialSpread : 0 = all at centre, 1 = on the ring
   *  rotation     : cumulative degrees of ring rotation
   *  settle       : 0 = on ring positions, 1 = at final W positions
   *  morph        : 0 = circle, 1 = blob shape
   */
  const S = useRef({
    radialSpread: initialProgress,
    rotation: 0,
    settle: initialProgress,
    morph: initialProgress,
  });

  /** Resolution state — lower maxSegmentLength = smoother curves */
  const [resolution, setResolution] = useState(logoAnimConfig.morphResolution);

  /** Flubber interpolators: circle-at-blob-centre → blob */
  const morphLerps = useMemo(
    () =>
      BLOB_PATHS.map((blob, i) =>
        flubberInterpolate(BLOB_CIRCLES[i], blob, { maxSegmentLength: resolution }),
      ),
    [resolution],
  );

  // Register resolution-change callback
  useEffect(() => {
    logoAnimConfig._onResolutionChange = () =>
      setResolution(logoAnimConfig.morphResolution);
    return () => {
      logoAnimConfig._onResolutionChange = null;
    };
  }, []);

  /** Push current anim state to the DOM */
  const paint = useCallback(() => {
    const { radialSpread, rotation, settle, morph } = S.current;
    const rotRad = (rotation * Math.PI) / 180;

    for (let i = 0; i < 5; i++) {
      const p = pathRefs.current[i];
      if (!p) continue;

      // Ring position: evenly spaced on circle of radius RING_R
      const angle = BASE_ANGLES[i] + rotRad;
      const ringX = CX + Math.cos(angle) * RING_R * radialSpread;
      const ringY = CY + Math.sin(angle) * RING_R * radialSpread;

      // Centre position (when radialSpread = 0, all converge here)
      const centreX = CX;
      const centreY = CY;

      // When not yet spread, position is at centre
      // When spread but not settled, position is on the ring
      // When settled, position is at blob's final W centre
      const preSettleX = radialSpread > 0.001 ? ringX : centreX;
      const preSettleY = radialSpread > 0.001 ? ringY : centreY;

      // Final position blends ring → W target as settle goes 0→1
      const finalX = preSettleX + (BLOB_CENTERS[i].x - preSettleX) * settle;
      const finalY = preSettleY + (BLOB_CENTERS[i].y - preSettleY) * settle;

      // Translate the path: it's authored at BLOB_CENTERS[i], so offset
      const tx = finalX - BLOB_CENTERS[i].x;
      const ty = finalY - BLOB_CENTERS[i].y;

      p.setAttribute("transform", `translate(${tx}, ${ty})`);
      p.setAttribute("d", morphLerps[i](morph));
    }
  }, [morphLerps]);

  useEffect(() => {
    paint();
  }, [paint]);

  const killTl = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }
  }, []);

  /**
   * DOT → LOGO
   *
   *  0.00–0.30  radialSpread 0→1 (dots burst onto ring)
   *  0.00–0.70  rotation 0→360   (spin, fast-in slow-out)
   *  0.35–0.85  settle 0→1       (ring → W positions, overlaps spin)
   *  0.55–0.95  morph 0→1        (circles → blobs as spin stops)
   */
  const buildExpand = useCallback(
    (dur: number) => {
      const tl = gsap.timeline({ onUpdate: paint });
      tl.to(S.current, { radialSpread: 1, duration: dur * 0.30, ease: EASE }, 0);
      tl.to(S.current, { rotation: "+=360", duration: dur * 0.70, ease: EASE }, 0);
      tl.to(S.current, { settle: 1, duration: dur * 0.50, ease: EASE }, dur * 0.35);
      tl.to(S.current, { morph: 1, duration: dur * 0.40, ease: EASE }, dur * 0.55);
      return tl;
    },
    [paint],
  );

  /**
   * LOGO → DOT  (reverse order)
   *
   *  0.00–0.35  morph 1→0         (blobs → circles)
   *  0.10–0.65  settle 1→0        (W positions → ring)
   *  0.25–1.00  rotation +=360    (spin)
   *  0.65–1.00  radialSpread 1→0  (ring collapses to centre)
   */
  const buildCollapse = useCallback(
    (dur: number) => {
      const tl = gsap.timeline({ onUpdate: paint });
      tl.to(S.current, { morph: 0, duration: dur * 0.35, ease: EASE }, 0);
      tl.to(S.current, { settle: 0, duration: dur * 0.55, ease: EASE }, dur * 0.10);
      tl.to(S.current, { rotation: "+=360", duration: dur * 0.75, ease: EASE }, dur * 0.25);
      tl.to(S.current, { radialSpread: 0, duration: dur * 0.35, ease: EASE }, dur * 0.65);
      return tl;
    },
    [paint],
  );

  const startLoop = useCallback(
    (opts?: LoopOptions) => {
      const {
        expandDuration = logoAnimConfig.expandDuration,
        collapseDuration = logoAnimConfig.collapseDuration,
        holdLogo = logoAnimConfig.holdLogo,
        holdDot = logoAnimConfig.holdDot,
      } = opts ?? {};

      killTl();
      S.current.radialSpread = 0;
      S.current.rotation = 0;
      S.current.settle = 0;
      S.current.morph = 0;
      paint();

      const master = gsap.timeline({ repeat: -1, repeatDelay: holdDot });
      master.add(buildExpand(expandDuration), 0);
      master.add(buildCollapse(collapseDuration), expandDuration + holdLogo);

      tlRef.current = master;
    },
    [paint, killTl, buildExpand, buildCollapse],
  );

  useImperativeHandle(
    ref,
    () => ({
      toLogo(duration = 1.6) {
        killTl();
        const tl = buildExpand(duration);
        tlRef.current = tl;
        return tl;
      },
      toDot(duration = 1.6) {
        killTl();
        const tl = buildCollapse(duration);
        tlRef.current = tl;
        return tl;
      },
      loop: startLoop,
      stopLoop: killTl,
      setProgress(p: number) {
        killTl();
        const t = Math.max(0, Math.min(1, p));
        S.current.radialSpread = t;
        S.current.settle = t;
        S.current.morph = t;
        S.current.rotation = 0;
        paint();
      },
    }),
    [paint, killTl, startLoop, buildExpand, buildCollapse],
  );

  // Restart loop when autoLoop toggles or when config is externally updated
  useEffect(() => {
    if (autoLoop) startLoop(loopOptions);
    return killTl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoop]);

  /** Allow external callers to restart the loop with current config */
  const restartLoop = useCallback(() => {
    if (autoLoop) startLoop();
  }, [autoLoop, startLoop]);

  // Register restartLoop on the shared config so leva panel can trigger it
  useEffect(() => {
    logoAnimConfig._onRestart = restartLoop;
    return () => {
      logoAnimConfig._onRestart = null;
    };
  }, [restartLoop]);

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`${VB_X} ${VB_Y} ${VB_FULL_W} ${VB_FULL_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      style={{ display: "block", overflow: "visible" }}
    >
      {BLOB_PATHS.map((_, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          fill={color}
        />
      ))}
    </svg>
  );
});
