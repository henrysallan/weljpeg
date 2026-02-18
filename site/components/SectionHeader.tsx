"use client";

import React from "react";
import { ScrollCharReveal } from "./ScrollCharReveal";
import { Separator } from "./Separator";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  sectionId: string;
  className?: string;
  hideTopSeparator?: boolean;
}

/**
 * Section header — starts Expanded (74px title row).
 * The ScrollManager animates it to Collapsed state (34.5px, 35.6px title)
 * and manages the sticky-stack positioning.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  sectionId,
  className,
  hideTopSeparator,
}) => {
  return (
    <div
      id={`header-block-${sectionId}`}
      className={`${styles.headerBlock} ${className ?? ""}`}
      data-section={sectionId}
    >
      {!hideTopSeparator && <Separator />}
      <div
        id={`header-${sectionId}`}
        className={`${styles.header} ${styles.headerExpanded}`}
      >
        <h2 className={styles.title}>
          <ScrollCharReveal>{title}</ScrollCharReveal>
        </h2>
      </div>

      <Separator />
    </div>
  );
};
