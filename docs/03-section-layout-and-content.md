# Feature Doc: Section Layout & Content

> **Document version:** 2.0
> **Last updated:** 2025-02-15
> **Implementation:** `components/Section.tsx`, `components/SectionHeader.tsx`, `components/ContentBlock.tsx`, `components/TagPill.tsx`, `components/Separator.tsx`, `components/ContactPage.tsx`, `lib/data.ts`

---

## 1. Page Structure

The page is rendered in `page.tsx`:

```
<ScrollManager />          (renders null, side-effects only)
<LandingPage />            (100dvh hero)
<main id="main-content">
  <LogoBar />              (sticky, ~52px)
  {allSections.map(section =>
    <Section key={id} ... hideTopSeparator={index === 0} />
  )}
  <ContactPage />          (100dvh contact section)
</main>
```

### allSections (from `lib/data.ts`)

The `allSections` array contains all case-study and services sections in render order:

1. **Redbull** (type: `CaseStudy`, id: `redbull`)
2. **Puma** (type: `CaseStudy`, id: `puma`)
3. **Uniqlo** (type: `CaseStudy`, id: `uniqlo`)
4. **Services** (type: `ServicesSection`, id: `services`)

---

## 2. Section Component

`Section.tsx` wraps each entry in `allSections`. It renders:

```tsx
<section id={`section-${sectionId}`} data-section-id={sectionId}>
  <SectionHeader
    sectionId={sectionId}
    title={title}
    tags={tags}
    hideTopSeparator={hideTopSeparator}
  />
  {blocks.map(block => <ContentBlock key={i} block={block} />)}
</section>
```

### CSS (Section.module.css)

- `margin-bottom: 0` -- sections butt up against each other
- `min-height: 100dvh` -- each section fills at least one viewport

---

## 3. SectionHeader Component

Each section has a header that starts expanded in the document flow and becomes sticky/collapsed as the user scrolls past it.

### DOM Structure

```html
<div id="header-block-{sectionId}" class="headerBlock">
  <!-- optional top separator (hidden for first section) -->
  <Separator />
  <div class="headerRow">
    <h2 class="title">{title}</h2>
    <div class="tags">
      {tags.map(tag => <TagPill key={i} label={tag} />)}
    </div>
  </div>
  <Separator />
</div>
```

### Dimensions (Expanded State -- from CSS)

| Element     | Desktop (>= 1024px) | Tablet (640-1023px) | Mobile (< 640px) |
| ----------- | -------------------- | ------------------- | ----------------- |
| Header block| height: 70px         | height: 60px        | height: 50px      |
| Title font  | clamp(20px,5vw,65px) | same                | same              |

### Collapsed State (set by ScrollManager)

When collapsed by the header stack reconciler:
- `position: fixed; top: {slotTop}px`
- `height: 26.5px` (HEADER_BLOCK_COLLAPSED_H)
- Header row height: `25.5px` (HEADER_ROW_COLLAPSED_H)
- Title font-size: `20.6px` (COLLAPSED_TITLE_SIZE)
- Tags switch from column layout to inline row
- `z-index: 50`
- `background: var(--color-bg)` (#F9F9F9)

### Click-to-Scroll

Collapsed headers are clickable. Clicking a collapsed header scrolls to that section via Lenis.

---

## 4. TagPill Component

Renders a single tag label in a pill-shaped container.

### CSS (TagPill.module.css)

| Property        | Value              |
| --------------- | ------------------ |
| width           | 140px              |
| min-height      | 20.5px             |
| border-radius   | 9999px (full pill) |
| border          | 0.5px solid var(--color-text) |
| font-size       | 14px               |
| font-weight     | var(--font-weight) (200) |
| text-align      | center             |
| display         | flex, align-items: center, justify-content: center |

**Note:** The original Figma design showed rectangular tag shapes (189px wide, 34.5px tall). The code uses a smaller pill shape (140px wide, 20.5px min-height, fully rounded corners).

---

## 5. Separator Component

`Separator.tsx` renders a 1px horizontal line:

```tsx
<div style={{ width: "100%", height: "1px", background: "var(--color-text)" }} />
```

These are used as top and bottom borders of section headers. The ScrollManager's separator dedup pass hides duplicate lines when headers are stacked.

---

## 6. ContentBlock Component

Renders a two-column grid for each content block within a section.

### Grid System

```tsx
gridTemplateColumns: `${splitLeft}fr ${splitRight}fr`
```

**Important:** The grid uses `fr` (fractional) units, NOT a fixed 8-column system. The `splitLeft` and `splitRight` values from the data define the ratio.

Common splits:
- `4 / 4` -- equal halves (most blocks)
- `8 / 6` -- wider left column (Redbull block 2)

### Column Types

Each column in a block has a `type` field:

| Type          | Renders                                              |
| ------------- | ---------------------------------------------------- |
| `image`       | `<img>` tag with `object-fit: cover; width: 100%`   |
| `text`        | `<p>` with body copy, `max-width: 425px`             |
| `titled-text` | `<h3>` sub-heading + `<p>` body copy                 |

### Column Alignment

Each column has an `align` field: `"top"` | `"center"` | `"bottom"`, applied via CSS classes:

- `alignTop` -- `align-self: flex-start`
- `alignCenter` -- `align-self: center`
- `alignBottom` -- `align-self: flex-end`

### Responsive

Below 768px, the grid collapses to single column (`1fr !important` via media query in ContentBlock.module.css).

### Images

All images use native HTML `<img>` tags (not Next.js `<Image>`). The `loading` attribute is not set (browser default). Image paths follow the pattern: `/images/{client}_{number}.png` (e.g., `/images/redbull_1.png`).

---

## 7. Content Data (`lib/data.ts`)

### Interfaces

```typescript
interface BlockColumn {
  type: "image" | "text" | "titled-text";
  content: string;
  alt?: string;
  align: "top" | "center" | "bottom";
  title?: string;
}

interface ContentBlockData {
  splitLeft: number;
  splitRight: number;
  columns: [BlockColumn, BlockColumn];
}

interface CaseStudy {
  type: "case-study";
  id: string;
  title: string;
  tags: string[];
  blocks: ContentBlockData[];
}

interface ServicesSection {
  type: "services";
  id: string;
  title: string;
  tags: string[];
  blocks: ContentBlockData[];
}
```

### Section Inventory

#### Redbull
- **ID:** `redbull`
- **Title:** `"Redbull"`
- **Tags:** `["Strategy", "Experiential"]`
- **Blocks:** 3 content blocks
  - Block 1: image (left, `redbull_1.png`) + text (right, body copy). Split: 4/4.
  - Block 2: image (left, `redbull_2.png`, align bottom) + text (right, align bottom). Split: **8/6** (asymmetric).
  - Block 3: image (left, `redbull_3.png`) + text (right). Split: 4/4.

#### Puma
- **ID:** `puma`
- **Title:** `"Puma"`
- **Tags:** `["Strategy"]`
- **Blocks:** 3 content blocks, all split 4/4.

#### Uniqlo
- **ID:** `uniqlo`
- **Title:** `"Uniqlo"`
- **Tags:** `["Strategy"]`
- **Blocks:** 3 content blocks, all split 4/4.

#### Services
- **ID:** `services`
- **Title:** `"SERVICES"` (uppercase)
- **Tags:** `["Strategy"]`
- **Blocks:** 3 blocks using `titled-text` type for sub-sections (Creative, Production, Talent & Partnerships). Sub-heading font: `clamp(36px, 4vw, 65px)`.

---

## 8. ContactPage Component

`ContactPage.tsx` renders the final section of the page.

```tsx
<section id="section-contact" className={styles.contactPage}>
  <img src="/images/avi.png" alt="Contact avatar" className={styles.avatar} />
</section>
```

### CSS (ContactPage.module.css)

- `height: 100dvh` -- full viewport height
- `display: flex; align-items: center; justify-content: center`
- Avatar image: `width: 200px; height: 200px; border-radius: 50%; object-fit: cover`
- `background: var(--color-bg)`

The mail icon (`MailIcon.tsx`) links to `#section-contact` to scroll here.

---

## 9. LogoBar Component

Always visible at the top of `<main>`. Sticky-positioned.

### DOM Structure

```html
<div class="logoBar">
  <Separator />
  <div class="logoRow">
    <button id="logo-home-btn">
      <WelcomeLogo width={24} height={...} color="black" />
    </button>
    <button id="go-up-btn" class="goUpPill">
      go up
    </button>
  </div>
  <Separator />
</div>
```

### CSS (LogoBar.module.css)

- `position: sticky; top: 0; z-index: 60`
- `height: var(--logo-bar-collapsed)` = 52px (includes separator lines)
- `background: var(--color-bg)` (#F9F9F9)
- Go-up pill: `border: 0.5px solid var(--color-text)`, `border-radius: 9999px`, `font-size: 14px`, hover `opacity: 0.6`

### Behaviour

- **Logo button:** Clicking scrolls to top (landing page) and re-locks gate
- **Go-up pill:** Same behaviour
- Both handlers are wired in `ScrollManager.tsx`
