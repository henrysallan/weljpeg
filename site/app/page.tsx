"use client";

import { LandingPage } from "@/components/LandingPage";
import { LogoBar } from "@/components/LogoBar";
import { Section } from "@/components/Section";
import { ContactPage } from "@/components/ContactPage";
import { ScrollManager } from "@/components/ScrollManager";
import { allSections } from "@/lib/data";

export default function Home() {
  return (
    <>
      <ScrollManager />

      {/* Landing / Hero */}
      <LandingPage />

      {/* Main Content */}
      <main id="main-content">
        <LogoBar />
        {allSections.map((section, i) => (
          <Section key={section.id} data={section} hideTopSeparator={i === 0} />
        ))}
        <ContactPage />
      </main>
    </>
  );
}