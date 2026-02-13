"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "./ImageCycler.module.css";

interface ImageCyclerProps {
  images: string[];
  interval?: number;
  className?: string;
}

/**
 * Hard-cut image cycler — no transitions between images.
 * Preloads all images to avoid flicker on swap.
 */
export const ImageCycler: React.FC<ImageCyclerProps> = ({
  images,
  interval = 3500,
  className,
}) => {
  const [current, setCurrent] = useState(0);

  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Auto-cycle
  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(advance, interval);
    return () => clearInterval(id);
  }, [advance, interval, images.length]);

  // Preload images
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  if (images.length === 0) return null;

  return (
    <div className={`${styles.cycler} ${className ?? ""}`} aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[current]}
        alt={`Project showcase ${current + 1}`}
        className={styles.image}
        key={images[current]}
      />
    </div>
  );
};
