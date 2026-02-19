"use client";

import React, { useState, useEffect } from "react";
import { ScrollCharReveal } from "./ScrollCharReveal";
import { ScrollImageReveal } from "./ScrollImageReveal";
import styles from "./ContentBlock.module.css";
import type { ContentBlock as ContentBlockType, BlockColumn } from "@/lib/data";

/** True on devices without a fine pointer (touch screens). */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(!window.matchMedia("(pointer: fine)").matches);
  }, []);
  return mobile;
}

/**
 * Convert newlines in a string to <br /> elements.
 * Sanity's `text` field stores line breaks as \n — this maps them to JSX.
 */
function nl2br(text?: string): React.ReactNode {
  if (!text) return null;
  return text.split("\n").flatMap((line, i, arr) =>
    i < arr.length - 1
      ? [line, <br key={`br-${i}`} />]
      : [line],
  );
}

interface ContentBlockProps {
  block: ContentBlockType;
  className?: string;
}

/**
 * Renders one of three module types:
 *  - split:      2-column grid (text + image)
 *  - full-image: full-width image
 *  - title:      large title text with width & alignment
 */
export const ContentBlock: React.FC<ContentBlockProps> = ({ block, className }) => {
  const isMobile = useIsMobile();

  if (block.type === "full-image") {
    return (
      <div className={`${styles.fullImage} ${className ?? ""}`}>
        <ScrollImageReveal
          src={block.src}
          alt={block.alt}
          className={styles.fullImageInner}
        />
      </div>
    );
  }

  if (block.type === "gallery") {
    return (
      <div
        className={`${styles.gallery} ${className ?? ""}`}
        style={{ gridTemplateColumns: `repeat(${block.images.length}, 1fr)` }}
      >
        {block.images.map((img, i) => (
          <ScrollImageReveal
            key={`${block.id}-${i}`}
            src={img.src}
            alt={img.alt}
            className={styles.galleryItem}
          />
        ))}
      </div>
    );
  }

  if (block.type === "title") {
    const align = block.align ?? "left";
    const justifyMap = { left: "flex-start", center: "center", right: "flex-end" } as const;
    return (
      <div
        className={`${styles.titleBlock} ${className ?? ""}`}
        style={{ justifyContent: justifyMap[align] }}
      >
        <h2
          className={styles.titleText}
          style={{
            width: block.width ?? "100%",
            textAlign: align,
          }}
        >
          <ScrollCharReveal>{block.text}</ScrollCharReveal>
        </h2>
      </div>
    );
  }

  /* type === "split" */
  const gridTemplate = `${block.splitLeft}fr ${block.splitRight}fr`;

  return (
    <div
      className={`${styles.block} ${className ?? ""}`}
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <Column data={block.leftContent} isMobile={isMobile} />
      <Column data={block.rightContent} isMobile={isMobile} />
    </div>
  );
};

/* ---- Column renderer ---- */

const Column: React.FC<{ data: BlockColumn; isMobile: boolean }> = ({ data, isMobile }) => {
  const alignClass =
    data.align === "bottom"
      ? styles.columnAlignBottom
      : data.align === "top"
      ? styles.columnAlignTop
      : data.align === "center"
      ? styles.columnAlignCenter
      : "";

  return (
    <div className={`${styles.column} ${alignClass}`}>
      {data.type === "image" && data.image && (
        data.image.src ? (
          <ScrollImageReveal
            src={data.image.src}
            alt={data.image.alt}
            className={styles.imageWrap}
          />
        ) : (
          <div className={styles.placeholderImage} role="img" aria-label={data.image.alt} />
        )
      )}

      {data.type === "image" && !data.image && (
        <div className={styles.placeholderImage} role="img" aria-label="Placeholder image" />
      )}

      {data.type === "text" && (
        <p className={styles.bodyText}>
          <ScrollCharReveal stagger={2} simple={isMobile}>{nl2br(data.body)}</ScrollCharReveal>
        </p>
      )}

      {data.type === "titled-text" && (
        <>
          {data.subHeading && (
            <h3 className={styles.subHeading}>
              <ScrollCharReveal>{data.subHeading}</ScrollCharReveal>
            </h3>
          )}
          <p className={styles.bodyText}>
            <ScrollCharReveal stagger={2} simple={isMobile}>{nl2br(data.body)}</ScrollCharReveal>
          </p>
        </>
      )}
    </div>
  );
};
