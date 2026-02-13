"use client";

import React from "react";
import { WelcomeLogo } from "./WelcomeLogo";
import { ImageCycler } from "./ImageCycler";
import { ImageSquiggle } from "./ImageSquiggle";
import styles from "./LandingPage.module.css";

const LANDING_IMAGES = [
  "/images/redbull_1.png",
  "/images/redbull_2.png",
  "/images/uniqlo_2.png",
  "/images/uniqlo_3.png",
];

export const LandingPage: React.FC = () => {
  return (
    <section id="landing-page" className={styles.landing}>
      <ImageSquiggle />
      <div className={styles.cluster}>
        <WelcomeLogo className={styles.logo} width={36} height={31.5} />

        <h1 className={styles.title}>Welcome LABS</h1>

        <p className={styles.description}>
          Introducing new ideas to the culture
          <br />
          <br />
          through{" "}
          <span className={styles.underline}>design</span>,{" "}
          <span className={styles.underline}>talent</span>,{" "}
          <span className={styles.underline}>tools</span>, and{" "}
          <span className={styles.underline}>distribution</span>.
        </p>

        <div className={styles.imageCyclerWrap}>
          <ImageCycler images={LANDING_IMAGES} interval={3500} />
        </div>

        <nav className={styles.clientLinks} aria-label="Featured clients">
          <a href="#section-redbull" className={styles.clientLink}>
            REDBULL
          </a>
          <a href="#section-puma" className={styles.clientLink}>
            PUMA
          </a>
          <a href="#section-uniqlo" className={styles.clientLink}>
            UNIQLO
          </a>
        </nav>

        <svg
          id="landing-down-arrow"
          className={styles.downArrow}
          width="20"
          height="28"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 1 L10 25 M3 19 L10 26 L17 19"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
};
