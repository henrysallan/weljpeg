"use client";

import React, { useState, useCallback } from "react";
import { ScrollCharReveal } from "./ScrollCharReveal";
import styles from "./ContactPage.module.css";

const EMAIL = "info@welcomejpeg.com";

export const ContactPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      // Modern clipboard API (needs HTTPS + user gesture)
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(EMAIL);
      } else {
        // Fallback for older mobile browsers
        const ta = document.createElement("textarea");
        ta.value = EMAIL;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // If clipboard fails entirely, still show feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // prevent the delayed click / double-tap-to-zoom
    handleCopy();
  }, [handleCopy]);

  return (
    <section id="section-contact" className={styles.contact}>
      <button
        className={styles.emailBtn}
        onClick={handleCopy}
        onTouchEnd={handleTouch}
      >
        <ScrollCharReveal key={copied ? "copied" : "email"}>
          {copied ? "Email Copied" : EMAIL}
        </ScrollCharReveal>
      </button>
    </section>
  );
};
