# Header Sticky-Stack System — Deep Specification

> **Document version:** 2.0
> **Last updated:** 2026-02-12

---

## 1. What It Does (User-Visible Behaviour)

As the user scrolls down, section headers (Redbull, Uniqlo, Puma, Services) peel off from the document flow and stick below the logo bar in a small "stack." The stack shows at most **2 collapsed headers**. When a 3rd arrives, the oldest is pushed out the top. Scrolling back up reverses everything perfectly.

### The golden rule

**Every visual state is a pure function of scroll position.** There is no time-based animation, no state that drifts, no "fire-and-forget" tween. If you jump to scroll position X, the screen must look identical to if you had slowly scrolled to X.

---

## 2. Geometry

```
Viewport top (y = 0)
┌─────────────────────────────────────────────────┐
│  Logo Bar   (41px)          position: sticky     │  top: 0
├─────────────────────────────────────────────────┤  y = 41   ← SLOT 0 top
│  Collapsed Header Slot 0   (36.5px)   fixed      │
├─────────────────────────────────────────────────┤  y = 77.5 ← SLOT 1 top
│  Collapsed Header Slot 1   (36.5px)   fixed      │
├─────────────────────────────────────────────────┤  y = 114  ← CONTACT LINE (when 2 full)
│                                                   │
│  Page content scrolls behind                      │
│                                                   │
└─────────────────────────────────────────────────┘
```

Key values:

| Constant               | Value   | Derivation                              |
| ---------------------- | ------- | --------------------------------------- |
| `LOGO_BAR_H`           | 41 px   | Fixed by design                         |
| `HEADER_BLOCK_COLLAPSED_H` | 36.5 px | 1px sep + 34.5px row + 1px sep      |
| `SLOT_0_TOP`           | 41 px   | `LOGO_BAR_H`                           |
| `SLOT_1_TOP`           | 77.5 px | `LOGO_BAR_H + HEADER_BLOCK_COLLAPSED_H` |
| Contact line (0 in stack) | 41 px  | `LOGO_BAR_H + 0 * COLLAPSED_H`       |
| Contact line (1 in stack) | 77.5 px | `LOGO_BAR_H + 1 * COLLAPSED_H`      |
| Contact line (2 in stack) | 114 px  | `LOGO_BAR_H + 2 * COLLAPSED_H`      |

**Contact line** = the viewport-Y coordinate at which the top of an expanded header triggers stacking. It equals the bottom edge of whatever is currently in the stack.

---

## 3. Header States

Each header is always in exactly one of these states:

| State        | Meaning                                                       | CSS position | In `collapsedStack`? |
| ------------ | ------------------------------------------------------------- | ------------ | -------------------- |
| **expanded** | In normal document flow, full size (74px)                     | static       | No                   |
| **stacked**  | Fixed to viewport, collapsing or fully collapsed              | fixed        | Yes                  |
| **exiting**  | Being pushed out the top of the stack (scroll-linked)         | fixed        | No (removed)         |
| **dismissed**| Fully off-screen, invisible, waiting to be restored           | fixed        | No                   |

State is stored in `block.dataset.state` and is the single source of truth for what a header is doing.

---

## 4. The Collapse Animation

When an expanded header's natural top (from document flow) scrolls up to the **contact line**, it enters the stack. The collapse is driven by **progress**, a value from 0 to 1:

```
progress = clamp(0, 1, (contactY - naturalTop) / COLLAPSE_DISTANCE)
```

Where:
- `contactY` — the viewport Y where this header first made contact (captured once, stored per header)
- `naturalTop` — the current viewport Y of the header's placeholder (reads where the header *would* be if it were still in flow)
- `COLLAPSE_DISTANCE` — the pixel range over which the animation plays (equal to `expandedBlockH - HEADER_BLOCK_COLLAPSED_H`, roughly 37.5px)

At progress 0 the header looks expanded; at progress 1 it's fully collapsed.

### What interpolates:

| Property          | At progress 0          | At progress 1               |
| ----------------- | ---------------------- | --------------------------- |
| `block.height`    | expandedBlockH (74px)  | HEADER_BLOCK_COLLAPSED_H (36.5px) |
| `row.height`      | expandedRowH (72px)    | HEADER_ROW_COLLAPSED_H (34.5px) |
| `title.fontSize`  | expandedTitleSize (83px)| COLLAPSED_TITLE_SIZE (35.6px) |
| `block.top`       | contactY               | slot target (41 or 77.5)    |
| Tags layout       | column, opacity 1      | row, opacity 1 (crossfade in middle) |

### Tags crossfade schedule:

| Progress range | `flexDirection` | `opacity`                   |
| -------------- | --------------- | --------------------------- |
| 0.00 – 0.50   | column          | 1                           |
| 0.50 – 0.65   | column          | fades 1 → 0                |
| 0.65           | switches to row | —                           |
| 0.65 – 0.80   | row             | fades 0 → 1                |
| 0.80 – 1.00   | row             | 1                           |

---

## 5. The Stack Array

`collapsedStack: string[]` — ordered **oldest first**. Maximum length: 2.

- `collapsedStack[0]` → Slot 0 (directly below logo bar)
- `collapsedStack[1]` → Slot 1 (below slot 0)

When a 3rd header arrives:
1. `collapsedStack.shift()` removes the oldest → that header becomes **exiting**
2. The remaining header (was at index 0, slot 1) becomes the **sliding** header
3. The new header is `push()`ed → it's at index 1, slot 1

---

## 6. The Three-Header Transition

When a 3rd header contacts the stack while 2 are already collapsed, three things animate simultaneously, ALL driven by the incoming header's **progress** (0→1):

### 6a. Incoming header (new, entering slot 1)
- Standard collapse interpolation (section 4 above)
- Top lerps from contactY → slot1Top

### 6b. Sliding header (was slot 1, moving to slot 0)
- Top lerps from slot1Top → slot0Top
- z-index updates to 80 at completion

### 6c. Exiting header (was slot 0, leaving)
- `translateY` from 0 → -HEADER_BLOCK_COLLAPSED_H (slides up behind logo bar)
- `opacity` from 1 → 0
- At progress ≥ 0.99: state → "dismissed", visibility → hidden

All three are driven by the **same progress value** (the incoming header's). This guarantees they stay in lockstep.

---

## 7. Scroll-Up Reversal

### 7a. Un-stacking (progress → 0)
When scrolling up, the last header in the stack (the one that entered most recently) sees its placeholder move back down. `distPastContact` decreases, progress drops toward 0. The interpolation runs in reverse: height expands, title grows, top moves from slot back toward contactY. When progress hits 0, the header is returned to document flow (placeholder removed, inline styles cleared).

### 7b. Transition reversal
If an exit/slide transition is in progress and the user scrolls up:
- The exiting header is restored to slot 0 (state → "stacked")
- The sliding header snaps back to slot 1
- The incoming header continues to reverse via progress → 0

### 7c. Restoring dismissed headers
When the stack has fewer than 2 headers and no exit transition is active, dismissed headers whose placeholders are still above the contact line are restored to the stack at their collapsed state (progress = 1).

---

## 8. Placeholder System

When a header goes fixed, a **placeholder** `<div>` is inserted into the DOM at its original position. This:
- Preserves document flow (content doesn't jump)
- Provides a measurement point: `placeholder.getBoundingClientRect().top` tells us where the header *would* be if it were still in flow
- Height matches the header's expanded height
- Has `visibility: hidden` and `pointer-events: none`

The placeholder is removed when the header returns to flow (expand).

---

## 9. Current Problems (Root Cause Analysis)

The current implementation has correctness issues on scroll-up caused by **fragmented state management**:

### Problem 1: State scattered across multiple locations
- Header state is in `dataset.state` (string)
- Stack membership is in `collapsedStack[]` (array position)
- Transition state is in `exitState` (separate object)
- Visual progress is in `lastProgress` (per-header number)
- Contact position is in `contactY` (per-header number)

These can fall out of sync. For example, a header can be in `collapsedStack` but have `dataset.state = "exiting"`, or be dismissed but still referenced in `exitState`.

### Problem 2: The reconciliation loop mixes decisions and mutations
Passes 1, 2, 3, 3b, 4a, 4b all read AND write in interleaved fashion. A decision in Pass 1 (cancel exit) changes `collapsedStack`, which affects Pass 3's slot indices. This creates ordering dependencies and makes the logic fragile under rapid scroll direction changes.

### Problem 3: No single canonical "what should the world look like at this scroll position?"
The system is event-driven (reacting to thresholds being crossed) rather than declarative (computing the desired state from scratch each frame). Event-driven systems accumulate drift when events fire in unexpected orders (rapid direction reversals, momentum overshoot, etc.).

---

## 10. Engineering Plan

### Philosophy: Declarative over Imperative

Instead of reacting to threshold crossings and maintaining mutable transition state, **recompute the desired state from scratch every frame** based purely on current scroll position and the static section geometry.

### Architecture: Two-Phase Reconciler

```
Every scroll frame:
  1. DERIVE — compute desired state for every header from scroll position alone
  2. APPLY  — diff desired vs current, apply minimal DOM mutations
```

No `exitState`. No `slidingId`. No mutable `collapsedStack` that persists between frames. The stack is recomputed.

### Phase 1: DERIVE (pure computation, zero DOM writes)

```typescript
interface DerivedHeaderState {
  id: string;
  desiredState: "expanded" | "stacked" | "dismissed";
  slotIndex: number;       // 0 or 1 if stacked, -1 otherwise
  progress: number;        // 0–1 collapse progress (1 = fully collapsed)
  topPx: number;           // desired viewport top position
  zIndex: number;          // desired z-index
}
```

Algorithm:
1. For each section (in order), read its placeholder/element `getBoundingClientRect().top`
2. Compute its contact line (= `LOGO_BAR_H + min(stackCount, 2) * COLLAPSED_H`)
3. If `naturalTop <= contactLine`, this header wants to be stacked. Compute its progress.
4. Build the desired stack (max 2 visible). Headers beyond the 2 most recent are "dismissed."
5. For each stacked header, compute `topPx` by lerping from `contactY` to slot target using progress.

This is a **pure function**: `(sectionPositions) → DerivedHeaderState[]`. No side effects.

### Phase 2: APPLY (diff + minimal DOM writes)

Compare each header's **current** DOM state to its **derived** state:
- If a header needs to go from expanded → stacked: create placeholder, set position fixed
- If stacked and progress changed: update height, fontSize, top, tags
- If stacked → dismissed: set visibility hidden
- If dismissed → stacked: restore visibility, set slot position
- If stacked → expanded: remove placeholder, clear inline styles

The key insight: **there is no "exiting" or "sliding" state**. Those are just headers whose `progress` and `topPx` happen to be changing. A header in slot 0 that's being pushed out simply has its `topPx` lerping upward and its opacity decreasing — computed from the geometry, not from transition state.

### How the exit/slide emerges naturally

When 3 headers want to be stacked but only 2 slots exist:
- The 2 most recent get slots 0 and 1
- The oldest gets `desiredState: "dismissed"`
- But we don't instantly dismiss it — we compute an **exit progress** for it based on how far the incoming header has collapsed
- Its `topPx` slides up, its `opacity` fades — all computed, not animated

The "slide from slot 1 to slot 0" similarly emerges: the middle header's target slot *changes* from 1 to 0 as the oldest is dismissed, and its `topPx` smoothly transitions because it's lerped from its `contactY`.

### Benefits

1. **No accumulated state drift** — everything is recomputed from geometry each frame
2. **Perfectly reversible** — scrolling to position X always produces the same visual, regardless of how you got there
3. **No ordering bugs** — there's no sequence of passes that can see inconsistent intermediate state
4. **Simpler mental model** — "what does the world look like at this scroll position?" is one function
5. **Easier to debug** — log the derived state array, compare to what's on screen

### Implementation Considerations

- **contactY caching**: Each header's contactY needs to be stable (the Y where it first contacts). This can be computed statically from the section geometry rather than captured at runtime: `contactY[i] = LOGO_BAR_H + min(i, 2) * COLLAPSED_H`. But since headers have different expanded heights and sections have different content heights, it's better to compute it from the placeholder position: "at what scroll position does this header's naturalTop equal the contact line?"

- **Exit animation range**: The exit animation of the oldest header should play over the same `COLLAPSE_DISTANCE` as the incoming header's collapse, so they stay in lockstep. Both are driven by the same scroll delta.

- **Performance**: The derive phase does `N` getBoundingClientRect calls (one per section, ~4 total). This is fast. The apply phase only writes properties that changed (diff against lastProgress and lastState).

- **Placeholder management**: Placeholders are created/removed in the APPLY phase, not the DERIVE phase. DERIVE only reads positions.

### File Structure (unchanged)

All logic stays in `ScrollManager.tsx`. No new files needed. The helper functions (`interpolateHeader`, `expandHeaderBlock`, `enterStack`) are replaced by a single `applyDerivedState` function and the pure `deriveHeaderStates` function.
