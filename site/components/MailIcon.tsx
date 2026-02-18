"use client";

import React from "react";
import styles from "./MailIcon.module.css";

export const MailIcon: React.FC = () => (
  <a
    href="#section-contact"
    className={styles.mailIcon}
    aria-label="Go to contact"
  >
    <svg
      width="30"
      height="20"
      viewBox="0 0 41 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="40"
        height="29"
        rx="2"
        stroke="var(--color-icon-line)"
      />
      <path
        d="M0.5 7.5L19.6056 17.0528C20.1686 17.3343 20.8314 17.3343 21.3944 17.0528L40.5 7.5"
        stroke="var(--color-icon-line)"
      />
    </svg>
  </a>
);
