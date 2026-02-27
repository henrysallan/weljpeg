"use client";

import React, { useState } from "react";
import { ScrollCharReveal } from "./ScrollCharReveal";
import { Calendar } from "./Calendar";
import styles from "./ContactPage.module.css";

export const ContactPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const canSend = selectedDate && email.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    setSent(true);
  };

  return (
    <section id="section-contact" className={styles.contact}>
      <div className={styles.inner}>
        {/* Left column — avatar */}
        <div className={styles.leftCol}>
          <p className={styles.heading}>
            <ScrollCharReveal>Talk to Avi:</ScrollCharReveal>
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/avi.jpg"
            alt="Contact"
            className={styles.avatar}
            loading="lazy"
          />
        </div>

        {/* Right column — calendar, inputs, send */}
        <div className={styles.rightCol}>
          <div className={styles.calendarWrap}>
            <Calendar selected={selectedDate} onSelect={setSelectedDate} />
          </div>

          <div className={styles.fields}>
            <input
              type="email"
              className={styles.input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Note"
            />
          </div>

          <button
            className={styles.sendBtn}
            disabled={!canSend}
            onClick={handleSend}
          >
            Send
          </button>

          {sent && (
            <p className={styles.confirmation}>Your invite was sent</p>
          )}
        </div>
      </div>
    </section>
  );
};
