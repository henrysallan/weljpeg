"use client";

import React from "react";
import { LandingPage } from "@/components/LandingPage";
import { LogoBar } from "@/components/LogoBar";
import { Section } from "@/components/Section";
import { SectionHeader } from "@/components/SectionHeader";
import { ContactPage } from "@/components/ContactPage";
import { ScrollManager } from "@/components/ScrollManager";
import { CursorEffect } from "@/components/CursorEffect";
import { SelectionBox } from "@/components/SelectionBox";
import { allSections, caseStudies } from "@/lib/data";

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
        {allSections.map((section, i) => {
          const isLastCaseStudy =
            section.id === caseStudies[caseStudies.length - 1]?.id;
          return (
            <React.Fragment key={section.id}>
              <Section data={section} hideTopSeparator={i === 0} />
              {isLastCaseStudy && (
                <div style={{ height: 250 }} aria-hidden />
              )}
            </React.Fragment>
          );
        })}
        <ContactPage />
      </main>
    </>
  );
}