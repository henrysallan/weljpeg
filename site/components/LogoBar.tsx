"use client";

import React from "react";
import { WelcomeLogo } from "./WelcomeLogo";
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
  return (
    <div
      id="logo-bar"
      className={`${styles.logoBar} ${className ?? ""}`}
    >
      <WelcomeLogo width={41} height={36} />
    </div>
  );
};
