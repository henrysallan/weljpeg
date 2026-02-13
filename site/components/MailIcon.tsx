"use client";

import React from "react";
import styles from "./MailIcon.module.css";

export const MailIcon: React.FC = () => (
  <a
    href="mailto:hello@welcomelabs.com"
    className={styles.mailIcon}
    aria-label="Contact us via email"
  >
    <svg
      width="41"
      height="30"
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
        stroke="#33363F"
      />
      <path
        d="M0.5 7.5L19.6056 17.0528C20.1686 17.3343 20.8314 17.3343 21.3944 17.0528L40.5 7.5"
        stroke="#33363F"
      />
    </svg>
  </a>
);
