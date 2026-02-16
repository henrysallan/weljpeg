# Welcome Labs — Site Architecture & Planning Summary

> **Document version:** 2.0  
> **Last updated:** 2026-02-15  
> **Project:** Welcome Labs Agency Website  
> **Stack:** Next.js (React + TypeScript) · Vercel · Sanity CMS (Phase 2)  
> **Design source:** Figma (JSON exports + Figma MCP)

---

## Table of Contents

| #  | Document                                                                  | Description                                                    |
| -- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 01 | [Landing Page](./01-landing-page.md)                                     | Hero/intro screen, logo mark, image squiggle, image cycler, client links, mail icon |
| 02 | [Scroll System & Animations](./02-scroll-system-and-animations.md)       | Lenis + gate system, header sticky-stack, page transitions     |
| 03 | [Section Layout & Content](./03-section-layout-and-content.md)           | Grid layout, content blocks, section headers, tags, data structures, services section |
| 04 | [Responsive & Breakpoints](./04-responsive-and-breakpoints.md)           | Mobile-first breakpoints, layout adaptations, typography scaling, touch, performance |
| 05 | [Header Stack System](./05-header-stack-system.md)                       | Declarative two-phase reconciler, collapse animation, sticky-stack lifecycle |

---

## Project Overview

Welcome Labs is a creative agency. The website is a portfolio-style single-page experience built around **scroll-driven animations** and a minimal, whitespace-heavy aesthetic. The site showcases 3 case studies and a services section, each presented as full-width content modules with a sophisticated header collapse/sticky-stack system. A full-viewport landing page features an interactive animated image layer (ImageSquiggle) behind the content cluster.

---

## Core Design Principles

1. **Whitespace is the design.** The visual identity relies on generous negative space, ultra-light typography (Manrope ExtraLight 200), and restrained colour (near-white background, near-black text).
2. **Scroll is the interaction.** Section header animations are driven by scroll position. The landing→content transition uses a gated snap system.
3. **Performance is non-negotiable.** 60fps sustained during all scroll animations. No jank, no dropped frames, even on mid-range mobile devices.
4. **Mobile is first-class.** The site must feel as polished on an iPhone SE as it does on a 4K monitor.

---

## Technical Stack

| Layer              | Choice            | Rationale                                                  |
| ------------------ | ----------------- | ---------------------------------------------------------- |
| Framework          | **Next.js 16** (App Router) | SSR, image optimisation, Vercel-native deployment     |
| Language           | **TypeScript**    | Type safety for complex scroll state management            |
| UI Library         | **React 19**      | Component model, hooks for animation lifecycle             |
| Animation          | **GSAP + ScrollTrigger** | Scroll-linked header stack reconciliation, hardware-accelerated |
| Smooth scroll      | **Lenis**         | Normalised, buttery scroll with GSAP integration           |
| React/GSAP bridge  | **@gsap/react**   | `useGSAP` hook for safe setup/teardown                     |
| Debug/Tuning       | **Leva**          | Runtime control panel for animation timing & ImageSquiggle params |
| Styling            | **CSS Modules**   | Simple, no runtime cost, full control over animations      |
| Font loading       | **next/font/local** | Self-hosted Manrope variable font (200–800 weight)       |
| CMS (Phase 2)      | **Sanity**        | Structured content, image pipeline, live preview           |
| Deployment         | **Vercel**        | Zero-config Next.js hosting, edge CDN, analytics           |
| Images (Phase 1)   | **Static `/public`** | Bundled with deployment, native `<img>` elements        |

### Dependencies (package.json)

```json
{
  "@gsap/react": "^2.1.2",
  "gsap": "^3.14.2",
  "lenis": "^1.3.17",
  "leva": "^0.10.1",
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

---

## Global Design Tokens

From `globals.css`:

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
  --logo-bar-expanded: 316px;   /* not currently used — logo bar is always collapsed */
  --logo-bar-collapsed: 52px;
  --header-expanded: 74px;
  --header-collapsed: 25.5px;
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

### Responsive padding overrides

```css
@media (max-width: 639px)  { --page-padding: 8px; }
@media (min-width: 640px) and (max-width: 767px) { --page-padding: 20px; }
```

---

## Key Animations Summary

| Animation                        | Trigger                          | Type              | Library / Mechanism          |
| -------------------------------- | -------------------------------- | ----------------- | ---------------------------- |
| Landing → Content gate           | Wheel tick count (≥2) or swipe   | Programmatic snap | Lenis `scrollTo()` + custom gate |
| Content → Landing gate (reverse) | Wheel up near content top        | Programmatic snap | Lenis `scrollTo()` + custom gate |
| Header expand → collapse         | Header reaches stack contact line | Continuous scrub  | ScrollTrigger `onUpdate` + manual reconciler |
| Header dismiss (exit stack)      | 3rd header enters stack          | Scroll-linked     | Driven by incoming header progress |
| Collapsed header click → scroll  | Click on collapsed header        | Programmatic      | Lenis `scrollTo()`           |
| Image hard-cut cycling           | Timer interval (3500ms)          | Interval          | React `useEffect` + `setInterval` |
| ImageSquiggle animation          | Continuous cycle timer           | GSAP tweens       | GSAP Core + requestAnimationFrame |
| Image focus/unfocus              | Click on squiggle image          | GSAP tween        | GSAP Core                    |
| Image drag & throw               | Mouse drag on squiggle image     | Physics RAF loop  | requestAnimationFrame        |
| Logo bar top sep fade            | Logo bar stuck at top            | Scroll-linked     | ScrollTrigger `onUpdate`     |
| Go-up pill visibility            | Gate state change                | State-driven      | Lenis scroll callback        |

---

## Section Inventory

| Section    | Type        | Header title | Tags                        | Content blocks | Status         |
| ---------- | ----------- | ------------ | --------------------------- | -------------- | -------------- |
| Redbull    | Case Study  | "Redbull"    | Strategy, Experiential      | 2              | Images present |
| Uniqlo     | Case Study  | "Uniqlo"     | Strategy, Strategy          | 2              | Images present |
| Puma       | Case Study  | "Puma"       | Strategy, Strategy          | 2              | Placeholder (no images) |
| Services   | Services    | "SERVICES"   | Strategy, Strategy          | 3 (Design, Develop, Distribute) | Placeholder (no images) |
| Contact    | Contact     | —            | —                           | Avatar image   | Implemented    |

---

## Component Map

```
RootLayout (layout.tsx)
├── MailIcon                          (position: fixed, z-index: 100)
│
└── Home (page.tsx)
    ├── ScrollManager                 (invisible — Lenis + gate + header reconciler)
    │
    ├── LandingPage                   (100dvh hero)
    │   ├── ImageSquiggle             (full-viewport animated image layer, z: 0)
    │   │   └── Leva panel            (hidden by default, toggle with "L" key)
    │   └── Cluster (z: 1)
    │       ├── WelcomeLogo (small, 36×31.5)
    │       ├── <h1> title
    │       ├── <p> description (with underlined keywords)
    │       ├── ImageCycler (167×117, hard-cut, 3500ms)
    │       ├── ClientLinks nav (REDBULL, PUMA, UNIQLO)
    │       └── Down arrow SVG
    │
    └── <main id="main-content">
        ├── LogoBar                   (sticky, ~52px, "W" logo + "go up" pill)
        │
        ├── Section (× 4: redbull, uniqlo, puma, services)
        │   ├── SectionHeader
        │   │   ├── Separator (top, conditional)
        │   │   ├── Header row
        │   │   │   ├── <h2> Title
        │   │   │   └── Tags container
        │   │   │       └── TagPill (× 2)
        │   │   └── Separator (bottom)
        │   └── Section content
        │       └── ContentBlock (× 2–3)
        │           ├── Column (left)
        │           └── Column (right)
        │
        └── ContactPage               (100dvh, centred avatar image)
```

---

## Implementation Status

### Phase 1: Structure & Scroll — ✅ Mostly Complete
- [x] Project scaffolding (Next.js + TypeScript)
- [x] Global styles, design tokens, font loading (Manrope, self-hosted variable font)
- [x] Landing page with ImageSquiggle animated background
- [x] Image cycler with hardcoded images (hard-cut, 3500ms)
- [x] Logo bar — always collapsed, CSS sticky (no size interpolation animation)
- [x] Section headers (expanded state, static)
- [x] Content blocks with `fr`-based grid
- [x] Separator lines (0.5px)
- [x] Scroll system: Lenis + custom gate for landing↔content snap
- [x] Header sticky-stack system (declarative two-phase reconciler)
- [x] Collapsed header click-to-scroll
- [x] Responsive breakpoints & mobile layout
- [x] Mail icon (fixed position, links to #section-contact)
- [x] Contact page section with avatar
- [x] Down arrow on landing page
- [x] "Go up" pill button in logo bar
- [x] Logo click → scroll to top
- [x] Hash link interception (client links → gate transition → scroll to section)
- [x] Touch support for gate (swipe detection)
- [x] Leva debug panel for ImageSquiggle + page transition timing
- [ ] Logo bar size interpolation (large → small) — **NOT IMPLEMENTED**
- [ ] `prefers-reduced-motion` — partially implemented (Lenis config only)
- [ ] Performance testing & optimisation

### Phase 2: Content & CMS — Not Started
- [ ] Sanity CMS schema for case studies and services
- [ ] Content migration from hardcoded to Sanity
- [ ] Image pipeline (Sanity CDN, hot-spot cropping)
- [ ] Live preview integration

### Phase 3: Polish & Features — Not Started
- [ ] Tag pill filtering system
- [ ] Page transitions (if multi-page)
- [ ] SEO metadata (basic title/description present)
- [ ] Analytics
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Switch from `<img>` to Next.js `<Image>` for optimisation

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
| GSAP over Framer Motion for scroll      | Superior scrub/pin control, better performance under heavy scroll binding |
| Lenis over native smooth-scroll         | Consistent cross-browser feel, lerp-based smoothing, GSAP sync |
| Custom gate system over GSAP snap       | More control over landing↔content transition, wheel tick counting, touch support |
| `fr` units over strict 8-col grid       | Simpler implementation, `gridTemplateColumns: ${splitLeft}fr ${splitRight}fr` |
| CSS `position: sticky` for logo bar     | No JS needed — always collapsed size, sticks at top naturally |
| Logo bar size interpolation deferred    | Simplified to always-collapsed; large→small animation not yet built |
| Direct `font-size` animation for headers | Simpler than scale-transform approach; performance acceptable |
| CSS Modules for styling                 | No runtime overhead, scoped by default, full control         |
| Self-hosted Manrope variable font       | Performance (no external requests), `next/font/local`        |
| Leva for runtime tuning                 | Rapid iteration on ImageSquiggle params and transition timing |
| `syncTouch: true` in Lenis              | Better touch scroll feel than `smoothTouch: false`           |
| Native `<img>` over Next.js `<Image>`   | Simplicity for Phase 1; will migrate to `<Image>` later     |
| `100dvh` for landing/contact pages      | Handles iOS Safari dynamic viewport correctly                |
| `history.scrollRestoration = 'manual'`  | Prevents browser scroll restore from breaking the gate system |
| Declarative header reconciler           | Solved state drift bugs from previous event-driven approach  |

---

## Open Questions / Future Decisions

| Item                                     | Status       | Notes                                       |
| ---------------------------------------- | ------------ | ------------------------------------------- |
| Logo bar size interpolation              | Deferred     | Currently always collapsed; large→small animation planned but not built |
| Tag pill text content                    | Placeholder  | Redbull has "Strategy" + "Experiential"; others have "Strategy" × 2 |
| Third case study (Puma) content          | Placeholder  | No images yet, empty `src` strings          |
| Services section images                  | Placeholder  | No images yet, empty `src` strings          |
| Contact page behaviour                   | Basic        | Shows avatar image; no form/mailto yet      |
| Footer                                   | Not designed | Not in codebase                             |
| Multi-page routing                       | TBD          | Currently single-page                       |
| Image carousel timing                    | 3500ms       | Implemented, configurable via prop           |
| Max collapsed headers on mobile          | 2 (same as desktop) | May reduce to 1 if vertical space is too tight |
| `prefers-reduced-motion` details         | Partial      | Lenis config respects it; animations do not  |
| Migrate `<img>` to Next.js `<Image>`    | TODO         | For automatic optimisation and responsive `srcset` |
