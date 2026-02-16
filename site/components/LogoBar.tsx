"use client";

import React from "react";
import { WelcomeLogo } from "./WelcomeLogo";
import { Separator } from "./Separator";
import styles from "./LogoBar.module.css";

interface LogoBarProps {
  className?: string;
}

/**
 * Logo bar -- always collapsed size (41px). Starts in normal
 * document flow. When it reaches the viewport top on scroll,
 * position: sticky keeps it there permanently.
 */
export const LogoBar: React.FC<LogoBarProps> = ({ className }) => {
  const scale = 24;               // change this one number to resize
  const ratio = 36 / 41;          // aspect ratio (h:w = 36:41)

  return (
    <div
      id="logo-bar"
      className={`${styles.logoBar} ${className ?? ""}`}
    >
      <Separator className={styles.topSep} />
      <div className={styles.logoWrap}>
        <button id="logo-home-btn" className={styles.logoBtn} aria-label="Back to top">
          <WelcomeLogo width={scale} height={scale * ratio} />
        </button>
        <button id="go-up-btn" className={styles.goUpPill}>Up</button>
      </div>
      <Separator />
    </div>
  );
};
