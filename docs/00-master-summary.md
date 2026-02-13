# Welcome Labs — Site Architecture & Planning Summary

> **Document version:** 1.0  
> **Last updated:** 2026-02-10  
> **Project:** Welcome Labs Agency Website  
> **Stack:** Next.js (React + TypeScript) · Vercel · Sanity CMS (Phase 2)  
> **Design source:** Figma (JSON exports + Figma MCP)

---

## Table of Contents

| #  | Document                                                                  | Description                                                    |
| -- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 01 | [Landing Page](./01-landing-page.md)                                     | Hero/intro screen, logo mark, image cycler, client links, mail icon |
| 02 | [Scroll System & Animations](./02-scroll-system-and-animations.md)       | GSAP + Lenis setup, logo interpolation, header sticky-stack, snap transitions, performance |
| 03 | [Section Layout & Content](./03-section-layout-and-content.md)           | 8-column grid, content blocks, section headers, tags, data structures, services section |
| 04 | [Responsive & Breakpoints](./04-responsive-and-breakpoints.md)           | Mobile-first breakpoints, layout adaptations, typography scaling, touch, performance |

---

## Project Overview

Welcome Labs is a creative agency. The website is a portfolio-style single-page experience built around **scroll-driven animations** and a minimal, whitespace-heavy aesthetic. The site showcases 3 case studies and a services section, each presented as full-width content modules with a sophisticated header collapse/sticky-stack system.

---

## Core Design Principles

1. **Whitespace is the design.** The visual identity relies on generous negative space, ultra-light typography (Manrope ExtraLight 200), and restrained colour (near-white background, near-black text).
2. **Scroll is the interaction.** Every significant UI transition is driven by scroll position. Animations are continuous, reversible, and scrubbed to the scroll — not triggered-and-forgotten.
3. **Performance is non-negotiable.** 60fps sustained during all scroll animations. No jank, no dropped frames, even on mid-range mobile devices.
4. **Mobile is first-class.** The site must feel as polished on an iPhone SE as it does on a 4K monitor.

---

## Technical Stack

| Layer              | Choice            | Rationale                                                  |
| ------------------ | ----------------- | ---------------------------------------------------------- |
| Framework          | **Next.js** (App Router) | SSR, image optimisation, Vercel-native deployment     |
| Language           | **TypeScript**    | Type safety for complex scroll state management            |
| UI Library         | **React 18+**     | Component model, hooks for animation lifecycle             |
| Animation          | **GSAP + ScrollTrigger** | Best-in-class scroll-linked animation, hardware-accelerated |
| Smooth scroll      | **Lenis**         | Normalised, buttery scroll with GSAP integration           |
| React/GSAP bridge  | **@gsap/react**   | `useGSAP` hook for safe setup/teardown                     |
| Styling            | **CSS Modules** or **vanilla CSS** | Simple, no runtime cost, full control over animations |
| CMS (Phase 2)      | **Sanity**        | Structured content, image pipeline, live preview           |
| Deployment         | **Vercel**        | Zero-config Next.js hosting, edge CDN, analytics           |
| Images (Phase 1)   | **Static `/public`** | Bundled with deployment, Next.js `<Image>` optimised    |

---

## Global Design Tokens

```css
:root {
  /* Colours */
  --color-bg: #F9F9F9;
  --color-text: #1A1C21;
  --color-black: #000000;
  --color-icon-line: #33363F;
  --color-tag-border: #808080;
  --color-tag-bg: #FFFFFF;
  --color-placeholder-image: #C8C8C8;

  /* Typography */
  --font-family: 'Manrope', sans-serif;
  --font-weight: 200;

  /* Spacing */
  --page-padding: 10px;
  --content-width: calc(100vw - 2 * var(--page-padding));
  --grid-columns: 8;
  --grid-gutter: 10px;

  /* Lines */
  --separator-weight: 0.5px;
  --separator-color: var(--color-black);

  /* Dimensions (desktop reference) */
  --logo-bar-expanded: 326px;
  --logo-bar-collapsed: 41px;
  --header-expanded: 74px;
  --header-collapsed: 34.5px;
  --header-title-expanded: 83px;
  --header-title-collapsed: 35.6px;

  /* Z-indices */
  --z-mail-icon: 100;
  --z-logo-bar: 90;
  --z-header-stack-1: 80;
  --z-header-stack-2: 70;
  --z-header-expanded: 60;
  --z-content: 1;
}
```

---

## Key Animations Summary

| Animation                        | Trigger                        | Type         | Library              |
| -------------------------------- | ------------------------------ | ------------ | -------------------- |
| Landing → Content snap           | First scroll from landing page | Snap         | GSAP ScrollTrigger   |
| Logo bar size interpolation      | Scroll through logo bar zone   | Continuous scrub | GSAP ScrollTrigger |
| Header expand → collapse         | Header reaches sticky position | Continuous scrub | GSAP ScrollTrigger |
| Header dismiss (slide behind bar)| 3rd header collapses           | Timed (200ms) | GSAP Core           |
| Collapsed header click → scroll  | Click on collapsed header      | Programmatic | Lenis `scrollTo()`  |
| Image hard-cut cycling           | Timer interval                 | Interval     | React `useEffect`    |

---

## Section Inventory

| Section    | Type        | Header title | Content blocks | Status        |
| ---------- | ----------- | ------------ | -------------- | ------------- |
| Redbull    | Case Study  | "Redbull"    | 2              | Figma complete |
| UNIQLO     | Case Study  | "UNIQLO"     | 2              | Figma complete |
| Puma       | Case Study  | "Puma"       | 2              | Placeholder    |
| Services   | Services    | "Services"   | 3 (Design, Develop, Distribute) | Figma complete |

---

## Component Map

```
App
├── MailIcon                          (global, position: fixed)
├── LandingPage
│   ├── WelcomeLogo (small)
│   ├── SiteIntro (title + description)
│   ├── ImageCycler
│   └── ClientLinks
│
├── MainContent
│   ├── LogoBar
│   │   └── WelcomeLogo (large → small, animated)
│   │
│   ├── Separator
│   │
│   ├── Section (× 4: redbull, uniqlo, puma, services)
│   │   ├── SectionHeader
│   │   │   ├── Title
│   │   │   └── TagPill (× 2)
│   │   ├── Separator
│   │   ├── ContentBlock (× 2–3)
│   │   │   ├── ImageColumn
│   │   │   └── TextColumn / TitledTextColumn
│   │   └── Separator
│   │
│   └── (future: Footer)
│
└── ScrollManager                     (Lenis + GSAP setup, invisible)
```

---

## Implementation Phases

### Phase 1: Structure & Scroll (Current)
- [ ] Project scaffolding (Next.js + TypeScript)
- [ ] Global styles, design tokens, font loading (Manrope)
- [ ] Landing page (static layout, image cycler with hardcoded images)
- [ ] Logo bar with scroll-driven size interpolation
- [ ] Section headers (expanded state, static)
- [ ] Content blocks with 8-column grid
- [ ] Separator lines
- [ ] Scroll system: Lenis + GSAP ScrollTrigger setup
- [ ] Landing → content snap transition
- [ ] Header sticky-stack system (collapse, dismiss, reverse)
- [ ] Collapsed header click-to-scroll
- [ ] Responsive breakpoints & mobile layout
- [ ] Mail icon (static, fixed position)
- [ ] Performance testing & optimisation

### Phase 2: Content & CMS
- [ ] Sanity CMS schema for case studies and services
- [ ] Content migration from hardcoded to Sanity
- [ ] Image pipeline (Sanity CDN, hot-spot cropping)
- [ ] Live preview integration

### Phase 3: Polish & Features
- [ ] Tag pill filtering system
- [ ] Contact/mail interaction
- [ ] Page transitions (if multi-page)
- [ ] SEO metadata
- [ ] Analytics
- [ ] Accessibility audit
- [ ] Cross-browser testing

---

## Performance Targets

| Metric       | Target        |
| ------------ | ------------- |
| FPS (scroll) | 60 sustained  |
| LCP          | < 2.0s        |
| CLS          | < 0.05        |
| TBT          | < 150ms       |
| Animation JS | < 30KB gzip   |

---

## Key Decisions Log

| Decision                                | Rationale                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| GSAP over Framer Motion for scroll      | Superior scrub/pin/snap control, better performance under heavy scroll binding |
| Lenis over native smooth-scroll         | Consistent cross-browser feel, lerp-based smoothing, GSAP sync |
| 8-column grid over 12                   | Matches Figma ratios cleanly, simpler at this content density |
| `transform: scale()` for font animation | Avoids layout thrashing, keeps text rendering crisp at final size |
| CSS custom properties for design tokens | No runtime overhead, works with any styling approach          |
| `smoothTouch: false`                    | Native mobile scrolling feels better than synthetic smoothing |
| Mobile-first CSS                        | Simplifies responsive logic, aligns with mobile priority     |
| Manrope ExtraLight (200) everywhere     | Unified typography, single font weight to load               |

---

## Open Questions / Future Decisions

| Item                                     | Status       | Notes                                       |
| ---------------------------------------- | ------------ | ------------------------------------------- |
| Font file hosting (Google Fonts vs self-host) | To decide  | Self-host recommended for performance        |
| Tag pill text content                    | Placeholder "Strategy" | Will be real category labels from CMS       |
| Third case study (Puma) content          | Placeholder  | Awaiting creative assets                    |
| Contact/mail icon behaviour              | TBD          | Modal? Mailto? Contact page?                |
| Footer                                   | Not designed | Awaiting Figma design                       |
| Multi-page routing                       | TBD          | Currently single-page; may need routes for case study deep-dives |
| Image carousel timing                    | Default 3.5s | Confirm with stakeholder                    |
| Max collapsed headers on mobile          | 2 (same as desktop) | May reduce to 1 if vertical space is too tight |
| `prefers-reduced-motion` details         | Spec'd       | Needs QA pass                               |
