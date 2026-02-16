"use client";

import React, { useEffect, useRef } from "react";
import { useControls } from "leva";
import styles from "./CursorEffect.module.css";

export const CursorEffect: React.FC = () => {
  const linesRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<Record<string, number>>({});

  const controls = useControls("Cursor", {
    lineThickness: {
      value: 0.5,
      min: 0.5,
      max: 5,
      step: 0.5,
      label: "line thickness",
    },
    maskRadius: {
      value: 13,
      min: 10,
      max: 100,
      step: 1,
      label: "mask radius",
    },
    dotRadius: {
      value: 2,
      min: 1,
      max: 20,
      step: 0.5,
      label: "dot radius",
    },
  });

  controlsRef.current = controls;

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add(styles.cursorHidden);

    const linesEl = linesRef.current;
    const dotEl = dotRef.current;
    let visible = false;

    const show = () => {
      if (visible) return;
      visible = true;
      if (linesEl) linesEl.style.opacity = "1";
      if (dotEl) dotEl.style.opacity = "1";
    };

    const hide = () => {
      if (!visible) return;
      visible = false;
      if (linesEl) linesEl.style.opacity = "0";
      if (dotEl) dotEl.style.opacity = "0";
    };

    const onMouseMove = (e: MouseEvent) => {
      show();
      const x = e.clientX;
      const y = e.clientY;
      const c = controlsRef.current;

      if (linesEl) {
        linesEl.style.setProperty("--mx", `${x}px`);
        linesEl.style.setProperty("--my", `${y}px`);
        linesEl.style.setProperty("--mask-r", `${c.maskRadius}px`);
        linesEl.style.setProperty("--line-w", `${c.lineThickness}px`);
      }

      if (dotEl) {
        dotEl.style.left = `${x}px`;
        dotEl.style.top = `${y}px`;
        dotEl.style.width = `${c.dotRadius * 2}px`;
        dotEl.style.height = `${c.dotRadius * 2}px`;
      }
    };

    const onMouseLeave = () => hide();
    const onMouseEnter = () => {
      /* re-show handled by next mousemove */
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      html.classList.remove(styles.cursorHidden);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <>
      <div ref={linesRef} className={styles.lines} style={{ opacity: 0 }}>
        <div className={styles.vLine} />
        <div className={styles.hLine} />
      </div>
      <div ref={dotRef} className={styles.dot} style={{ opacity: 0 }} />
    </>
  );
};
