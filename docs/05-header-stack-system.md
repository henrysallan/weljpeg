# Feature Doc: Header Stack System

> **Document version:** 2.0
> **Last updated:** 2025-02-15
> **Implementation:** `components/ScrollManager.tsx` (lines ~450-1050)

---

## 1. Overview

The header stack system manages how section headers behave during scroll. As the user scrolls past a section, its header transitions from an expanded in-flow element to a compact sticky bar pinned below the logo bar. Multiple collapsed headers stack vertically, and as sections scroll out of view, their headers exit the stack.

This system is fully implemented as a **declarative two-phase reconciler** within `ScrollManager.tsx`.

---

## 2. Constants

All constants are defined at the top of `ScrollManager.tsx`:

| Constant                   | Value   | Description                                             |
| -------------------------- | ------- | ------------------------------------------------------- |
| `LOGO_BAR_H`              | ~52px   | Measured at runtime: `logoBarEl.getBoundingClientRect().height` |
| `HEADER_BLOCK_COLLAPSED_H`| 26.5px  | Total height of a collapsed header block (incl. separators) |
| `HEADER_ROW_COLLAPSED_H`  | 25.5px  | Height of the inner header row (excl. separators)       |
| `COLLAPSED_TITLE_SIZE`     | 20.6px  | Font size of collapsed title text                       |
| `COLLAPSE_SPEED`           | 2.5     | Multiplier that stretches the scroll distance over which collapse interpolation occurs |

### Slot Calculation

Each collapsed header occupies a "slot" in the stack. The top position of slot `s` (0-indexed):

```
slotTop(s) = LOGO_BAR_H - 1 + s * HEADER_BLOCK_COLLAPSED_H
```

The `- 1` nudges headers up by 1px so their top separator overlaps the logo bar's bottom separator, avoiding a visible double line.

---

## 3. Data Structures

### HeaderRef (static, gathered on mount)

```typescript
interface HeaderRef {
  sectionId: string;
  sectionEl: HTMLElement;      // The <section> element
  blockEl: HTMLElement;        // #header-block-{id}
  rowEl: HTMLElement;          // The .headerRow inside
  titleEl: HTMLElement;        // The <h2> title
  tagsEl: HTMLElement | null;  // The .tags container
  placeholder: HTMLDivElement; // Inserted to hold space when header goes fixed
  naturalH: number;            // Original height before any manipulation
  naturalTitleSize: number;    // Original font size in px
}
```

### LiveState (mutable, per-header)

```typescript
interface LiveState {
  phase: "expanded" | "collapsing" | "collapsed" | "exiting" | "dismissed";
  slot: number;               // Current slot index in the stack
  progress: number;           // 0..1 interpolation progress during collapsing
}
```

### DerivedState (computed fresh each frame)

```typescript
interface DerivedState {
  phase: "expanded" | "collapsing" | "collapsed" | "exiting" | "dismissed";
  slot: number;
  progress: number;           // Raw progress for collapsing phase
}
```

---

## 4. Header Lifecycle (States)

```
expanded --> collapsing --> collapsed --> exiting --> dismissed
                                                       |
                                                       v
                                                  (back to expanded
                                                   when scrolled back up)
```

### State Descriptions

| State        | Condition                                         | Visual                                    |
| ------------ | ------------------------------------------------- | ----------------------------------------- |
| `expanded`   | Section header is in viewport, not yet scrolled past | Normal in-flow element, full size         |
| `collapsing` | Header's natural position is scrolling past the stack top | Transitioning: interpolating height, font-size, position |
| `collapsed`  | Fully transitioned, pinned in its stack slot      | Fixed position, compact (26.5px), small title (20.6px) |
| `exiting`    | Section is scrolling out of view (bottom edge approaching stack) | Slides up and out of the stack |
| `dismissed`  | Section is fully scrolled past                    | `display: none`, placeholder holds space  |

---

## 5. Two-Phase Reconciler

### Phase 1: `deriveStates(scrollY)`

A **pure function** that takes the current scroll position and computes the desired `DerivedState` for every header. It does not touch the DOM.

Key logic per header:

1. **Determine section boundaries:**
   - `sectionTop` = section element's `offsetTop`
   - `sectionBot` = `sectionTop + section.offsetHeight`

2. **Calculate collapse trigger point:**
   - `collapseStart` = the scroll position where the header's top would reach its target slot
   - `collapseDist` = `naturalH * COLLAPSE_SPEED` (2.5x the natural height)

3. **Determine phase:**
   - If `scrollY < collapseStart`: **expanded**
   - If `scrollY` is within `collapseDist` past `collapseStart`: **collapsing** (progress = fraction through distance)
   - If past `collapseDist` but section bottom is still below stack: **collapsed**
   - If section bottom is approaching stack bottom: **exiting**
   - If section is fully past: **dismissed**

4. **Assign slot numbers:** Collapsed headers are assigned sequential slot indices based on their visual order in the stack.

### Phase 2: `applyStates(derived[])`

Compares derived states against current `LiveState` for each header and applies DOM changes only where they differ.

For each header:

1. **Phase transition:** If `derived.phase !== live.phase`, apply structural changes:
   - `expanded -> collapsing`: Insert placeholder, set `position: fixed`
   - `collapsing -> collapsed`: Snap to final collapsed dimensions
   - `collapsed -> exiting`: Begin sliding out
   - `exiting -> dismissed`: Set `display: none`
   - (Reverse transitions also handled for scroll-up)

2. **Interpolation** (during `collapsing` phase):
   Call `interpolateHeader(header, progress)` to smoothly transition:
   - Block height: `naturalH -> HEADER_BLOCK_COLLAPSED_H`
   - Row height: `natural -> HEADER_ROW_COLLAPSED_H`
   - Title font-size: `naturalTitleSize -> COLLAPSED_TITLE_SIZE`
   - Top position: slides to `slotTop(slot)`
   - Width: `100%`
   - Tags: crossfade from column to row layout

---

## 6. Collapse Interpolation Detail

### Eased Progress

Raw progress `t` (0 to 1) is transformed with a subtle ease-out:

```typescript
const eased = 1 - Math.pow(1 - t, 1.4);
```

This makes the beginning of collapse faster and the end slower, creating a natural deceleration feel.

### Property Interpolation

All interpolated properties use linear lerp with the eased progress:

```
value = start + (end - start) * eased
```

### Tags Crossfade

During collapse, tags transition from a vertical column layout (expanded) to an inline row (collapsed) with a crossfade:

| Progress Range | Tags State                                    |
| -------------- | --------------------------------------------- |
| 0.0 -- 0.5    | Column layout, fully visible                  |
| 0.5 -- 0.65   | Fading out column layout                      |
| 0.65           | Switch DOM: column -> row                     |
| 0.65 -- 0.8   | Fading in row layout                          |
| 0.8 -- 1.0    | Row layout, fully visible                     |

Tags container transitions:
- Column mode: `flex-direction: column; gap: 2px`
- Row mode: `flex-direction: row; gap: 4px`

---

## 7. Separator Dedup Pass

After `applyStates()` runs, a separate pass checks for duplicate separator lines:

When two headers are stacked (one collapsed directly above another), there are 4 separator lines at the boundary (bottom sep of upper header + top sep of lower header). The dedup pass hides the redundant separator to maintain a single 1px line between stacked headers.

Implementation:
- Iterates through collapsed/collapsing headers in slot order
- If two consecutive headers are within 2px vertically, hides the bottom separator of the upper one

---

## 8. Click-to-Scroll on Collapsed Headers

Collapsed headers have click handlers that scroll to their section:

```typescript
headerBlock.style.cursor = "pointer";
headerBlock.onclick = () => {
  lenis.scrollTo(sectionEl, { offset: -stackHeight });
};
```

Where `stackHeight` accounts for the logo bar and any headers stacked above.

---

## 9. ContactPage Y-Position Caching

The reconciler caches the ContactPage section's Y offset and uses it to determine where the last section ends. This prevents headers from stacking past the contact section boundary.

---

## 10. Historical Context

### Original Problem

The header stack was originally attempted with CSS `position: sticky` and GSAP ScrollTrigger pin/unpin. This approach suffered from:
- State drift: headers getting "stuck" in wrong positions after rapid scrolling
- Race conditions between GSAP timeline and scroll position
- Difficulty managing the dynamic stack height as headers entered/exited

### Solution: Declarative Reconciler

The current implementation (fully built and working) uses a React-inspired reconciler pattern:
- **Derive** desired state from scroll position (pure, no side-effects)
- **Diff** derived state against current state
- **Apply** minimal DOM changes

This eliminates state drift because state is always recomputed from scroll position, never accumulated. Even if frames are dropped, the next frame will compute the correct state from the current scroll position.

### Key Architectural Decision

Font-size is animated directly (not via CSS `scale` transform). This was a deliberate choice for simplicity and pixel-accurate rendering, despite being less performant than transform-based animations. The relatively small number of headers (4 max) makes this acceptable.
