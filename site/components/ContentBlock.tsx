"use client";

import React from "react";
import { ScrollCharReveal } from "./ScrollCharReveal";
import { ScrollImageReveal } from "./ScrollImageReveal";
import styles from "./ContentBlock.module.css";
import type { BlockColumn } from "@/lib/data";

interface ContentBlockProps {
  splitLeft: number;
  splitRight: number;
  leftContent: BlockColumn;
  rightContent: BlockColumn;
  className?: string;
}

/**
 * Content block — 2-column grid with configurable split ratio.
 * Uses the 8-column grid spec from the design docs.
 */
export const ContentBlock: React.FC<ContentBlockProps> = ({
  splitLeft,
  splitRight,
  leftContent,
  rightContent,
  className,
}) => {
  const gridTemplate = `${splitLeft}fr ${splitRight}fr`;

  return (
    <div
      className={`${styles.block} ${className ?? ""}`}
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <Column data={leftContent} />
      <Column data={rightContent} />
    </div>
  );
};

/* ---- Column renderer ---- */

const Column: React.FC<{ data: BlockColumn }> = ({ data }) => {
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
          <ScrollCharReveal stagger={2}>{data.body}</ScrollCharReveal>
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
            <ScrollCharReveal stagger={2}>{data.body}</ScrollCharReveal>
          </p>
        </>
      )}
    </div>
  );
};
