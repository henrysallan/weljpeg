"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import styles from "./ScrollCharReveal.module.css";
import { observe } from "@/lib/sharedObserver";

/* ----------------------------------------------------------------
   Timing
   ---------------------------------------------------------------- */
const CHAR_FADE_MS   = 220;   // per-unit transition duration
const CHAR_TRAVEL    = 5;     // px each unit drifts up
const CHAR_STAGGER   = 12;    // ms between shuffled units (chars)
const WORD_STAGGER   = 18;    // ms between shuffled units (words)

/* ----------------------------------------------------------------
   Utility — Fisher-Yates shuffle for random stagger order
   ---------------------------------------------------------------- */
function buildShuffledSlots(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ----------------------------------------------------------------
   ScrollCharReveal — wraps text, splits into per-char spans,
   animates in/out on scroll via IntersectionObserver.
   ---------------------------------------------------------------- */
interface ScrollCharRevealProps {
  children: React.ReactNode;
  /** Extra class on the outer wrapper */
  className?: string;
  /** Fraction of element visible before triggering (0–1). Default 0.15 */
  threshold?: number;
  /** Root margin for earlier/later triggering. Default "0px 0px -8% 0px" */
  rootMargin?: string;
  /** HTML tag for wrapper. Default "span" */
  as?: keyof React.JSX.IntrinsicElements;
  /** Ms between characters. Default 12 (use ~2 for body text) */
  stagger?: number;
  /** When true, skip per-char splitting — just fade the whole block. */
  simple?: boolean;
  /** Animation granularity: "char" (default) or "word". Word mode creates
   *  far fewer DOM nodes and is better for body copy. */
  mode?: "char" | "word";
}

export const ScrollCharReveal: React.FC<ScrollCharRevealProps> = ({
  children,
  className,
  threshold = 0.15,
  rootMargin = "0px 0px -8% 0px",
  as: Tag = "span" as any,
  stagger = CHAR_STAGGER,
  simple = false,
  mode = "char",
}) => {
  const wrapRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  const isWordMode = mode === "word";

  // Count total units & build shuffled delay slots (stable per mount)
  const { totalUnits, slots } = useMemo(() => {
    if (simple) return { totalUnits: 0, slots: [] as number[] };
    const count = isWordMode ? countWords(children) : countChars(children);
    return { totalUnits: count, slots: buildShuffledSlots(count) };
  }, [children, simple, isWordMode]);

  const effectiveStagger = isWordMode ? (stagger === CHAR_STAGGER ? WORD_STAGGER : stagger) : stagger;

  // IntersectionObserver — toggles visible (shared)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    return observe(el, setVisible, { threshold, rootMargin });
  }, [threshold, rootMargin]);

  // Simple mode: just fade the whole block
  if (simple) {
    return (
      <Tag
        ref={wrapRef}
        className={`${styles.wrap} ${styles.simpleReveal} ${className ?? ""}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
          transition: visible
            ? `opacity ${CHAR_FADE_MS * 2}ms ease-out, transform ${CHAR_FADE_MS * 2}ms ease-out`
            : `opacity 120ms ease-in, transform 120ms ease-in`,
        }}
      >
        {children}
      </Tag>
    );
  }

  // Flatten children into animated spans
  let unitIdx = 0;
  const rendered = isWordMode
    ? flattenWords(children, visible, slots, totalUnits, () => unitIdx++, effectiveStagger)
    : flattenChars(children, visible, slots, totalUnits, () => unitIdx++, effectiveStagger);

  return (
    <Tag
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ""}`}
    >
      {rendered}
    </Tag>
  );
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */

/** Count all text characters recursively */
function countChars(node: React.ReactNode): number {
  if (typeof node === "string") return node.length;
  if (typeof node === "number") return String(node).length;
  if (Array.isArray(node)) return node.reduce((s, c) => s + countChars(c), 0);
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<any>;
    return countChars(el.props.children);
  }
  return 0;
}

/** Count all words recursively (whitespace-separated tokens) */
function countWords(node: React.ReactNode): number {
  if (typeof node === "string") {
    const words = node.match(/\S+/g);
    return words ? words.length : 0;
  }
  if (typeof node === "number") return 1;
  if (Array.isArray(node)) return node.reduce((s, c) => s + countWords(c), 0);
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<any>;
    return countWords(el.props.children);
  }
  return 0;
}

/** Recursively split text nodes into animated word spans */
function flattenWords(
  node: React.ReactNode,
  visible: boolean,
  slots: number[],
  totalWords: number,
  nextIdx: () => number,
  stagger: number,
): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    const str = String(node);
    // Split into words and whitespace tokens
    const tokens = str.match(/\S+|\s+/g) || [];
    return tokens.map((token, tIdx) => {
      if (/^\s+$/.test(token)) {
        // Whitespace — render as-is (inline, no animation needed)
        return <span key={`ws-${tIdx}-${Math.random()}`} style={{ whiteSpace: "pre" }}>{token}</span>;
      }
      // Word token — one animated span per word
      const idx = nextIdx();
      const slot = slots[idx] ?? idx;
      const delay = slot * stagger;
      const show = visible;
      return (
        <span
          key={`w-${idx}`}
          className={styles.char}
          style={{
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
            transition: show
              ? `opacity ${CHAR_FADE_MS}ms ${delay}ms ease-out, transform ${CHAR_FADE_MS}ms ${delay}ms ease-out`
              : `opacity 120ms ease-in, transform 120ms ease-in`,
          }}
        >
          {token}
        </span>
      );
    });
  }

  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<any>;
    if (el.type === "br") return node;
    const kids = React.Children.map(el.props.children, (child) =>
      flattenWords(child, visible, slots, totalWords, nextIdx, stagger),
    );
    return React.cloneElement(el, { ...el.props, key: el.key ?? `wr-${Math.random()}` }, kids);
  }

  if (Array.isArray(node)) {
    return node.map((child) => flattenWords(child, visible, slots, totalWords, nextIdx, stagger));
  }

  return node;
}

/** Recursively split text nodes into animated char spans */
function flattenChars(
  node: React.ReactNode,
  visible: boolean,
  slots: number[],
  totalChars: number,
  nextIdx: () => number,
  stagger: number,
): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    const str = String(node);
    // Split into words and whitespace tokens to preserve word boundaries
    const tokens = str.match(/\S+|\s+/g) || [];
    return tokens.map((token, tIdx) => {
      // Whitespace token — each char gets its own span (no nowrap needed)
      if (/^\s+$/.test(token)) {
        return token.split("").map((ch) => {
          const idx = nextIdx();
          const slot = slots[idx] ?? idx;
          const delay = slot * stagger;
          const show = visible;
          return (
            <span
              key={`ws-${idx}`}
              className={styles.char}
              style={{
                opacity: show ? 1 : 0,
                transform: show ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
                transition: show
                  ? `opacity ${CHAR_FADE_MS}ms ${delay}ms ease-out, transform ${CHAR_FADE_MS}ms ${delay}ms ease-out`
                  : `opacity 120ms ease-in, transform 120ms ease-in`,
                whiteSpace: "pre",
              }}
            >
              {ch}
            </span>
          );
        });
      }
      // Word token — wrap chars in a nowrap span to prevent mid-word breaks
      const charSpans = token.split("").map((ch) => {
        const idx = nextIdx();
        const slot = slots[idx] ?? idx;
        const delay = slot * stagger;
        const show = visible;
        return (
          <span
            key={idx}
            className={styles.char}
            style={{
              opacity: show ? 1 : 0,
              transform: show ? "translateY(0)" : `translateY(${CHAR_TRAVEL}px)`,
              transition: show
                ? `opacity ${CHAR_FADE_MS}ms ${delay}ms ease-out, transform ${CHAR_FADE_MS}ms ${delay}ms ease-out`
                : `opacity 120ms ease-in, transform 120ms ease-in`,
            }}
          >
            {ch}
          </span>
        );
      });
      return (
        <span key={`word-${tIdx}`} style={{ whiteSpace: "nowrap" }}>
          {charSpans}
        </span>
      );
    });
  }

  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<any>;
    if (el.type === "br") return node;
    const kids = React.Children.map(el.props.children, (child) =>
      flattenChars(child, visible, slots, totalChars, nextIdx, stagger),
    );
    return React.cloneElement(el, { ...el.props, key: el.key ?? `cr-${Math.random()}` }, kids);
  }

  if (Array.isArray(node)) {
    return node.map((child) => flattenChars(child, visible, slots, totalChars, nextIdx, stagger));
  }

  return node;
}
