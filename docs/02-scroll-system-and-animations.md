# Feature Doc: Scroll System & Animations

> **Document version:** 2.0
> **Last updated:** 2025-02-15
> **Implementation:** `components/ScrollManager.tsx` (1089 lines)

---

## 1. Overview

`ScrollManager.tsx` is the largest and most complex file in the project. It is a `"use client"` component rendered in `page.tsx` that controls:

1. **Smooth scrolling** via Lenis
2. **Landing-to-content gate** -- a deliberate scroll barrier on the landing page
3. **Header stack reconciliation** -- a declarative system that stickies and collapses section headers as the user scrolls (see [05-header-stack-system.md](./05-header-stack-system.md))
4. **Navigation helpers** -- hash link interception, down arrow, go-up pill, logo home button

It renders nothing visible; its return value is `null`. All effects are side-effects via `useEffect` and `useRef`.

---

## 2. Lenis Configuration

Lenis is instantiated in a `useEffect` on mount:

```typescript
const lenis = new Lenis({
  lerp: 0.08,
  wheelMultiplier: 0.7,
  touchMultiplier: 0.7,
  syncTouch: true,
  virtualScroll: (e) => {
    // Returns false to block scroll when gate is locked and on landing page
    if (gate.locked && gate.pageState === "landing") return false;
    return true;
  },
});
```

### Lenis-GSAP Integration

```typescript
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Other Scroll Setup

- `history.scrollRestoration = "manual"` -- prevents browser restoring scroll position
- `window.scrollTo(0, 0)` on mount -- always start at top
- `prefers-reduced-motion` check: if user prefers reduced motion, Lenis `lerp` is set to 1 and `smoothWheel` is disabled

---

## 3. Landing Gate System

The gate prevents normal scrolling on the landing page. Instead, the user must perform a deliberate action (wheel ticks or swipe) to trigger an animated transition to the main content.

### Gate Object

```typescript
const gate = {
  locked: true,
  transitioning: false,
  tickCount: 0,
  pageState: "landing" as "landing" | "content",
  TICK_THRESHOLD: 2,
};
```

### Wheel Handling

- Each `wheel` event increments `tickCount` (if direction is down).
- When `tickCount >= TICK_THRESHOLD` (2), the gate transition fires.
- A debounce timeout (300ms) resets `tickCount` if the user stops scrolling.

### Touch Handling

- `touchstart` records Y position.
- `touchend` compares Y position. If swipe distance >= 30px downward, triggers gate transition immediately.

### Gate Transition (Landing -> Content)

```typescript
lenis.scrollTo(landingHeight, {
  duration: transitionConfig.duration,  // default 1.8s
  easing: (t: number) => 1 - Math.pow(1 - t, transitionConfig.easePower),  // default power 5
  onComplete: () => {
    gate.locked = false;
    gate.pageState = "content";
  },
});
```

The `transitionConfig` values come from `lib/levaConfig.ts` and are live-editable via Leva controls in ImageSquiggle.

### Reverse Transition (Content -> Landing)

A `ScrollTrigger` watches the top of `#main-content`. When the user scrolls up past it:
- Gate re-locks
- `lenis.scrollTo(0)` animates back to top
- `pageState` returns to `"landing"`

---

## 4. Navigation Helpers

### Hash Link Interception

All `<a href="#section-*">` clicks are intercepted. The handler:
1. Prevents default navigation
2. If on landing page: triggers gate transition first, then scrolls to target section after a delay
3. If on content: scrolls directly to the target section via `lenis.scrollTo()`

### Down Arrow (`#landing-down-arrow`)

Click triggers the gate transition immediately (bypasses tick counting).

### Go-Up Pill (`#go-up-btn`)

In the `LogoBar`. Click triggers reverse gate transition (scroll to 0, re-lock gate).

### Logo Home Button (`#logo-home-btn`)

In the `LogoBar`. Same behaviour as go-up pill.

---

## 5. Logo Bar Behaviour

The logo bar is **always at its collapsed size** (~52px). It uses CSS `position: sticky; top: 0` to stick at the top of the viewport.

**Important:** The original Figma design showed a large-to-small logo bar animation during scroll. This was **not implemented**. The logo bar is static at its collapsed size at all times. There is no GSAP animation for logo bar sizing.

---

## 6. Header Stack System (Summary)

The header stack is a declarative system that manages sticky section headers. See [05-header-stack-system.md](./05-header-stack-system.md) for the complete specification.

### Key Constants

| Constant                   | Value   | Description                          |
| -------------------------- | ------- | ------------------------------------ |
| `LOGO_BAR_H`              | ~52px   | Measured at runtime from DOM         |
| `HEADER_BLOCK_COLLAPSED_H`| 26.5px  | Total height of collapsed header block |
| `HEADER_ROW_COLLAPSED_H`  | 25.5px  | Height of the header row within the block |
| `COLLAPSED_TITLE_SIZE`     | 20.6px  | Font size when fully collapsed       |
| `COLLAPSE_SPEED`           | 2.5     | Multiplier on collapse distance      |

### Architecture

Two-phase declarative reconciler:
1. **`deriveStates()`** -- pure function that computes desired state for every header based on scroll position
2. **`applyStates()`** -- diffs derived state against current DOM and applies minimal changes

States: `expanded` | `collapsing` | `collapsed` | `exiting` | `dismissed`

Runs on every Lenis scroll callback via `ScrollTrigger.create({ onUpdate })`.

---

## 7. Separator Dedup Pass

After applying header states, a deduplication pass runs to hide duplicate separator lines. When two headers are stacked and touching, the bottom separator of the upper header and the top separator of the lower header would create a double line. The dedup pass hides one of them.

---

## 8. Scroll-Triggered Animations Summary

| Animation                  | Trigger                        | Library       | Notes                               |
| -------------------------- | ------------------------------ | ------------- | ----------------------------------- |
| Landing gate transition    | 2 wheel ticks or swipe         | Lenis scrollTo| Custom power easing                 |
| Reverse gate transition    | Scroll up past main-content    | Lenis scrollTo| Back to 0                           |
| Header collapse            | Scroll past section start      | Manual via RAF| `COLLAPSE_SPEED = 2.5`, eased       |
| Header stack/exit          | Scroll past section end        | Manual via RAF| Declarative reconciler              |
| Tags crossfade             | Header collapse progress       | Manual CSS    | Column -> row at progress 0.5-0.8   |
| Separator dedup            | Any scroll                     | Manual DOM    | Hides duplicate lines               |
| ImageSquiggle animations   | On mount + Leva controls       | GSAP timeline | Arc/linear/scatter modes            |
| Image drag & throw         | Mouse/touch drag               | RAF loop      | Velocity/friction/bounce physics    |

---

## 9. Prefers Reduced Motion

If `window.matchMedia("(prefers-reduced-motion: reduce)")` matches:
- Lenis `lerp` is set to 1 (instant, no smoothing)
- Lenis `smoothWheel` is set to false
- Note: GSAP and header animations still run (not yet fully respecting reduced motion)

---

## 10. Cleanup

The `useEffect` returns a cleanup function that:
- Destroys the Lenis instance
- Kills all GSAP ScrollTriggers
- Removes wheel/touch/click event listeners
- Removes GSAP ticker callback
