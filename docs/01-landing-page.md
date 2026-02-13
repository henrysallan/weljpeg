# Feature Doc: Landing Page (Hero / Intro Screen)

> **Document version:** 1.0  
> **Last updated:** 2026-02-10  
> **Figma reference:** `Home Page/Landing page/Screen1`

---

## 1. Overview

The landing page is the first thing a visitor sees. It is a minimal, almost entirely whitespace screen with a small, vertically-stacked content cluster positioned roughly centre-screen (horizontally centred, vertically ~28 % from top on a 1728 × 1109 viewport). The aesthetic is intentionally restrained — the negative space **is** the design.

The landing page lives in the normal document flow; the main site content sits directly below it in the DOM. However, the *experience* of transitioning from the landing page to the main content is **not** a free scroll — it is an **automated, eased scroll animation** that snaps the viewport cleanly to the top of the main content area (see [02-scroll-system-and-animations.md](./02-scroll-system-and-animations.md)).

---

## 2. Visual Anatomy

```
┌─────────────────────────────────────────────────────────┐
│                                              ✉ (mail)   │  ← sticky top-right
│                                                         │
│                                                         │
│                                                         │
│                        ∷∷                               │  ← Welcome "W" logo mark
│                        WELCOME LABS                     │  ← site title
│                        We are experts at                │
│                        introducing new ideas            │
│                        to the culture                   │
│                                                         │
│                        through design, talent,          │  ← underlined keywords
│                        tools, and distribution.         │
│                                                         │
│                        ┌──────────────┐                 │
│                        │  [image]     │                 │  ← cycling image
│                        └──────────────┘                 │
│                        REDBULL                          │  ← client links (underlined)
│                        PUMA                             │
│                        EBAY                             │
│                                                         │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Dimensions (from Figma, at 1728 px viewport)

| Element                    | Width     | Height    | Notes                                        |
| -------------------------- | --------- | --------- | -------------------------------------------- |
| Viewport / frame           | 1728 px   | 1109 px   | Full-viewport landing page                   |
| Body / main section        | 314 px    | ~443 px   | Auto-height, 314 px fixed width              |
| Logo mark                  | 36 px     | 31.5 px   | SVG, 5-part vector "W" mark                  |
| Site title text            | 314 px    | ~18 px    | `WELCOME LABS` (uppercase)                   |
| Description text           | 281 px    | ~131 px   | Multi-line with underlined keywords           |
| Image cycling area         | ~167 px   | ~117 px   | Aspect ratio ≈ 1.42 : 1                     |
| Client links               | 314 px    | ~65 px    | 3 lines, underlined, small-caps forced       |
| Mail icon (top-right)      | 52 × 41   | —         | Envelope icon, sticky                        |

### 2.2 Positioning

- **Body cluster:** Horizontally centred in the viewport. Vertically positioned at approximately 28 % from the top edge (315 px at 1109 px viewport height). On different viewport sizes this should remain visually centred — use flexbox centering rather than absolute pixel offsets.
- **Mail icon:** Fixed to the **top-right** corner of the viewport. Persists across **all** scroll states and all pages. `position: fixed; top: ~7px; right: ~8px;` (adjust with design tokens). `z-index` must be above all other stacking contexts.

---

## 3. Typography

All text on the landing page (and the entire site) uses:

| Property       | Value                  |
| -------------- | ---------------------- |
| Font family    | **Manrope**            |
| Font weight    | **200** (ExtraLight)   |
| Color          | `#1A1C21`              |

### 3.1 Text Styles

| Element          | Size   | Line height | Transform / Decoration            |
| ---------------- | ------ | ----------- | --------------------------------- |
| Site title       | 24 px  | 24 px       | `text-transform: uppercase`       |
| Description      | 24 px  | 20 px       | Mixed — keywords are underlined   |
| Client links     | 24 px  | 24 px       | `text-decoration: underline`, `font-variant: small-caps` |

### 3.2 Description Text — Underlined Keywords

The description sentence contains **four underlined keywords** that act as semantic anchors (and may become navigation links later):

> We are experts at introducing new ideas to the culture  
> through **design**, **talent**, **tools**, and **distribution**.

"design", "talent", "tools", "distribution" are rendered with `text-decoration: underline`. The rest of the sentence is plain. There is a deliberate line break after "culture" and before "through".

---

## 4. Logo Mark

The Welcome "W" logo is an SVG composed of 5 vector paths forming a stylised "W" shape. It is rendered in `#000000` (black).

- **Landing page size:** 36 × 31.5 px  
- This is the **small** version of the logo; on the main content area the logo appears at a much larger size (~350 px wide) in the top bar before collapsing back down (see scroll system doc).
- The logo SVG should be a reusable `<WelcomeLogo />` component that accepts a `size` or `scale` prop for the scroll-driven resize animation.

---

## 5. Image Cycling / Carousel

### Behaviour

- Displays a single image at a time from a provided set.
- Cycles automatically on a timer.
- **Hard cut** between images — no crossfade, no slide, no animated transition. Instant swap.
- Images fill the container with `object-fit: cover`.

### Implementation Notes

- Container: ~167 × 117 px (aspect ratio ~1.42:1). Should be responsive.
- Timer interval: TBD (recommend 3–4 seconds as default, make configurable).
- Images will be provided as static assets bundled in the deployment.
- Preload all images in the set to avoid flash-of-empty on swap.
- Later: images will come from Sanity CMS.

### Component API (Planned)

```
<ImageCycler
  images={string[]}       // array of image paths
  interval={number}       // ms between swaps, default 3500
  aspectRatio="167/117"   // or use CSS aspect-ratio
/>
```

---

## 6. Client / Project Links

Three client names rendered as underlined small-caps text, stacked vertically:

```
REDBULL
PUMA
EBAY
```

- Each line is a clickable link that will eventually navigate to the corresponding case study section (smooth-scroll to that section's header).
- For now: clicking a client name smooth-scrolls the page to the corresponding section header in the main content area below.
- Hover state: TBD (recommend a subtle opacity shift or underline thickness change).

---

## 7. Mail / Contact Icon

- **Asset:** Envelope/mail SVG icon (to be provided).
- **Position:** `position: fixed`, top-right corner of viewport.
- **Persistence:** Always visible across all scroll states, all sections.
- **z-index:** Must be the highest in the stacking order (above sticky headers, above everything).
- **Interaction:** TBD — likely opens a contact modal or mailto link.
- **Visual:** Outlined rectangle with a fold line, stroke color `#33363F`, stroke weight 1px, border-radius 2px, on a `#F9F9F9` background pill (52 × 41 px).

---

## 8. Landing → Main Content Transition

This is the critical handoff from the landing page to the main content.

### Trigger
The user scrolls down (any scroll input: wheel, trackpad, touch, keyboard).

### Behaviour
1. The **first scroll event** (or accumulated scroll delta past a small threshold) triggers an **automated, eased scroll animation** that moves the viewport from the landing page to the top of the main content area.
2. The animation uses an **ease-out** (or custom cubic-bezier) curve for a smooth, decelerating feel.
3. During this animated scroll, the landing page content scrolls up naturally — it is in the DOM above the main content.
4. At the end of the animation, the viewport is perfectly aligned with the top of the main content section.
5. **Scroll-jacking is limited to this single transition.** Once the user is in the main content area, scrolling behaves naturally (with the scroll-driven animations described in the scroll system doc).

### Reverse
- Scrolling back up from the very top of the main content area triggers the reverse: an eased scroll animation back to the landing page.
- This should also be a single triggered animation, not free-scroll.

### Technical Approach
- Use a scroll-snap or programmatic `scrollTo` with `behavior: 'smooth'` enhanced by a custom easing function.
- Recommended: GSAP `ScrollToPlugin` for precise easing control, or Lenis for the global smooth-scroll wrapper with a scroll-snap zone defined for this section boundary.
- See [02-scroll-system-and-animations.md](./02-scroll-system-and-animations.md) for full scroll library recommendations.

---

## 9. Colours

| Token                | Hex         | Usage                                  |
| -------------------- | ----------- | -------------------------------------- |
| `--color-bg`         | `#F9F9F9`   | Page background, mail icon background  |
| `--color-text`       | `#1A1C21`   | All body text                          |
| `--color-icon-line`  | `#33363F`   | Mail icon stroke colour                |

---

## 10. Accessibility Notes

- The logo mark must have an appropriate `aria-label` ("Welcome Labs logo").
- Client links must be `<a>` elements (or `<button>`) with meaningful labels.
- The image carousel should have `aria-live="polite"` or equivalent so screen readers are notified of image changes.
- Ensure sufficient contrast: `#1A1C21` on `#F9F9F9` passes WCAG AA for all text sizes used here.
- The mail icon should have an `aria-label` ("Contact" or "Email us").

---

## 11. Component Breakdown (Planned)

| Component              | Responsibility                                       |
| ---------------------- | ---------------------------------------------------- |
| `LandingPage`          | Full-viewport wrapper, centres the body cluster      |
| `WelcomeLogo`          | Scalable SVG logo mark                               |
| `SiteIntro`            | Title + description text block                       |
| `ImageCycler`          | Hard-cut image carousel                              |
| `ClientLinks`          | Stacked list of client name links                    |
| `MailIcon`             | Fixed-position contact icon (global, not in landing) |
