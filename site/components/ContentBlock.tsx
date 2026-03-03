"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

/**
 * Parse [bracketed text] into <HighlightText> components.
 * Used for case-study body copy — the brackets become underlined hover targets
 * with a random italic stagger effect.
 */
function parseHighlights(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return <HighlightText key={i}>{part.slice(1, -1)}</HighlightText>;
    }
    return part;
  });
}

/** Shuffled array of indices [0..n) */
function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Underlined text with random italic stagger on hover.
 * Works with ScrollCharReveal — queries the leaf <span> char elements
 * and randomly toggles each one to italic on mouseenter, reverts on mouseleave.
 */
const FADE_MS = 100;      // opacity transition duration
const STAGGER_IN = 10;   // ms between chars on enter
const STAGGER_OUT = 8;   // ms between chars on leave

const HighlightText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const pendingRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /** Get all leaf character spans inside the highlight */
  const getCharSpans = useCallback((): HTMLSpanElement[] => {
    if (!ref.current) return [];
    return Array.from(ref.current.querySelectorAll("span")).filter(
      (s) => s.childElementCount === 0 && s.textContent !== ""
    );
  }, []);

  /** Cancel all pending per-char timeouts */
  const clearPending = useCallback(() => {
    clearInterval(timerRef.current);
    pendingRef.current.forEach(clearTimeout);
    pendingRef.current = [];
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearPending();
    const chars = getCharSpans();
    if (chars.length === 0) return;
    const order = shuffleIndices(chars.length);
    let count = 0;
    timerRef.current = setInterval(() => {
      if (count >= order.length) {
        clearInterval(timerRef.current);
        return;
      }
      const span = chars[order[count]];
      span.style.opacity = "0";
      const t = setTimeout(() => {
        span.style.fontStyle = "italic";
        span.style.opacity = "1";
      }, FADE_MS);
      pendingRef.current.push(t);
      count++;
    }, STAGGER_IN);
  }, [getCharSpans, clearPending]);

  const handleMouseLeave = useCallback(() => {
    clearPending();
    const chars = getCharSpans();
    if (chars.length === 0) return;
    const order = shuffleIndices(chars.length);
    let count = 0;
    timerRef.current = setInterval(() => {
      if (count >= order.length) {
        clearInterval(timerRef.current);
        return;
      }
      const span = chars[order[count]];
      span.style.opacity = "0";
      const t = setTimeout(() => {
        span.style.fontStyle = "";
        span.style.opacity = "";
      }, FADE_MS);
      pendingRef.current.push(t);
      count++;
    }, STAGGER_OUT);
  }, [getCharSpans, clearPending]);

  useEffect(() => {
    return () => clearPending();
  }, [clearPending]);

  return (
    <span
      ref={ref}
      className={styles.caseStudyHighlight}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );
};

interface ContentBlockProps {
  block: ContentBlockType;
  className?: string;
}

/* ---- Cards module ---- */

import type { CardsBlock as CardsBlockType, CaseStudyPageBlock as CaseStudyPageBlockType, AboutBlock as AboutBlockType } from "@/lib/data";

const CardsModule: React.FC<{ block: CardsBlockType; className?: string; isMobile: boolean }> = ({
  block,
  className,
  isMobile,
}) => {
  return (
    <div
      className={`${styles.cards} ${className ?? ""}`}
    >
      {block.cards.map((card, i) => (
          <div key={`${block.id}-${i}`} className={styles.card}>
              <h3 className={styles.cardTitle}>
                <ScrollCharReveal>{card.title}</ScrollCharReveal>
              </h3>
              <p className={styles.cardBody}>
                <ScrollCharReveal stagger={2} simple={isMobile}>{nl2br(card.body)}</ScrollCharReveal>
              </p>
              {card.items && card.items.length > 0 && (
                <ul className={styles.cardItems}>
                  {card.items.map((item, j) => (
                    <li key={j} className={styles.cardItem}>
                      <ScrollCharReveal stagger={2} simple={isMobile}>{item}</ScrollCharReveal>
                    </li>
                  ))}
                </ul>
              )}
          </div>
      ))}
    </div>
  );
};

/* ---- About module: text left, image right ---- */

const AboutModule: React.FC<{ block: AboutBlockType; className?: string; isMobile: boolean }> = ({
  block,
  className,
  isMobile,
}) => {
  return (
    <div className={`${styles.about} ${className ?? ""}`}>
      <div className={styles.aboutText}>
        {block.paragraphs.map((p, i) => (
          <p key={i} className={styles.aboutParagraph}>
            <ScrollCharReveal stagger={2} simple={isMobile}>{p}</ScrollCharReveal>
          </p>
        ))}
      </div>
    </div>
  );
};

/* ---- Case-study page module: text upper-left + focus image + thumbnail strip ---- */

import { CaseStudyGallery } from "./CaseStudyGallery";

const CaseStudyPageModule: React.FC<{ block: CaseStudyPageBlockType; className?: string; isMobile: boolean }> = ({
  block,
  className,
  isMobile,
}) => {
  return (
    <div className={`${styles.caseStudyPage} ${className ?? ""}`}>
      <h2 className={styles.caseStudyHeadline}>
        <ScrollCharReveal>{block.headline}</ScrollCharReveal>
      </h2>

      <div className={styles.caseStudyTexts}>
        {block.texts.map((text, i) => (
          <p key={`${block.id}-t-${i}`}>
            <ScrollCharReveal stagger={2} simple={isMobile}>{parseHighlights(text)}</ScrollCharReveal>
          </p>
        ))}
      </div>

      <CaseStudyGallery images={block.images} />
    </div>
  );
};

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

  if (block.type === "case-study-page") {
    return <CaseStudyPageModule block={block} className={className} isMobile={isMobile} />;
  }

  if (block.type === "cards") {
    return <CardsModule block={block} className={className} isMobile={isMobile} />;
  }

  if (block.type === "about") {
    return <AboutModule block={block as AboutBlockType} className={className} isMobile={isMobile} />;
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
