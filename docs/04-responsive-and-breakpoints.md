# Feature Doc: Responsive Design & Breakpoints

> **Document version:** 1.0  
> **Last updated:** 2026-02-10  
> **Figma reference:** Desktop designs at 1728 px. Mobile designs TBD.

---

## 1. Overview

The Welcome Labs site must be fully responsive, with **mobile as a high priority**. The desktop Figma (1728 px) is the reference design. The site should scale gracefully down to 320 px viewport width.

The core design philosophy translates cleanly to smaller screens — minimalist typography, generous whitespace, full-width content blocks. The main adaptation is the **content block layout shift** from 2-column to single-column stacked.

---

## 2. Breakpoint System

We use a **mobile-first** approach: base styles target the smallest screens, with `min-width` media queries layering in complexity.

| Token            | Width       | Target devices                           |
| ---------------- | ----------- | ---------------------------------------- |
| `--bp-sm`        | 640 px      | Large phones (landscape), small tablets  |
| `--bp-md`        | 768 px      | Tablets (portrait)                       |
| `--bp-lg`        | 1024 px     | Tablets (landscape), small laptops       |
| `--bp-xl`        | 1280 px     | Laptops, smaller desktops                |
| `--bp-2xl`       | 1536 px     | Large desktops                           |
| `--bp-3xl`       | 1728 px     | Reference design width (Figma)           |

### CSS Custom Properties

```css
:root {
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;
  --bp-3xl: 1728px;
}
```

Or, if using Tailwind-style classes, these map to Tailwind's default breakpoints (with `3xl` added).

---

## 3. Layout Adaptations by Breakpoint

### 3.1 Content Blocks (Case Studies & Services)

This is the **primary** responsive change.

| Breakpoint       | Columns      | Behaviour                                              |
| ---------------- | ------------ | ------------------------------------------------------ |
| < `md` (768px)   | **1 column** | Left and right content stack vertically. Image on top, text below (or vice-versa based on content type). |
| ≥ `md` (768px)   | **2 columns** | Side-by-side layout using the 8-column grid.           |

#### Stacking order (mobile, single-column):

- **Image + Text block:** Image first, text below.
- **Text + Image block:** Image first, text below. (Images always take visual priority on mobile.)
- **Titled-text + Image block (services):** Sub-heading and text first, image below. (Text content takes priority for services since the sub-heading provides context.)

The stacking order can be controlled with CSS `order` or by conditionally rendering based on breakpoint.

### 3.2 Section Headers

| Breakpoint       | Header title size | Collapsed title size | Tag pills       |
| ---------------- | ----------------- | -------------------- | --------------- |
| < `sm` (640px)   | 40 px             | 24 px                | Hidden or below title |
| `sm`–`md`        | 55 px             | 28 px                | Beside title, single row |
| `md`–`lg`        | 65 px             | 32 px                | Beside title    |
| ≥ `lg` (1024px)  | 83 px             | ~35.6 px             | Full Figma layout |

The header heights scale proportionally:
- Expanded height: scales from ~50px (mobile) to 74px (desktop).
- Collapsed height: scales from ~28px (mobile) to 34.5px (desktop).

**Font-size scaling approach:** Use `clamp()` for fluid typography:

```css
.section-header__title {
  font-size: clamp(40px, 5vw, 83px);
}

.section-header__title--collapsed {
  font-size: clamp(24px, 2.5vw, 35.6px);
}
```

### 3.3 Logo Bar

| Breakpoint       | Expanded height | Collapsed height | Logo size (expanded) |
| ---------------- | --------------- | ---------------- | -------------------- |
| < `sm` (640px)   | ~120 px         | ~36 px           | ~130 × 113 px       |
| `sm`–`lg`        | ~200 px         | ~38 px           | ~220 × 192 px       |
| ≥ `lg` (1024px)  | ~326 px         | ~41 px           | ~350 × 306 px       |

Use `clamp()` or viewport-relative units:

```css
.logo-bar {
  height: clamp(120px, 20vw, 326px);
}

.logo-bar--collapsed {
  height: clamp(36px, 3vw, 41px);
}
```

### 3.4 Landing Page

The landing page content cluster is **already small** (314 px wide) and naturally fits mobile screens.

| Breakpoint       | Adaptation                                               |
| ---------------- | -------------------------------------------------------- |
| < `sm` (640px)   | Cluster horizontally centred, margins: 20px. Full width minus 40px padding. Logo mark, text, image, links all stack identically. |
| `sm`–`lg`        | Cluster centred, max-width 314px.                        |
| ≥ `lg` (1024px)  | Cluster centred with Figma positioning (~41.7% from left). |

The image carousel scales proportionally — maintain aspect ratio (1.42:1).

### 3.5 Mail Icon

| Breakpoint       | Size           | Position                |
| ---------------- | -------------- | ----------------------- |
| < `sm` (640px)   | 40 × 32 px    | `top: 5px; right: 5px` |
| ≥ `sm`           | 52 × 41 px    | `top: 7px; right: 8px` |

Always `position: fixed`, always highest z-index.

---

## 4. Grid System at Each Breakpoint

### 4.1 Container

| Breakpoint       | Container width | Padding (each side) |
| ---------------- | --------------- | ------------------- |
| < `sm` (640px)   | 100%            | 16 px               |
| `sm`–`md`        | 100%            | 20 px               |
| `md`–`lg`        | 100%            | 10 px               |
| ≥ `lg` (1024px)  | 100%            | 10 px               |
| ≥ `3xl` (1728px) | 1728 px (max)   | 10 px               |

At the reference width (1728px), the content area is 1708px (1728 - 2×10).

### 4.2 Column Grid

| Breakpoint       | Columns | Gutter | Notes                                   |
| ---------------- | ------- | ------ | --------------------------------------- |
| < `md` (768px)   | 1       | —      | Single column, full width               |
| `md`–`lg`        | 8       | 8 px   | Slightly tighter gutters                |
| ≥ `lg` (1024px)  | 8       | 10 px  | Full Figma spec                         |

When in single-column mode, the 8-column split ratio is ignored — everything is full width.

---

## 5. Scroll Behaviour on Mobile

### 5.1 Smooth Scroll

- **Lenis `smoothTouch: false`** — preserve native iOS/Android momentum scrolling. This is critical for a native feel on mobile.
- The landing→content snap transition still works on mobile but should use native `scroll-behavior: smooth` or a short `scrollTo` animation rather than Lenis smooth.

### 5.2 Header Sticky Stack

The sticky header system works identically on mobile:
- Logo bar sticks at top.
- Maximum 2 collapsed headers below it.
- Same dismiss/restore lifecycle.

**However**, consider the vertical space budget on mobile:
- Logo bar collapsed: ~36px
- Collapsed header 1: ~28px
- Collapsed header 2: ~28px
- **Total sticky area:** ~92px

On a 667px viewport (iPhone SE), that's ~13.8% of the screen dedicated to sticky elements. This is acceptable but tight. If it feels too heavy, we can reduce to **1 collapsed header max** on viewports < 640px. Flag this for user testing.

### 5.3 Collapsed Header Click

Tapping a collapsed header on mobile triggers the same smooth-scroll-to-section behaviour. Ensure the tap target is at least 44px tall (the collapsed header at ~28px may need padding increase to meet accessibility guidelines on mobile).

---

## 6. Typography Scaling

All typography uses `clamp()` for fluid scaling between mobile and desktop.

| Element                   | Mobile (320px) | Desktop (1728px) | `clamp()` value                       |
| ------------------------- | -------------- | ---------------- | ------------------------------------- |
| Landing title             | 18 px          | 24 px            | `clamp(18px, 1.5vw, 24px)`           |
| Landing description       | 18 px          | 24 px            | `clamp(18px, 1.5vw, 24px)`           |
| Section header (expanded) | 40 px          | 83 px            | `clamp(40px, 5vw, 83px)`             |
| Section header (collapsed)| 24 px          | 35.6 px          | `clamp(24px, 2.5vw, 35.6px)`         |
| Body text                 | 14 px          | 15 px            | `clamp(14px, 1vw, 15px)`             |
| Services sub-heading      | 36 px          | 65 px            | `clamp(36px, 4vw, 65px)`             |

**Line heights** scale proportionally. Use unitless line-height ratios where possible:
- Body text: `line-height: 1.13` (17/15)
- Section headers: `line-height: 1.33` (110.8/83)

---

## 7. Image Handling

### 7.1 Responsive Images

Use Next.js `<Image>` component with:
- `fill` mode with `object-fit: cover` for content block images.
- `sizes` attribute to serve appropriate resolution:

```tsx
<Image
  src="/images/redbull-01.jpg"
  alt="Redbull campaign"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover' }}
/>
```

### 7.2 Aspect Ratios

In single-column mode (mobile), images should maintain meaningful aspect ratios rather than filling arbitrary heights:

| Image context              | Desktop aspect ratio    | Mobile aspect ratio    |
| -------------------------- | ----------------------- | ---------------------- |
| Case study content image   | Determined by content   | 16:9 or 3:2           |
| Services placeholder       | ~1.18:1 (767×649)      | 16:9                   |
| Landing page carousel      | ~1.42:1 (167×117)      | ~1.42:1 (maintain)     |

Use CSS `aspect-ratio` property for consistent rendering.

---

## 8. Touch Interactions

| Element                | Desktop interaction    | Mobile interaction     |
| ---------------------- | ---------------------- | ---------------------- |
| Client links (landing) | Click → scroll to section | Tap → scroll to section |
| Collapsed header       | Click → scroll to section | Tap → scroll to section |
| Tag pills              | Future: click filter   | Future: tap filter     |
| Mail icon              | Click → contact        | Tap → contact          |
| Image carousel         | Auto-cycle             | Auto-cycle (same)      |

No swipe gestures are needed for Phase 1. The image carousel on the landing page uses hard cuts on a timer, not swipe navigation.

---

## 9. Performance Considerations for Mobile

1. **Reduce image sizes aggressively.** Mobile images should be served at ≤ 750px wide (via `sizes` + Next.js image optimization).
2. **Reduce animation complexity if needed.** If scroll-driven animations drop below 60fps on mid-range Android devices, degrade gracefully:
   - Reduce `scrub` smoothing (less interpolation work per frame).
   - Simplify the header collapse to a CSS transition (triggered once) rather than continuous scrub.
3. **Test on real devices:** iPhone SE (small), iPhone 14 Pro (medium), Samsung Galaxy A-series (mid-range Android).
4. **Avoid layout shifts.** Pre-allocate heights for images using `aspect-ratio` to prevent CLS during lazy-load.
5. **`content-visibility: auto`** on off-screen sections to reduce initial rendering cost.

---

## 10. Scroll Trigger Recalculation

When the viewport resizes (orientation change, virtual keyboard, responsive changes):
- All GSAP ScrollTrigger instances must recalculate their start/end positions.
- Use `ScrollTrigger.refresh()` debounced to 200ms after resize events.
- Lenis must also be updated: `lenis.resize()`.
- Test thoroughly with iOS Safari's dynamic viewport (address bar show/hide).

### Dynamic Viewport Units

Use `dvh` (dynamic viewport height) instead of `vh` for the landing page height to account for iOS Safari's collapsible address bar:

```css
.landing-page {
  height: 100dvh;
}
```

Fallback for older browsers:
```css
.landing-page {
  height: 100vh;
  height: 100dvh;
}
```

---

## 11. Summary: What Changes on Mobile

| Feature                    | Desktop                          | Mobile (< 768px)                      |
| -------------------------- | -------------------------------- | ------------------------------------- |
| Content blocks             | 2-column (8-col grid)            | 1-column stacked                      |
| Section header font        | 83px                             | 40–55px (fluid)                       |
| Logo bar expanded          | ~326px tall                      | ~120px tall                           |
| Smooth scroll              | Lenis (lerp-based)               | Native (smoothTouch: false)           |
| Sticky header count        | Max 2 collapsed                  | Max 2 (consider 1 for very small)     |
| Images                     | Side-by-side with text           | Full-width, stacked above text        |
| Landing page               | Centred cluster, lots of space   | Centred cluster, less whitespace      |
| Tag pills                  | Beside header title              | Below or beside (responsive)          |
| Separator lines            | 0.5px, full content width        | 0.5px, full width (same)             |
