"use client";

import React from "react";
import { SectionHeader } from "./SectionHeader";
import { ContentBlock } from "./ContentBlock";
import styles from "./Section.module.css";
import type { CaseStudy, ServicesSection } from "@/lib/data";

interface SectionProps {
  data: CaseStudy | ServicesSection;
  className?: string;
}

/**
 * Full section — header + separator + content blocks.
 */
export const Section: React.FC<SectionProps> = ({ data, className }) => {
  return (
    <section
      id={`section-${data.id}`}
      className={`${styles.section} ${className ?? ""}`}
      aria-labelledby={`header-${data.id}`}
    >
      <SectionHeader
        title={data.title}
        tags={data.tags}
        sectionId={data.id}
      />

      <div className={styles.sectionContent}>
        {data.blocks.map((block) => (
          <ContentBlock
            key={block.id}
            splitLeft={block.splitLeft}
            splitRight={block.splitRight}
            leftContent={block.leftContent}
            rightContent={block.rightContent}
          />
        ))}
      </div>
    </section>
  );
};
