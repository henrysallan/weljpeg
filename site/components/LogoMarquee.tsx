"use client";

import React from "react";
import styles from "./LogoMarquee.module.css";

/* All company logos with viewBox aspect ratios for area-normalised sizing.
   Each logo gets a height that gives it roughly the same visual area. */
const LOGO_DATA: { src: string; ratio: number }[] = [
  { src: "/images/companylogos/Logo_01.svg", ratio: 76 / 12 },   // 6.33
  { src: "/images/companylogos/Logo_02.svg", ratio: 55 / 55 },   // 1.00
  { src: "/images/companylogos/Logo_03.svg", ratio: 81 / 10 },   // 8.10
  { src: "/images/companylogos/Logo_04.svg", ratio: 71 / 16 },   // 4.44
  { src: "/images/companylogos/Logo_05.svg", ratio: 69 / 27 },   // 2.56
  { src: "/images/companylogos/Logo_06.svg", ratio: 69 / 42 },   // 1.64
  { src: "/images/companylogos/Logo_07.svg", ratio: 65 / 65 },   // 1.00
  { src: "/images/companylogos/Logo_08.svg", ratio: 56 / 52 },   // 1.08
  { src: "/images/companylogos/Logo_09.svg", ratio: 74 / 29 },   // 2.55
  { src: "/images/companylogos/Logo_10.svg", ratio: 142 / 15 },  // 9.47
  { src: "/images/companylogos/Logo_11.svg", ratio: 65 / 42 },   // 1.55
  { src: "/images/companylogos/Logo_12.svg", ratio: 144 / 44 },  // 3.27
  { src: "/images/companylogos/Logo_13.svg", ratio: 159 / 17 },  // 9.35
];

/** Target visual area (px²). Equivalent to a ~28×28 square. */
const TARGET_AREA = 784;
const MIN_H = 10;
const MAX_H = 32;

/** Height that gives this logo roughly TARGET_AREA of visual weight. */
function normHeight(ratio: number) {
  const h = Math.sqrt(TARGET_AREA / ratio);
  return Math.round(Math.min(MAX_H, Math.max(MIN_H, h)) * 10) / 10;
}

interface LogoMarqueeProps {
  /** Seconds for one full loop. Default 30. */
  duration?: number;
  className?: string;
}

/**
 * Infinite horizontal logo carousel.
 * Logos are duplicated so the seam is invisible.
 * Left/right edges fade via CSS mask-image gradient.
 */
export const LogoMarquee: React.FC<LogoMarqueeProps> = ({
  duration = 30,
  className,
}) => {
  // Duplicate logos for seamless loop
  const allLogos = [...LOGO_DATA, ...LOGO_DATA];

  return (
    <div
      className={`${styles.wrapper}${className ? ` ${className}` : ""}`}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      <div className={styles.track}>
        {allLogos.map((logo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={logo.src}
            alt=""
            className={styles.logo}
            style={{ height: `${normHeight(logo.ratio)}px` }}
            loading="eager"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
};
