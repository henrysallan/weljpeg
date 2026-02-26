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
 * Parse [bracketed text] into <span className="highlight"> elements.
 * Used for case-study body copy — the brackets become underlined hover targets.
 */
function parseHighlights(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span key={i} className={styles.caseStudyHighlight}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

interface ContentBlockProps {
  block: ContentBlockType;
  className?: string;
}

/* ---- 3D tilt card with FLIP expand-on-click ---- */

const TILT_MAX = 2; // degrees

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  ref?: React.Ref<HTMLDivElement>;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className, style, expanded, onExpand, onCollapse, ref }) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const rafId     = useRef(0);
  const rawTilt   = useRef({ rx: 0, ry: 0 });
  const current   = useRef({ rx: 0, ry: 0 });
  const mousePos  = useRef({ x: 0, y: 0 });

  // Merge refs
  const setRef = useCallback((el: HTMLDivElement | null) => {
    (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [ref]);

  // Track raw cursor position globally
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const tick = () => {
      const el = internalRef.current;
      if (!el || expanded) { rafId.current = requestAnimationFrame(tick); return; }

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const vh = window.innerHeight;

      const normY = cy / vh;
      const distFromCenter = Math.abs(normY - 0.5);
      const fadeStart = 0.3;
      const fadeEnd   = 0.55;
      const strength  = 1 - clamp((distFromCenter - fadeStart) / (fadeEnd - fadeStart), 0, 1);

      const rawX = clamp((mousePos.current.x - cx) / (rect.width  / 2), -1, 1);
      const rawY = clamp((mousePos.current.y - cy) / (rect.height / 2), -1, 1);
      rawTilt.current = {
        rx: -rawY * TILT_MAX * strength,
        ry:  rawX * TILT_MAX * strength,
      };

      current.current.rx = lerp(current.current.rx, rawTilt.current.rx, 0.08);
      current.current.ry = lerp(current.current.ry, rawTilt.current.ry, 0.08);
      el.style.transform = `perspective(800px) rotateX(${current.current.rx}deg) rotateY(${current.current.ry}deg)`;

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [expanded]);

  const handleClick = useCallback(() => {
    if (!expanded) onExpand();
  }, [expanded, onExpand]);

  return (
    <div
      ref={setRef}
      className={className}
      style={{ willChange: "transform", cursor: expanded ? "default" : "pointer", ...style }}
      onClick={handleClick}
    >
      {expanded && (
        <button
          className={styles.cardClose}
          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
          aria-label="Close"
        >
          ✕
        </button>
      )}
      {children}
    </div>
  );
};

/* ---- Cards module with FLIP expand/collapse ---- */

import type { CardsBlock as CardsBlockType, CaseStudyPageBlock as CaseStudyPageBlockType } from "@/lib/data";

const CardsModule: React.FC<{ block: CardsBlockType; className?: string; isMobile: boolean }> = ({
  block,
  className,
  isMobile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties | null>(null);
  // Track whether we're mid-collapse so we don't allow clicks
  const collapsingRef = useRef(false);

  const expand = useCallback((i: number) => {
    if (collapsingRef.current) return;
    const container = containerRef.current;
    const card = cardRefs.current[i];
    if (!container || !card) return;

    const cRect = container.getBoundingClientRect();
    const kRect = card.getBoundingClientRect();
    const pad = 10; // .cards padding

    // Absolute coords are relative to padding edge, so subtract padding
    const startTop    = kRect.top  - cRect.top  - pad;
    const startLeft   = kRect.left - cRect.left - pad;
    const startWidth  = kRect.width;
    const startHeight = kRect.height;

    setExpandedIndex(i);

    // Start at current position (no transition)
    setFlyStyle({
      position: "absolute",
      top: startTop,
      left: startLeft,
      width: startWidth,
      height: startHeight,
      zIndex: 10,
      transition: "none",
    });

    // Next frame: animate to fill the content area
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyStyle({
          position: "absolute",
          top: 0,
          left: 0,
          width: cRect.width  - pad * 2,
          height: cRect.height - pad * 2,
          zIndex: 10,
          transition: "top 0.45s ease, left 0.45s ease, width 0.45s ease, height 0.45s ease",
        });
      });
    });
  }, []);

  const collapse = useCallback(() => {
    const container = containerRef.current;
    if (expandedIndex === null || !container) return;
    collapsingRef.current = true;

    const cRect = container.getBoundingClientRect();
    const pad = 10; // .cards padding
    const contentWidth = cRect.width - pad * 2;
    const gap = parseFloat(getComputedStyle(container).gap) || 0;
    const cols = block.cards.length;
    const colWidth = (contentWidth - gap * (cols - 1)) / cols;
    const targetLeft = expandedIndex * (colWidth + gap);

    setFlyStyle({
      position: "absolute",
      top: 0,
      left: targetLeft,
      width: colWidth,
      height: cRect.height - pad * 2,
      zIndex: 10,
      transition: "top 0.4s ease, left 0.4s ease, width 0.4s ease, height 0.4s ease",
    });

    setTimeout(() => {
      setExpandedIndex(null);
      setFlyStyle(null);
      collapsingRef.current = false;
    }, 420);
  }, [expandedIndex, block.cards.length]);

  return (
    <div
      ref={containerRef}
      className={`${styles.cards} ${className ?? ""}`}
      style={{ position: "relative" }}
    >
      {block.cards.map((card, i) => {
        const isExpanded = expandedIndex === i;

        return (
          <React.Fragment key={`${block.id}-${i}`}>
            {/* When this card is expanded, an invisible placeholder holds its grid slot */}
            {isExpanded && (
              <div
                ref={placeholderRef}
                className={styles.card}
                style={{ visibility: "hidden" }}
              />
            )}
            <TiltCard
              className={styles.card}
              expanded={isExpanded}
              onExpand={() => expand(i)}
              onCollapse={collapse}
              ref={(el: HTMLDivElement | null) => { cardRefs.current[i] = el; }}
              style={isExpanded && flyStyle ? flyStyle : undefined}
            >
              <h3 className={styles.cardTitle}>
                <ScrollCharReveal>{card.title}</ScrollCharReveal>
              </h3>
              <p className={styles.cardBody}>
                <ScrollCharReveal stagger={2} simple={isMobile}>{nl2br(card.body)}</ScrollCharReveal>
              </p>
            </TiltCard>
          </React.Fragment>
        );
      })}
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
