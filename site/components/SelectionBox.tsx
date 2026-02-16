"use client";

import React, { useEffect, useRef } from "react";
import { useControls } from "leva";
import styles from "./SelectionBox.module.css";

export const SelectionBox: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<Record<string, number>>({});

  const controls = useControls("Selection Box", {
    shardSize: {
      value: 5,
      min: 5,
      max: 60,
      step: 1,
      label: "shard size (px)",
    },
    shrinkDuration: {
      value: 0.4,
      min: 0.1,
      max: 1.5,
      step: 0.05,
      label: "shrink duration (s)",
    },
    staggerMax: {
      value: 0.45,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "stagger max (s)",
    },
    rippleRadius: {
      value: 100,
      min: 40,
      max: 400,
      step: 10,
      label: "ripple radius (px)",
    },
    rippleShardSize: {
      value: 5,
      min: 4,
      max: 40,
      step: 1,
      label: "ripple shard (px)",
    },
    rippleDuration: {
      value: 0.50,
      min: 0.1,
      max: 1.5,
      step: 0.05,
      label: "ripple duration (s)",
    },
    rippleWaveSpeed: {
      value: 0.01,
      min: 0.001,
      max: 0.015,
      step: 0.001,
      label: "ripple wave speed",
    },
  });

  controlsRef.current = controls;

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let drawing = false;
    let didDrag = false;
    let startX = 0;
    let startY = 0;
    let boxEl: HTMLDivElement | null = null;
    const DRAG_THRESHOLD = 4;

    const isBlocked = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;

      // Check for interactive elements
      if (
        target.closest(
          "a, button, [role='button'], input, textarea, select, nav"
        )
      )
        return true;

      // Check for cursor pointer
      if (getComputedStyle(target).cursor === "pointer") return true;

      // Check for text nodes / content elements
      const tag = target.tagName;
      if (
        tag === "P" ||
        tag === "H1" ||
        tag === "H2" ||
        tag === "H3" ||
        tag === "H4" ||
        tag === "SPAN" ||
        tag === "LABEL"
      )
        return true;

      // Check if element has direct text content (not just whitespace)
      for (const node of target.childNodes) {
        if (
          node.nodeType === Node.TEXT_NODE &&
          node.textContent &&
          node.textContent.trim().length > 0
        )
          return true;
      }

      return false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left click only
      if (isBlocked(e.target)) return;

      drawing = true;
      didDrag = false;
      startX = e.clientX;
      startY = e.clientY;

      boxEl = document.createElement("div");
      boxEl.className = styles.box;
      boxEl.style.left = `${startX}px`;
      boxEl.style.top = `${startY}px`;
      boxEl.style.width = "0px";
      boxEl.style.height = "0px";
      overlay.appendChild(boxEl);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!drawing || !boxEl) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!didDrag && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        didDrag = true;
      }

      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);

      boxEl.style.left = `${x}px`;
      boxEl.style.top = `${y}px`;
      boxEl.style.width = `${w}px`;
      boxEl.style.height = `${h}px`;
    };

    const spawnRipple = (cx: number, cy: number) => {
      const c = controlsRef.current;
      const size = c.rippleShardSize;
      const radius = c.rippleRadius;
      const half = size / 2;
      const shards: HTMLDivElement[] = [];
      let maxDelay = 0;

      // Fill a grid covering the ripple circle
      const gridStart = -Math.ceil(radius / size) * size;
      const gridEnd = Math.ceil(radius / size) * size;

      for (let gx = gridStart; gx <= gridEnd; gx += size) {
        for (let gy = gridStart; gy <= gridEnd; gy += size) {
          const dist = Math.sqrt(gx * gx + gy * gy);
          if (dist > radius) continue;

          const shard = document.createElement("div");
          shard.className = styles.rippleShard;
          shard.style.left = `${cx + gx - half}px`;
          shard.style.top = `${cy + gy - half}px`;
          shard.style.width = `${size}px`;
          shard.style.height = `${size}px`;

          const delay = dist * c.rippleWaveSpeed;
          if (delay > maxDelay) maxDelay = delay;
          shard.style.setProperty("--ripple-dur", `${c.rippleDuration}s`);
          shard.style.setProperty("--ripple-delay", `${delay}s`);

          overlay.appendChild(shard);
          shards.push(shard);
        }
      }

      const cleanup = (maxDelay + c.rippleDuration) * 1000 + 100;
      setTimeout(() => {
        for (const s of shards) s.remove();
      }, cleanup);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!drawing || !boxEl) return;
      drawing = false;

      const c = controlsRef.current;

      // Click (no drag) → ripple
      if (!didDrag) {
        boxEl.remove();
        boxEl = null;
        spawnRipple(e.clientX, e.clientY);
        return;
      }

      const rect = boxEl.getBoundingClientRect();
      boxEl.remove();
      boxEl = null;
      didDrag = false;

      // Don't shatter tiny accidental drags
      if (rect.width < 4 || rect.height < 4) return;

      // Create shard grid
      const size = c.shardSize;
      const cols = Math.ceil(rect.width / size);
      const rows = Math.ceil(rect.height / size);
      const shards: HTMLDivElement[] = [];

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const shard = document.createElement("div");
          shard.className = styles.shard;

          const sx = rect.left + col * size;
          const sy = rect.top + r * size;
          // Clip last row/col to fit the box exactly
          const sw = Math.min(size, rect.right - sx);
          const sh = Math.min(size, rect.bottom - sy);

          shard.style.left = `${sx}px`;
          shard.style.top = `${sy}px`;
          shard.style.width = `${sw}px`;
          shard.style.height = `${sh}px`;

          // Random delay for organic feel
          const delay = Math.random() * c.staggerMax;
          shard.style.transition = `transform ${c.shrinkDuration}s ${delay}s cubic-bezier(0.4, 0, 0.7, 0.2), opacity ${c.shrinkDuration * 0.5}s ${delay + c.shrinkDuration * 0.5}s ease-in`;
          shard.style.transform = "scale(1)";
          shard.style.opacity = "1";

          overlay.appendChild(shard);
          shards.push(shard);
        }
      }

      // Trigger shrink on next frame
      requestAnimationFrame(() => {
        for (const shard of shards) {
          shard.style.transform = "scale(0)";
          shard.style.opacity = "0";
        }
      });

      // Clean up shards after animation
      const maxTime = (c.shrinkDuration + c.staggerMax) * 1000 + 100;
      setTimeout(() => {
        for (const shard of shards) {
          shard.remove();
        }
      }, maxTime);
    };

    // Use capture so we get the event before anything else can preventDefault
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return <div ref={overlayRef} className={styles.overlay} />;
};
