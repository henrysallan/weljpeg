# Feature Doc: Landing Page (Hero / Intro Screen)

> **Document version:** 2.0
> **Last updated:** 2025-02-15
> **Figma reference:** `Home Page/Landing page/Screen1`
> **Implementation:** `components/LandingPage.tsx`, `components/ImageSquiggle.tsx`, `components/ImageCycler.tsx`

---

## 1. Overview

The landing page is the first thing a visitor sees. It is a minimal, almost entirely whitespace screen with a small, vertically-stacked content cluster centred in the viewport. Behind the cluster, a full-viewport animated image layer (**ImageSquiggle**) displays Instagram images in configurable animated patterns (arc, linear, scatter-fall). The aesthetic is intentionally restrained -- the negative space **is** the design.

The landing page lives in the normal document flow; the main site content sits directly below it in the DOM. The transition from landing to content is controlled by a **gate system** in `ScrollManager` that requires 2 wheel ticks (or a swipe on mobile) before triggering an eased scroll animation past the landing page. See [02-scroll-system-and-animations.md](./02-scroll-system-and-animations.md).

---

## 2. Visual Anatomy

```
+-----------------------------------------------------------+
|                                              mail icon     |  fixed top-right (in layout.tsx)
|                                                            |
|        ~~~ animated images (ImageSquiggle, z:0) ~~~        |
|                                                            |
|                        ::                                  |  Welcome "W" logo mark (z:1)
|                        Welcome LABS                        |  site title
|                        Introducing new ideas               |
|                        to the culture                      |
|                                                            |
|                        through design, talent,             |  underlined keywords
|                        tools, and distribution.            |
|                                                            |
|                        +--------------+                    |
|                        |  [image]     |                    |  cycling image (ImageCycler)
|                        +--------------+                    |
|                        REDBULL                             |  client links (underlined)
|                        PUMA                                |
|                        UNIQLO                              |
|                                                            |
|                        v (down arrow)                      |  down arrow SVG
|                                                            |
+-----------------------------------------------------------+
```

### 2.1 Dimensions (from code)

| Element                    | Width     | Height    | Notes                                        |
| -------------------------- | --------- | --------- | -------------------------------------------- |
| Landing section            | 100%      | 100dvh    | Full dynamic viewport height                 |
| Content cluster            | 314 px    | auto      | Fixed width, flex column, 22px gap           |
| Logo mark                  | 36 px     | 31.5 px   | SVG, 5-part vector "W" mark                  |
| Site title text            | auto      | ~24 px    | `Welcome LABS` (mixed case)                  |
| Description text           | max 281px | auto      | Multi-line with underlined keywords           |
| Image cycling area         | 167 px    | auto      | Aspect ratio 167/117 via CSS                 |
| Client links               | auto      | auto      | 3 lines, underlined, 4px gap                 |
| Down arrow SVG             | 20 x 28   | --        | Clickable, triggers gate transition           |

### 2.2 Positioning

- **Content cluster:** Centred both horizontally and vertically via flexbox (`align-items: center; justify-content: center`) on the landing section. `z-index: 1` to sit above the ImageSquiggle layer.
- **ImageSquiggle:** `position: absolute; inset: 0` -- fills the entire landing section. `z-index: 0`. `pointer-events: none` on the container, `pointer-events: auto` on individual images.
- **Mail icon:** In `layout.tsx`, not in the landing page component. `position: fixed; top: 0; right: 0; z-index: 100`.

---

## 3. Typography

All text on the landing page uses:

| Property       | Value                  |
| -------------- | ---------------------- |
| Font family    | **Manrope** (variable, self-hosted) |
| Font weight    | **200** (ExtraLight) via CSS `--font-weight` |
| Color          | `#1A1C21` via `--color-text` |

### 3.1 Text Styles (from CSS)

| Element          | Size   | Line height | Transform / Decoration            |
| ---------------- | ------ | ----------- | --------------------------------- |
| Site title       | 20 px  | 24 px       | None (mixed case: "Welcome LABS") |
| Description      | 20 px  | 20 px       | Mixed -- keywords are underlined  |
| Client links     | 20 px  | 24 px       | `text-decoration: underline`, `text-underline-offset: 2px` |
| Down arrow       | --     | --          | SVG, `opacity: 0.5`, hover: `0.8` |

### 3.2 Description Text -- Underlined Keywords

The description reads:

> Introducing new ideas to the culture
> *(blank line)*
> through **design**, **talent**, **tools**, and **distribution**.

The four keywords are wrapped in `<span className={styles.underline}>` with `text-decoration: underline; text-underline-offset: 2px`. There is a `<br /><br />` between the two lines.

**Note:** The original Figma said "We are experts at introducing new ideas..." -- the code uses the shorter "Introducing new ideas to the culture".

---

## 4. Logo Mark

The Welcome "W" logo is a reusable `<WelcomeLogo />` component (SVG, 5 vector paths).

- **Landing page size:** 36 x 31.5 px (props: `width={36} height={31.5}`)
- **Color:** `black` (default prop)
- **Accessibility:** `aria-label="Welcome Labs logo"`, `role="img"`

The same component is reused in the `LogoBar` at a smaller size (24 x ~21px).

---

## 5. Image Cycling / Carousel

### Implementation: `ImageCycler.tsx`

- Displays a single image at a time from a provided array.
- Cycles automatically via `setInterval`.
- **Hard cut** between images -- no crossfade, no slide. Instant swap.
- Images fill the container with `object-fit: cover`.
- Preloads all images on mount to avoid flash-of-empty on swap.

### Props

```tsx
<ImageCycler
  images={string[]}       // array of image paths
  interval={number}       // ms between swaps, default 3500
  className={string}      // optional
/>
```

### Current configuration

```tsx
const LANDING_IMAGES = [
  "/images/redbull_1.png",
  "/images/redbull_2.png",
  "/images/uniqlo_2.png",
  "/images/uniqlo_3.png",
];

<ImageCycler images={LANDING_IMAGES} interval={3500} />
```

Container: 167px wide, aspect ratio `167 / 117` set via CSS.

---

## 6. ImageSquiggle -- Animated Image Background

### Overview

`ImageSquiggle.tsx` is a ~750-line component that creates an animated layer of Instagram images behind the landing page content. It loads image paths from `/images/landingimages/posts.json` and displays them in configurable patterns.

### Key Features

1. **Three animation modes** (selectable via Leva):
   - **Arc** (default) -- images placed along a Catmull-Rom spline curving around viewport centre
   - **Linear** -- images in a left-to-right path with vertical wobble
   - **Scatter** -- images fall continuously from top, parallax-style

2. **Image interaction:**
   - **Hover** -- image scales up (1.35x), pauses falling (scatter mode)
   - **Click** -- focuses image: fades out all others, enlarges clicked image to left side with caption
   - **Drag & throw** -- images can be dragged and thrown with physics (velocity, friction, bounce off edges)

3. **Leva control panel** -- hidden by default, toggled with `L` key. Controls include:
   - Mode selection (arc/linear/scatter)
   - Images per line, min/max image size, curve points
   - Arc settings (span, radius, noise, exclusion zone)
   - Scatter settings (fall speed, spawn interval, batch size)
   - Timing (fade in/out duration, stagger, hold, cycle interval, max opacity)
   - Page transition duration and ease power (synced to `lib/levaConfig.ts`)

4. **Image pool:** Loaded async from `/images/landingimages/posts.json`. Each post has images and optional captions. Captions display when an image is focused.

### Shared Config: `lib/levaConfig.ts`

```typescript
export const transitionConfig = {
  duration: 1.8,
  easePower: 5,
};
```

These values are written by ImageSquiggle's Leva controls and read by `ScrollManager` for the landing-to-content gate transition easing.

---

## 7. Client / Project Links

Three client names rendered as underlined links, stacked vertically with 4px gap:

```
REDBULL
PUMA
UNIQLO
```

- Each is an `<a href="#section-{id}">` link.
- **Click behaviour:** The `ScrollManager` intercepts `#section-*` hash clicks. If on the landing page, it first triggers the gate transition to content, then smooth-scrolls to the target section. If already on content, it scrolls directly.
- **Hover:** `opacity: 0.6` with 0.2s ease transition.

---

## 8. Down Arrow

An inline SVG arrow below the client links:

- **Size:** 20 x 28 px
- **Opacity:** 0.5 (hover: 0.8)
- **ID:** `landing-down-arrow`
- **Click:** Triggers the gate transition immediately (handled in `ScrollManager`)
- **`aria-hidden="true"`**

---

## 9. Mail / Contact Icon

Implemented in `MailIcon.tsx`, rendered in `layout.tsx` (global, not part of landing page).

- **Position:** `position: fixed; top: 0; right: 0`
- **Size:** 52 x 41 px (desktop), 40 x 32 px (mobile < 640px)
- **z-index:** `var(--z-mail-icon)` = 100
- **Link:** `<a href="#section-contact">` -- scrolls to the contact section
- **SVG:** Envelope outline, stroke `#33363F`, border-radius 2px
- **Hover:** `opacity: 0.7` with 0.2s ease transition
- **Background:** `var(--color-bg)` (#F9F9F9)

---

## 10. Landing to Main Content Transition

See [02-scroll-system-and-animations.md](./02-scroll-system-and-animations.md) section 2 for full details.

### Summary

- **Gate system:** Blocks normal scroll on the landing page. Counts wheel ticks (threshold: 2) or detects swipe (threshold: 30px).
- **Animation:** `Lenis.scrollTo(landingHeight)` with custom power easing from `transitionConfig`.
- **Reverse:** Scrolling up near the top of content triggers reverse animation back to landing.
- **Touch:** Single swipe down triggers immediate gate transition.

---

## 11. Colours

| Token                | Hex         | Usage                                  |
| -------------------- | ----------- | -------------------------------------- |
| `--color-bg`         | `#F9F9F9`   | Page background, mail icon background  |
| `--color-text`       | `#1A1C21`   | All body text                          |
| `--color-icon-line`  | `#33363F`   | Mail icon stroke colour                |

---

## 12. Accessibility Notes

- The logo mark has `aria-label="Welcome Labs logo"` and `role="img"`.
- Client links are `<a>` elements within a `<nav aria-label="Featured clients">`.
- The image carousel has `aria-live="polite"`.
- The down arrow has `aria-hidden="true"`.
- The mail icon has `aria-label="Go to contact"`.
- A skip-to-content link exists in `layout.tsx`: `<a href="#main-content" className="sr-only">Skip to main content</a>`.
- Contrast: `#1A1C21` on `#F9F9F9` passes WCAG AA for all text sizes.

---

## 13. Responsive Behaviour

| Breakpoint       | Adaptation                                               |
| ---------------- | -------------------------------------------------------- |
| < 640px          | Cluster left-aligned (`justify-content: flex-start; padding-left: 8px`). Width: `calc(100% - 40px)`, max 314px. Font sizes: `clamp(18px, 5vw, 24px)`. |
| >= 640px         | Cluster centred, 314px fixed width, 20px font size.     |

---

## 14. Component Breakdown

| Component              | File                    | Responsibility                                       |
| ---------------------- | ----------------------- | ---------------------------------------------------- |
| `LandingPage`          | `LandingPage.tsx`       | 100dvh wrapper, centres cluster, hosts ImageSquiggle |
| `WelcomeLogo`          | `WelcomeLogo.tsx`       | Reusable SVG logo mark (accepts width/height/color)  |
| `ImageCycler`          | `ImageCycler.tsx`       | Hard-cut image carousel with preloading              |
| `ImageSquiggle`        | `ImageSquiggle.tsx`     | Full-viewport animated image layer with Leva controls |
| `MailIcon`             | `MailIcon.tsx`          | Fixed-position contact icon (in layout.tsx, not landing) |

**Note:** The original plan had separate `SiteIntro` and `ClientLinks` components. These were not created -- the title, description, and client links are inlined directly in `LandingPage.tsx`.
