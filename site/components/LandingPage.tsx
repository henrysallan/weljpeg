"use client";

import React from "react";
import { WelcomeLogo } from "./WelcomeLogo";
import { ImageCycler } from "./ImageCycler";
import styles from "./LandingPage.module.css";

const LANDING_IMAGES = [
  "/images/redbull-01.svg",
  "/images/redbull-02.svg",
  "/images/uniqlo-01.svg",
  "/images/uniqlo-02.svg",
];

export const LandingPage: React.FC = () => {
  return (
    <section id="landing-page" className={styles.landing}>
      <div className={styles.cluster}>
        <WelcomeLogo className={styles.logo} width={36} height={31.5} />

        <h1 className={styles.title}>Welcome LABS</h1>

        <p className={styles.description}>
          We are experts at introducing new ideas to the culture
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
      </div>
    </section>
  );
};
