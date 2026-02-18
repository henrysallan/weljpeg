"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./ScrollFadeIn.module.css";

interface ScrollFadeInProps {
  children: React.ReactNode;
  className?: string;
  /** Viewport fraction before triggering. Default 0.12 */
  threshold?: number;
  /** Root margin. Default "0px 0px -6% 0px" */
  rootMargin?: string;
  /** Fade-in duration ms. Default 500 */
  duration?: number;
  /** Drift-up distance px. Default 12 */
  travel?: number;
  /** Gaussian blur radius when hidden (px). Default 14. Set 0 to disable. */
  blur?: number;
}

export const ScrollFadeIn: React.FC<ScrollFadeInProps> = ({
  children,
  className,
  threshold = 0.12,
  rootMargin = "0px 0px -6% 0px",
  duration = 500,
  travel = 12,
  blur = 14,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div
      ref={ref}
      className={`${styles.wrap} ${className ?? ""}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${travel}px)`,
        filter: visible ? "blur(0px)" : `blur(${blur}px)`,
        transition: visible
          ? `opacity ${duration}ms ease-out, transform ${duration}ms ease-out, filter ${duration * 0.8}ms ease-out`
          : `opacity 200ms ease-in, transform 200ms ease-in, filter 150ms ease-in`,
      }}
    >
      {children}
    </div>
  );
};
