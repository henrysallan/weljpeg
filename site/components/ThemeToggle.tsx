"use client";

import { useEffect } from "react";

/**
 * Invisible component — press "D" to toggle dark mode.
 * Sets `data-theme="dark"` on <html>, which flips all CSS custom properties.
 */
export const ThemeToggle: React.FC = () => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        const html = document.documentElement;
        const next = html.getAttribute("data-theme") === "dark" ? "" : "dark";
        html.setAttribute("data-theme", next);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return null;
};
