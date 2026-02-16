"use client";

import { LandingPage } from "@/components/LandingPage";
import { LogoBar } from "@/components/LogoBar";
import { Section } from "@/components/Section";
import { ContactPage } from "@/components/ContactPage";
import { ScrollManager } from "@/components/ScrollManager";
import { CursorEffect } from "@/components/CursorEffect";
import { SelectionBox } from "@/components/SelectionBox";
import { allSections } from "@/lib/data";

export default function Home() {
  return (
    <>
      <ScrollManager />
      <CursorEffect />
      <SelectionBox />

      {/* Landing / Hero */}
      <LandingPage />

      {/* Main Content */}
      <main id="main-content" style={{ position: "relative", zIndex: 3 }}>
        <LogoBar />
        {allSections.map((section, i) => (
          <Section key={section.id} data={section} hideTopSeparator={i === 0} />
        ))}
        <ContactPage />
      </main>
    </>
  );
}