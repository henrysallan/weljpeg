"use client";

import React from "react";
import { TagPill } from "./TagPill";
import { Separator } from "./Separator";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  tags: string[];
  sectionId: string;
  className?: string;
}

/**
 * Section header — starts Expanded (74px, 83px title).
 * The ScrollManager animates it to Collapsed state (34.5px, 35.6px title)
 * and manages the sticky-stack positioning.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  tags,
  sectionId,
  className,
}) => {
  return (
    <div
      id={`header-block-${sectionId}`}
      className={`${styles.headerBlock} ${className ?? ""}`}
      data-section={sectionId}
    >
      <Separator />
      <div
        id={`header-${sectionId}`}
        className={`${styles.header} ${styles.headerExpanded}`}
      >
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.tags}>
          {tags.map((tag, i) => (
            <TagPill key={`${sectionId}-tag-${i}`} label={tag} />
          ))}
        </div>
      </div>
      <Separator />
    </div>
  );
};
