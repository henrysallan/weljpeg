"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./PasswordGate.module.css";

const PASS = "jake";
const STORAGE_KEY = "wl_auth";

export const PasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [fading, setFading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setAuthed(true);
    } else {
      setAuthed(false);
    }
  }, []);

  // Auto-focus the input
  useEffect(() => {
    if (authed === false) inputRef.current?.focus();
  }, [authed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.toLowerCase().trim() === PASS) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setFading(true);
      setTimeout(() => setAuthed(true), 400);
    } else {
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 2000);
    }
  };

  // Always render children so ScrollManager/LandingPage mount on first frame.
  // Overlay sits on top until authenticated.
  const showGate = authed === null || authed === false;

  return (
    <>
      {children}
      {showGate && !fading && (
        <div className={styles.overlay}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={styles.input}
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Password"
              autoComplete="off"
            />
            <span className={styles.error}>{error ? "Try again" : ""}</span>
          </form>
        </div>
      )}
      {fading && (
        <div className={`${styles.overlay} ${styles.hidden}`} />
      )}
    </>
  );
};
