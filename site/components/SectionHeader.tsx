"use client";

import React from "react";
import { useControls, folder } from "leva";
import { TagPill } from "./TagPill";
import { Separator } from "./Separator";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  tags: string[];
  sectionId: string;
  description: string;
  client: string;
  services: string;
  className?: string;
  hideTopSeparator?: boolean;
}

/**
 * Section header — starts Expanded (74px title row + expandedContent).
 * The ScrollManager animates it to Collapsed state (34.5px, 35.6px title)
 * and manages the sticky-stack positioning.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  tags,
  sectionId,
  description,
  client,
  services,
  className,
  hideTopSeparator,
}) => {
  const { showTags, pillStroke, pillRadius } = useControls("Section Headers", {
    showTags: { value: true, label: "show tags" },
    pillStroke: { value: true, label: "pill stroke" },
    pillRadius: { value: 0, min: 0, max: 9999, step: 1, label: "pill radius" },
  });

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
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.tags} style={{ visibility: showTags ? "visible" : "hidden" }}>
          {tags.map((tag, i) => (
          <TagPill
            key={`${sectionId}-tag-${i}`}
            label={tag}
            style={{
              borderColor: pillStroke ? undefined : "transparent",
              borderRadius: `${pillRadius}px`,
            }}
          />
          ))}
        </div>
      </div>

      {/* Expanded content — fades out during collapse */}
      <div className={styles.expandedContent}>
        <div className={styles.descCol}>
          <p className={styles.descText}>{description}</p>
        </div>
        <div className={styles.metaCol}>
          <p className={styles.metaLine}>
            <span className={styles.metaLabel}>Client:</span> {client}
          </p>
          <p className={styles.metaLine}>
            <span className={styles.metaLabel}>Services:</span> {services}
          </p>
        </div>
      </div>

      <Separator />
    </div>
  );
};
