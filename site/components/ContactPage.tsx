"use client";

import React from "react";
import styles from "./ContactPage.module.css";

export const ContactPage: React.FC = () => {
  return (
    <section id="section-contact" className={styles.contact}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/avi.png"
        alt="Contact"
        className={styles.avatar}
        loading="lazy"
      />
    </section>
  );
};
