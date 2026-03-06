"use client";

import React, { useState, useCallback } from "react";
import { ScrollCharReveal } from "./ScrollCharReveal";
import styles from "./ContactPage.module.css";

const EMAIL = "info@welcomejpeg.com";

export const ContactPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <section id="section-contact" className={styles.contact}>
      <button className={styles.emailBtn} onClick={handleCopy}>
        <ScrollCharReveal key={copied ? "copied" : "email"}>
          {copied ? "Email Copied" : EMAIL}
        </ScrollCharReveal>
      </button>
    </section>
  );
};
