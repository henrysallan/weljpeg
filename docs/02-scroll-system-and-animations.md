# Feature Doc: Scroll System & Animations

> **Document version:** 1.0  
> **Last updated:** 2026-02-10  
> **Figma references:**  
> - `Full page flow: Initial Scroll State`  
> - `Full page flow: Scroll State 1 - logo and nav collapses`  
> - `Full page flow: Scroll State 2 project 1 collapses to thinner entry row`

---

## 1. Overview

The scroll system is the centrepiece of the Welcome Labs site. It drives three interconnected animation behaviours:

1. **Landing → Main Content snap transition** (section boundary scroll-snap)
2. **Logo bar continuous size interpolation** (large logo → small logo as user scrolls)
3. **Section header sticky-stack with collapse/dismiss cycle** (headers collapse, stack, and age out)

All animations must be **buttery smooth at 60 fps**, visually precise, and **fully reversible** — scrolling back up must undo every transformation identically.

---

## 2. Library Recommendations

### 2.1 Primary Recommendation: GSAP + ScrollTrigger

**GSAP** (GreenSock Animation Platform) with the **ScrollTrigger** plugin is the strongest choice for this project.

| Criterion                  | GSAP + ScrollTrigger                                                |
| -------------------------- | ------------------------------------------------------------------- |
| **Scroll-linked animation** | First-class. `ScrollTrigger.create()` binds any tween to scroll position with `scrub` for continuous interpolation. |
| **Performance**             | Hardware-accelerated, batches reads/writes, uses `will-change` and compositor-friendly transforms (`translate3d`, `scale`). Sub-frame interpolation with `scrub: true` or `scrub: 0.5` (smoothed). |
| **Reversibility**           | Built-in. All tweens reverse naturally when scroll direction reverses. |
| **Snap**                    | `snap` config on ScrollTrigger for the landing→content transition. |
| **Ecosystem**               | Mature, battle-tested, huge community, excellent React integration via `@gsap/react` with `useGSAP` hook. |
| **SSR / Next.js**           | Works with SSR — animations initialise on mount via `useGSAP` or `useLayoutEffect`. |
| **License**                 | Free for standard use. "No Charge" license covers this use case (public website, not behind a paywall for the tool itself). The ScrollTrigger plugin is free. |

**Why GSAP over CSS scroll-driven animations:**  
CSS `scroll-timeline` and `view-timeline` (the new CSS Scroll-Driven Animations spec) are promising but have critical limitations for this project:
- Browser support is still incomplete (Firefox partial, Safari lagging).
- Complex multi-element orchestrations (header stack management, conditional collapse) are extremely difficult to express declaratively.
- No programmatic snap control, no conditional logic.
- GSAP gives us imperative control for the header lifecycle while still binding to scroll position.

**Why GSAP over Framer Motion scroll:**  
Framer Motion's `useScroll` + `useTransform` is excellent for simple parallax and opacity fades, but:
- It does not have a ScrollTrigger-equivalent for pinning, snapping, or scrubbed timeline orchestration.
- Performance under heavy multi-element scroll binding is inferior to GSAP.
- The header collapse state machine is better handled with GSAP's callback system (`onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack`).

### 2.2 Smooth Scroll Wrapper: Lenis

**Lenis** (by Studio Freight / darkroom.engineering) is the recommended smooth-scroll library.

| Criterion            | Lenis                                                       |
| -------------------- | ----------------------------------------------------------- |
| **Purpose**          | Normalises scroll across browsers/devices. Adds inertia and smoothing to native scroll. |
| **Feel**             | Configurable lerp-based smoothing. Feels premium without being sluggish. |
| **GSAP integration** | First-class. `lenis.on('scroll', ScrollTrigger.update)` syncs perfectly. |
| **Performance**      | Uses `requestAnimationFrame`, respects `prefers-reduced-motion`. |
| **Size**             | ~4 KB gzipped.                                              |
| **SSR**              | Safe — initialise on client only.                           |

**Configuration recommendation:**

```js
const lenis = new Lenis({
  lerp: 0.1,          // smoothing factor (0 = instant, 1 = no smoothing). 0.1 is buttery.
  duration: 1.2,       // fallback duration for programmatic scrolls
  smoothWheel: true,   // smooth mouse wheel
  smoothTouch: false,  // preserve native touch scroll (important for mobile)
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential ease-out
});
```

### 2.3 Stack Summary

| Layer                  | Library                | Role                                           |
| ---------------------- | ---------------------- | ---------------------------------------------- |
| Smooth scroll          | **Lenis**              | Global scroll normalisation + inertia           |
| Scroll-driven animation | **GSAP ScrollTrigger** | Binds animations to scroll position             |
| Tweening engine        | **GSAP Core**          | Performs the actual property interpolations      |
| React integration      | **@gsap/react**        | `useGSAP` hook for lifecycle-safe setup/cleanup |

---

## 3. Animation 1: Landing → Main Content Snap

### Description

The landing page occupies `100vh`. The main content begins directly below it. When the user initiates a downward scroll from the landing page, the viewport **auto-scrolls** with an eased animation to perfectly land at the top of the main content area.

### Scroll Trigger Configuration

```
ScrollTrigger.create({
  trigger: "#landing-page",
  start: "bottom bottom",      // when bottom of landing reaches bottom of viewport
  end: "bottom top",           // when bottom of landing reaches top of viewport
  snap: {
    snapTo: 1,                 // snap to end position
    duration: { min: 0.4, max: 0.8 },
    ease: "power2.inOut",
  },
});
```

### Behaviour Details

- **Threshold:** A small scroll delta (~50px or 5% of viewport) commits the snap. Below that threshold, spring back to the landing page.
- **Duration:** 0.4–0.8s depending on scroll velocity (GSAP snap handles this).
- **Easing:** `power2.inOut` (ease in then ease out) for a smooth acceleration-deceleration feel.
- **Reverse:** Scrolling up from the top of main content triggers the reverse snap back to the landing page.
- **Keyboard/Programmatic:** `Space`, `Page Down`, or clicking a client link should also trigger the snap.

---

## 4. Animation 2: Logo Bar Size Interpolation

### Description

The top bar contains the Welcome "W" logo. In the initial scroll state, this logo is rendered at a **large** size (~350 × 306 px) within a top bar that is ~326 px tall. As the user scrolls through the first section of content, the logo **continuously shrinks** to a **small** size (~41 × 36 px) in a top bar that is ~41 px tall. The top bar then becomes `position: sticky` at the top of the viewport.

### Figma Measurements

| State       | Logo bar height | Logo approximate size | Figma frame                          |
| ----------- | --------------- | --------------------- | ------------------------------------ |
| Expanded    | ~326 px         | ~350 × 306 px        | `Full page flow: Initial Scroll State` → `Frame 12` (top child) |
| Collapsed   | ~41 px          | ~41 × 36 px          | `Scroll State 1` → `Frame 12` (INSTANCE of `Frame 11`) |

### Scroll Trigger Configuration

```
gsap.to("#logo-bar", {
  scrollTrigger: {
    trigger: "#main-content",
    start: "top bottom",          // when main content top enters viewport bottom
    end: "top top",               // when main content top reaches viewport top
    scrub: true,                  // continuously interpolate with scroll
  },
  height: 41,                     // from ~326 to 41
});

gsap.to("#logo-svg", {
  scrollTrigger: { /* same trigger */ scrub: true },
  scale: 0.117,                   // 41/350 ≈ 0.117 scale factor
  transformOrigin: "top left",
});
```

### Critical Implementation Notes

1. **Use `transform: scale()` for the logo, not width/height.** Scaling is compositor-friendly (GPU), resizing triggers layout (CPU). This is essential for 60 fps.
2. **The scrub value:** Use `scrub: 0.3` (slight lag behind scroll) rather than `scrub: true` (exact follow) for a more polished feel. This adds ~300ms of smoothing. Test both.
3. **The bar itself** should transition `height` using a CSS custom property animated by GSAP, or use `scaleY` on an inner wrapper to avoid layout thrashing. Preferred approach: animate a CSS `--bar-height` variable and use it in a `clamp()` or directly.
4. **Sticky activation:** Once the logo bar reaches its collapsed size AND is at the top of the viewport, it should become `position: sticky; top: 0`. This can be a class toggle via ScrollTrigger's `toggleClass` or handled in the `onUpdate` callback.
5. **Nav element within bar:** The top-right mail icon is independent (`position: fixed`), so it is not affected by this animation.

### Interpolation Curve

The size transition should feel **linear** relative to scroll position (i.e., `scrub` with no easing on the tween itself). The Lenis smooth-scroll layer provides the perceptual easing. If a non-linear size curve is desired (e.g., logo shrinks faster at the start), apply an `ease` to the tween — recommend `"none"` initially, then test `"power1.in"`.

---

## 5. Animation 3: Section Header Sticky-Stack System

This is the most complex animation on the site. It governs how section headers (Redbull, UNIQLO, Puma, Services) behave as the user scrolls.

### 5.1 Header States

Each section header has **three visual states:**

| State        | Height  | Font size | Layout                                          | Position          |
| ------------ | ------- | --------- | ----------------------------------------------- | ----------------- |
| **Expanded** | 74 px   | 83 px     | Title (left) + Tag pills (right), 0.5px borders | Static (in flow)  |
| **Collapsed**| ~34.5 px| ~35.6 px  | Title (left) + Tag pills (right), same layout   | Sticky            |
| **Dismissed**| 0 px    | —         | Slides up behind the logo bar, removed from stack | Off-screen        |

### 5.2 Lifecycle of a Header

```
                    scroll ↓
                       │
    ┌──────────────────┼──────────────────┐
    │                  ▼                  │
    │   ┌──────────────────────────┐      │
    │   │       EXPANDED (74px)    │      │   ← in normal document flow
    │   │       fontSize: 83px     │      │
    │   └──────────────────────────┘      │
    │                  │                  │
    │          reaches top of viewport    │
    │          (below logo bar)           │
    │                  │                  │
    │                  ▼                  │
    │   ┌──────────────────────────┐      │
    │   │      COLLAPSED (34.5px)  │      │   ← position: sticky, top: [logo-bar-height]
    │   │      fontSize: ~35.6px   │      │   ← continuously interpolated during transition
    │   └──────────────────────────┘      │
    │                  │                  │
    │          next header reaches this   │
    │          header's sticky position   │
    │                  │                  │
    │                  ▼                  │
    │   ┌──────────────────────────┐      │
    │   │       DISMISSED          │      │   ← slides up behind logo bar
    │   │       (translateY: -100%)│      │   ← removed from sticky stack
    │   └──────────────────────────┘      │
    │                                     │
    └─────────────────────────────────────┘
```

### 5.3 Sticky Stack Rules

1. **Maximum 2 collapsed headers** visible at any time (below the logo bar).
2. The **logo bar** is always sticky at `top: 0`. It is the permanent top element.
3. Collapsed header 1 sticks at `top: [logo-bar-height]` (≈ 41 px).
4. Collapsed header 2 sticks at `top: [logo-bar-height] + [collapsed-header-1-height]` (≈ 41 + 34.5 = 75.5 px).
5. When a **3rd header** would collapse, the **oldest** (topmost) collapsed header is **dismissed**: it animates `translateY` upward until it slides behind the logo bar and out of view.
6. The remaining collapsed header shifts up to position 1, and the new header takes position 2.

### 5.4 Expanded → Collapsed Transition

This transition should be **continuously interpolated** (scrubbed to scroll), not snapped.

| Property     | Expanded value | Collapsed value | Interpolation             |
| ------------ | -------------- | --------------- | ------------------------- |
| Height       | 74 px          | 34.5 px         | Linear scrub              |
| Font size    | 83 px          | ~35.6 px        | Linear scrub              |
| Line height  | ~110.8 px      | ~35.6 px        | Match font size           |
| Border lines | 0.5 px top+bottom | 0.5 px top+bottom | No change              |
| Tag pills    | Stacked vertically (2 rows) | Single row horizontal | Transition at midpoint |

**Trigger range:** The transition begins when the header reaches the sticky position (bottom of logo bar) and completes over a scroll range of approximately **1× the expanded header height** (74 px of scroll). This keeps the transition tight and responsive.

### 5.5 Dismissed Header — Slide Behind Logo Bar

When the 3rd header collapses:

1. Identify the oldest collapsed header (position 1 in the stack).
2. Animate it: `translateY: -(34.5 + 41)px` (its own height plus logo bar height) over ~200ms with `ease: "power2.in"`.
3. Set `visibility: hidden` and `position: static` after animation completes.
4. Shift the remaining collapsed header from position 2 → position 1 (update its `top` value).
5. The new header takes position 2.

**Clip/mask:** The logo bar should have `overflow: hidden` or a higher `z-index` so that dismissed headers slide *behind* it, not *over* it.

### 5.6 Reverse Scroll Behaviour

All transitions reverse identically when scrolling up:

- A dismissed header re-enters from behind the logo bar.
- A collapsed header expands back to 74 px as its section scrolls into view.
- The header stack "unwinds" in exact reverse order.

GSAP ScrollTrigger handles this automatically when using `scrub` — the tween simply plays in reverse as scroll position decreases.

### 5.7 Collapsed Header Click → Auto-Scroll

Clicking a collapsed header in the sticky stack triggers:

1. A **smooth scroll** (via Lenis `lenis.scrollTo()` or GSAP `ScrollToPlugin`) to the **top of that header's corresponding section**.
2. This effectively "re-expands" the clicked header by scrolling the page so that section is back in view.
3. The scroll animation should use the same easing as the landing→content snap (`power2.inOut`, ~0.6s).
4. All intermediate header transitions reverse naturally as the scroll position changes.

---

## 6. Scroll Regions Map

Below is a conceptual map of the full page scroll, showing trigger points:

```
Scroll Position (px)    Element                          Active Animation
─────────────────────   ─────────────────────────────   ──────────────────────────────
0                       ┌─ Landing Page (100vh) ─┐       
                        │                        │       
~1109                   └────────────────────────┘       Snap zone (landing → content)
                                                         
~1109                   ┌─ Logo Bar (326px) ─────┐       Logo interpolation begins
                        │  Large "W" logo        │       
~1435                   └────────────────────────┘       Logo fully collapsed (41px), sticky
                                                         
~1435                   ── 0.5px line ────────────       
                                                         
~1435                   ┌─ REDBULL Header (74px) ┐       Header 1 in flow
                        └────────────────────────┘       
~1509                   ── 0.5px line ────────────       
                                                         
~1509                   ┌─ Case Study 1 Content  ┐       Header 1 hits sticky → collapse begins
                        │  Section 1 (~470px)    │       
                        │  Section 2 (~905px)    │       
~2884                   └────────────────────────┘       
                                                         
~2884                   ── 0.5px line ────────────       
                                                         
~2884                   ┌─ UNIQLO Header (74px)  ┐       Header 1 fully collapsed + sticky
                        └────────────────────────┘       Header 2 in flow → collapse begins
                        ...                              Header 1 dismissed when Header 3 arrives
                                                         
                        ┌─ PUMA Header (74px)    ┐       
                        └────────────────────────┘       
                        ...                              
                                                         
                        ┌─ SERVICES Header (74px)┐       
                        └────────────────────────┘       
                        ┌─ Design block (649px)  ┐       
                        ├─ Develop block (649px) ┤       
                        ├─ Distribute block      ┤       
                        └────────────────────────┘       
```

*Note: Scroll positions are approximate based on Figma content heights. Actual values will be calculated dynamically at runtime.*

---

## 7. Performance Budget & Targets

| Metric                          | Target                                    |
| ------------------------------- | ----------------------------------------- |
| Frame rate during scroll        | **60 fps** sustained (no drops below 55)  |
| Largest Contentful Paint (LCP)  | < 2.0s                                    |
| Cumulative Layout Shift (CLS)   | < 0.05                                    |
| Total Blocking Time (TBT)       | < 150ms                                   |
| JS bundle (animation libs)      | GSAP ~25KB + Lenis ~4KB ≈ **< 30KB gz**  |

### 7.1 Performance Rules

1. **Only animate `transform` and `opacity`.** Never animate `width`, `height`, `top`, `left`, `font-size` directly. Use `scale`, `translateY`, CSS custom properties, or FLIP techniques.
   - **Exception: font-size interpolation.** Font size cannot be scaled with `transform: scale()` without affecting layout and readability. Two approaches:
     - **Preferred:** Use `transform: scale()` on the text element and adjust the container size inversely. The text will look correct because it's the same font at a different scale.
     - **Fallback:** If the scale approach creates sub-pixel rendering issues, animate `font-size` directly but limit the trigger range to minimise layout recalculations. Use `will-change: font-size` (sparingly) and test performance.
2. **Use `will-change` judiciously.** Apply to elements *before* they animate, remove *after*. Don't blanket-apply.
3. **Debounce resize handlers.** Recalculate ScrollTrigger positions on resize, but debounce to ≤ 1 call per 200ms.
4. **Lazy-load images** below the fold. Only the landing page image and the first case study images need to be eagerly loaded.
5. **Use `content-visibility: auto`** on off-screen sections to skip rendering work.

### 7.2 Font-Size Animation Strategy (Detail)

The header collapse from 83px → 35.6px font involves a font-size change. The recommended approach:

1. Render the header text at the **collapsed size** (35.6px) as the base.
2. Apply `transform: scale(2.33)` (83/35.6) to show it at the "expanded" visual size.
3. As the header collapses, animate `scale` from 2.33 → 1.0.
4. Adjust the container height from `74px` → `34.5px` using `transform: scaleY()` on the wrapper, or animate a CSS custom property `--header-height`.
5. This approach keeps font rendering crisp at the final size and only uses compositor-friendly transforms.

---

## 8. Edge Cases & Gotchas

### 8.1 Fast Scrolling
When a user scrolls very quickly (mousewheel spam, scrollbar drag), multiple headers may pass through their trigger zones in a single frame. GSAP ScrollTrigger handles this correctly — it evaluates final position, not intermediate frames. But test thoroughly with:
- Keyboard `Page Down` rapid press
- Scrollbar click-drag
- Trackpad momentum scrolling (macOS)

### 8.2 `prefers-reduced-motion`
If the user has `prefers-reduced-motion: reduce`:
- Disable Lenis smooth scrolling (fall back to native).
- Replace scrubbed animations with instant state changes (no interpolation).
- Disable the landing→content snap animation; use native scroll.
- Headers still collapse but instantly rather than continuously.

### 8.3 Browser Back/Forward & Scroll Restoration
- `history.scrollRestoration = 'manual'` — we manage scroll position ourselves.
- On route navigation (if any), ensure ScrollTrigger instances are killed and recreated.
- Lenis must be paused during programmatic scrolls (e.g., `lenis.scrollTo()`) to prevent fighting.

### 8.4 Mobile Touch
- Lenis `smoothTouch: false` — preserve native iOS/Android touch scrolling.
- ScrollTrigger works fine with touch; the `scrub` animations bind to scroll position regardless of input method.
- Ensure touch targets on collapsed headers are at least 44 × 44 px (iOS HIG minimum).

---

## 9. Z-Index Stacking Order

```
z-index layer map (highest to lowest):

100  ─  Mail / Contact icon (position: fixed)
 90  ─  Logo bar (position: sticky, top: 0)
 80  ─  Collapsed header, stack position 1 (sticky)
 70  ─  Collapsed header, stack position 2 (sticky)
 60  ─  Active expanded header (in flow, but visually above content)
  1  ─  Section content (normal flow)
  0  ─  Page background
```

The logo bar needs `overflow: visible` horizontally but must visually clip dismissed headers sliding behind it. Use `clip-path` or a pseudo-element overlay matching the background colour to achieve this without `overflow: hidden` (which would clip the logo during its scale animation).

---

## 10. 0.5px Separator Lines

Per the Figma spec:
- Horizontal separator lines appear between the logo bar and the first header, and between each header and its content, and between content sections.
- Stroke weight: **0.5px**, colour `#000000`.
- Implementation: Use `border-bottom: 0.5px solid #000000` or a dedicated `<hr>` element with `height: 0.5px; background: #000000; border: none;`.
- Note: Some browsers render 0.5px as 1px on non-retina displays. Use `transform: scaleY(0.5)` on a 1px line as a fallback for guaranteed half-pixel rendering.
- These lines scroll with their adjacent content; they are not sticky.
