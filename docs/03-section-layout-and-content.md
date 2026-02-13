# Feature Doc: Section Layout & Content Structure

> **Document version:** 1.0  
> **Last updated:** 2026-02-10  
> **Figma references:**  
> - `Full page flow: Initial Scroll State`  
> - `Full page flow: Scroll State 2 project 1 collapses to thinner entry row`

---

## 1. Overview

The main content area below the landing page is composed of **sections**. Each section has a **header** and one or more **content blocks**. There are two section types:

1. **Case Study** — Redbull, UNIQLO, Puma (3 total)
2. **Services** — a single section with 3 content blocks (Design, Develop, Distribute)

All sections follow a consistent structural pattern but have different internal content layouts.

---

## 2. Page Structure (DOM Order)

```
<main>
  ├── <LandingPage />                          100vh intro
  │
  ├── <LogoBar />                              Sticky top bar with "W" logo
  │   └── 0.5px separator line
  │
  ├── <Section id="redbull">                   Case Study 1
  │   ├── <SectionHeader title="Redbull" />
  │   ├── 0.5px separator line
  │   ├── <ContentBlock layout="6/2" />        Section 1: text-left, image-right
  │   └── <ContentBlock layout="2/6" />        Section 2: image-left, text-right
  │
  ├── 0.5px separator line
  │
  ├── <Section id="uniqlo">                    Case Study 2
  │   ├── <SectionHeader title="UNIQLO" />
  │   ├── 0.5px separator line
  │   ├── <ContentBlock layout="3/5" />        Image-left, text-right
  │   └── <ContentBlock layout="5/3" />        Text-left, image-right
  │
  ├── 0.5px separator line
  │
  ├── <Section id="puma">                      Case Study 3
  │   ├── <SectionHeader title="Puma" />
  │   ├── 0.5px separator line
  │   ├── <ContentBlock layout="6/2" />        Placeholder
  │   └── <ContentBlock layout="2/6" />        Placeholder
  │
  ├── 0.5px separator line
  │
  ├── <Section id="services">                  Services
  │   ├── <SectionHeader title="Services" />
  │   ├── 0.5px separator line
  │   ├── <ContentBlock layout="5/3">          Design
  │   │     └── sub-heading + body + image
  │   ├── <ContentBlock layout="3/5">          Develop
  │   │     └── image + sub-heading + body
  │   └── <ContentBlock layout="5/3">          Distribute
  │         └── sub-heading + body + image
  │
</main>
```

---

## 3. The Logo Bar

The logo bar is the persistent top element of the main content area. It contains the Welcome "W" logo mark and sits above all section headers.

### 3.1 Expanded State (Initial)

| Property       | Value                        |
| -------------- | ---------------------------- |
| Width          | Full viewport (1728 px ref)  |
| Height         | ~326 px                      |
| Padding        | 10 px all sides              |
| Background     | `#F9F9F9`                    |
| Content        | Large "W" logo (left-aligned within inner frame) |
| Right side     | Mail icon area (but mail icon is `position: fixed`, so this is just spacing) |

The inner frame (`Frame 9` → `Frame 6` → `Frame 4`) holds the logo SVG at ~350 × 306 px.

### 3.2 Collapsed State (Sticky)

| Property       | Value                        |
| -------------- | ---------------------------- |
| Width          | Full viewport                |
| Height         | ~41 px                       |
| Background     | `#F9F9F9`                    |
| Content        | Small "W" logo (~36 × 31.5 px, left-aligned) |
| Position       | `sticky`, `top: 0`           |
| z-index        | 90                           |

### 3.3 Transition

See [02-scroll-system-and-animations.md](./02-scroll-system-and-animations.md) §4 for the continuous interpolation details.

---

## 4. Section Header

Every section (case study or services) begins with a section header. This is the element that participates in the sticky-stack system.

### 4.1 Expanded State

```
┌─────────────────────────────────────────────────────────┐
│  REDBULL                                  ┌─────────┐  │
│  (83px, Manrope ExtraLight, small-caps)   │Strategy │  │
│                                           ├─────────┤  │
│                                           │Strategy │  │
│                                           └─────────┘  │
└─────────────────────────────────────────────────────────┘
```

| Property              | Value                              |
| --------------------- | ---------------------------------- |
| Width                 | Full content width (1708 px ref, ie viewport minus 10px padding each side) |
| Height                | 74 px (fixed)                      |
| Layout                | Horizontal: title (left) + tags frame (right) |
| Gap                   | 41 px between title and tags       |
| Title font size       | 83 px                              |
| Title font            | Manrope ExtraLight (200)           |
| Title colour          | `#1A1C21`                          |
| Title line-height     | ~110.8 px                          |
| Title text-transform  | `font-variant: small-caps`         |
| Title vertical align  | Centre (vertically centred in 74px container) |
| Tags                  | 2 × Tag pill components, stacked vertically with 5px gap |
| Border                | 0.5px line above and below (separate `<hr>` elements in DOM) |

### 4.2 Collapsed State

```
┌─────────────────────────────────────────────────────────┐
│  REDBULL                  ┌─────────┐ ┌─────────┐      │
│  (~35.6px)                │Strategy │ │Strategy │      │
└─────────────────────────────────────────────────────────┘
```

| Property              | Value                              |
| --------------------- | ---------------------------------- |
| Height                | ~34.5 px                           |
| Title font size       | ~35.6 px (visual, via scale)       |
| Tags                  | Same 2 pills, now side-by-side horizontally with 5px gap |
| Position              | `sticky`, `top` calculated based on stack position |
| Cursor                | `pointer` (clickable to auto-scroll back to section) |
| Background            | `#F9F9F9` (must be opaque to cover content scrolling behind) |

### 4.3 Tag Pills

| Property       | Value                        |
| -------------- | ---------------------------- |
| Width          | 189 px (fixed)               |
| Height         | 34.5 px                      |
| Background     | `#FFFFFF`                    |
| Border         | 1px solid `#808080`          |
| Padding        | 0 62px (horizontally centred text) |
| Text           | "Strategy" (placeholder)     |
| Font           | Manrope ExtraLight (200)     |
| Alignment      | Centre (both axes)           |
| Border radius  | 0 (rectangular)              |
| Interaction    | Will be clickable filters (future). For now: static. |

---

## 5. Content Blocks

Content blocks are the full-width modules that sit below a section header. They contain the actual case study or services content.

### 5.1 Grid System

Content blocks use an **8-column grid** that allows flexible split ratios.

| Grid property    | Value                          |
| ---------------- | ------------------------------ |
| Columns          | 8 equal columns                |
| Gutter (gap)     | 10 px (from Figma `itemSpacing: 10`) |
| Container width  | 1708 px (viewport - 20px padding) |
| Column width     | (1708 - 7×10) / 8 ≈ **204.75 px** per column |

### 5.2 Split Ratios

Content blocks consist of 2 children (columns) that divide the 8-column grid:

| Split notation | Left columns | Right columns | Left width (approx) | Right width (approx) |
| -------------- | ------------ | ------------- | -------------------- | --------------------- |
| `6/2`          | 6            | 2             | ~1243 px             | ~420 px               |
| `2/6`          | 2            | 6             | ~420 px              | ~1243 px              |
| `5/3`          | 5            | 3             | ~1030 px             | ~633 px               |
| `3/5`          | 3            | 5             | ~633 px              | ~1030 px              |
| `4/4`          | 4            | 4             | ~832 px              | ~832 px               |

The split ratio is defined per content block and will eventually be configurable in Sanity CMS. For now, hardcoded per section.

### 5.3 Content Block Types

#### Type A: Image + Text (Case Study)

Two columns:
- **Image column:** A single image, `object-fit: cover`, fills the full column height.
- **Text column:** Body text (15px Manrope ExtraLight, `#1A1C21`, line-height 17px) positioned at the bottom of the column using `align-items: flex-end` or `justify-content: flex-end`.

Text block dimensions from Figma:
- Width: ~395 px (constrained within its column)
- Content: Placeholder body copy
- Vertical alignment: **bottom** of the text frame (`textAlignVertical: "BOTTOM"` in Figma)

#### Type B: Image + Titled Text (Services)

Two columns:
- **Text column:** Contains a sub-heading (e.g., "Design", "Develop", "Distribute") at 65px Manrope ExtraLight, followed by body text at 15px.
- **Image column:** A placeholder image/colour block (`#C8C8C8` grey, 767 × 649 px).

### 5.4 Case Study Content Layouts (from Figma)

#### Redbull (Case Study 1)

| Block    | Split  | Left column                     | Right column                    | Heights     |
| -------- | ------ | ------------------------------- | ------------------------------- | ----------- |
| Section 1 | ~6/2 | Text block (395×96 px, bottom-aligned) within 997px frame, 131px internal spacing | Image (670 × 471 px) | ~471 px    |
| Section 2 | ~2/6 | Image (1296 × 905 px)          | Text block (395×96 px, bottom-aligned) within 402px frame | ~905 px    |

#### UNIQLO (Case Study 2)

| Block    | Split  | Left column                     | Right column                    | Heights     |
| -------- | ------ | ------------------------------- | ------------------------------- | ----------- |
| Section 1 | ~3/5 | Image (631 × 539 px)           | Text block within 1067px frame  | ~539 px     |
| Section 2 | ~5/3 | Text block within 1049px frame  | Image (649 × 554 px)           | ~554 px     |

#### Puma (Case Study 3) — Placeholder

| Block    | Split  | Left column     | Right column    | Heights     |
| -------- | ------ | --------------- | --------------- | ----------- |
| Section 1 | 6/2  | Text placeholder | Image placeholder | ~471 px   |
| Section 2 | 2/6  | Image placeholder | Text placeholder | ~905 px   |

### 5.5 Services Content Layout

The Services section contains 3 content blocks, each with a **sub-heading**, **body text**, and an **image**.

| Block      | Split | Left column                  | Right column                    | Height  |
| ---------- | ----- | ---------------------------- | ------------------------------- | ------- |
| Design     | 5/3   | Sub-heading (65px) + Body text (15px, 425×386 px) | Grey placeholder image (767×649 px) | 649 px  |
| Develop    | 3/5   | Grey placeholder image (767×649 px) | Sub-heading (65px) + Body text (15px, 425×311 px) | 649 px  |
| Distribute | 5/3   | Sub-heading (65px) + Body text (15px, 425×311 px) | Grey placeholder image (767×649 px) | 649 px  |

### 5.6 Services Sub-headings

| Property       | Value                        |
| -------------- | ---------------------------- |
| Font           | Manrope ExtraLight (200)     |
| Size           | 65 px                        |
| Colour         | `#000000`                    |
| Line height    | 27 px (tight — text overflows visually, this is a display style) |
| Text transform | None (title case as authored) |

---

## 6. Separator Lines

Thin horizontal lines separate major structural elements.

| Property   | Value         |
| ---------- | ------------- |
| Width      | 1708 px (full content width) |
| Height     | 0.5 px        |
| Colour     | `#000000`     |
| Position   | In document flow (not sticky) |

### Placement Rules

- **Between logo bar and first section header**
- **Between each section header and its first content block** (above and below the header, forming a bordered row)
- **Between each section** (after the last content block of one section, before the header of the next)

Lines are **not** placed between content blocks within the same section.

---

## 7. Content Data Structure (Hardcoded for Now, Sanity-Ready)

```typescript
interface CaseStudy {
  id: string;                    // e.g. "redbull"
  title: string;                 // e.g. "Redbull"
  tags: string[];                // e.g. ["Strategy", "Strategy"]
  blocks: ContentBlock[];
}

interface ContentBlock {
  id: string;
  splitLeft: number;             // 1-8 (columns for left)
  splitRight: number;            // 1-8 (columns for right)
  leftContent: BlockColumn;
  rightContent: BlockColumn;
}

interface BlockColumn {
  type: 'image' | 'text' | 'titled-text';
  image?: {
    src: string;                 // static import path
    alt: string;
  };
  body?: string;                 // paragraph text
  subHeading?: string;           // for services sub-sections
}

interface ServicesSection {
  id: 'services';
  title: string;                 // "Services"
  tags: string[];
  blocks: ServiceBlock[];        // 3 blocks: Design, Develop, Distribute
}

// ServiceBlock extends ContentBlock with subHeading support
```

### 7.1 Hardcoded Content (Phase 1)

```typescript
const caseStudies: CaseStudy[] = [
  {
    id: 'redbull',
    title: 'Redbull',
    tags: ['Strategy', 'Strategy'],
    blocks: [
      {
        id: 'redbull-1',
        splitLeft: 6,
        splitRight: 2,
        leftContent: { type: 'text', body: '/* placeholder */' },
        rightContent: { type: 'image', image: { src: '/images/redbull-01.jpg', alt: 'Redbull campaign' } },
      },
      {
        id: 'redbull-2',
        splitLeft: 2,
        splitRight: 6,
        leftContent: { type: 'image', image: { src: '/images/redbull-02.jpg', alt: 'Redbull campaign' } },
        rightContent: { type: 'text', body: '/* placeholder */' },
      },
    ],
  },
  {
    id: 'uniqlo',
    title: 'UNIQLO',
    tags: ['Strategy', 'Strategy'],
    blocks: [
      {
        id: 'uniqlo-1',
        splitLeft: 3,
        splitRight: 5,
        leftContent: { type: 'image', image: { src: '/images/uniqlo-01.jpg', alt: 'UNIQLO campaign' } },
        rightContent: { type: 'text', body: '/* placeholder */' },
      },
      {
        id: 'uniqlo-2',
        splitLeft: 5,
        splitRight: 3,
        leftContent: { type: 'text', body: '/* placeholder */' },
        rightContent: { type: 'image', image: { src: '/images/uniqlo-02.jpg', alt: 'UNIQLO campaign' } },
      },
    ],
  },
  {
    id: 'puma',
    title: 'Puma',
    tags: ['Strategy', 'Strategy'],
    blocks: [
      {
        id: 'puma-1',
        splitLeft: 6,
        splitRight: 2,
        leftContent: { type: 'text', body: '/* placeholder */' },
        rightContent: { type: 'image', image: { src: '/images/puma-01.jpg', alt: 'Puma campaign' } },
      },
      {
        id: 'puma-2',
        splitLeft: 2,
        splitRight: 6,
        leftContent: { type: 'image', image: { src: '/images/puma-02.jpg', alt: 'Puma campaign' } },
        rightContent: { type: 'text', body: '/* placeholder */' },
      },
    ],
  },
];

const servicesSection: ServicesSection = {
  id: 'services',
  title: 'Services',
  tags: ['Strategy', 'Strategy'],
  blocks: [
    {
      id: 'services-design',
      splitLeft: 5,
      splitRight: 3,
      leftContent: { type: 'titled-text', subHeading: 'Design', body: '/* placeholder */' },
      rightContent: { type: 'image', image: { src: '/images/services-design.jpg', alt: 'Design services' } },
    },
    {
      id: 'services-develop',
      splitLeft: 3,
      splitRight: 5,
      leftContent: { type: 'image', image: { src: '/images/services-develop.jpg', alt: 'Development services' } },
      rightContent: { type: 'titled-text', subHeading: 'Develop', body: '/* placeholder */' },
    },
    {
      id: 'services-distribute',
      splitLeft: 5,
      splitRight: 3,
      leftContent: { type: 'titled-text', subHeading: 'Distribute', body: '/* placeholder */' },
      rightContent: { type: 'image', image: { src: '/images/services-distribute.jpg', alt: 'Distribution services' } },
    },
  ],
};
```

---

## 8. Images

### Phase 1 (Current)
- All images are static assets bundled in `/public/images/`.
- Images should be optimised (WebP with JPEG fallback).
- Use Next.js `<Image>` component for automatic optimisation, lazy loading, and responsive `srcset`.
- Placeholder images: solid grey `#C8C8C8` blocks for services, actual project photos for case studies.

### Phase 2 (Sanity CMS)
- Images served from Sanity CDN via `@sanity/image-url`.
- Hot-spot / crop data from Sanity used for `object-position`.
- The component structure should already support swapping `src` from a static path to a Sanity image URL builder.

---

## 9. Body Text

All body/paragraph text across sections uses:

| Property       | Value                  |
| -------------- | ---------------------- |
| Font           | Manrope ExtraLight 200 |
| Size           | 15 px                  |
| Line height    | 17 px                  |
| Colour         | `#1A1C21`              |
| Max width      | ~395–425 px (constrained within column, not full column width) |
| Vertical align | Bottom of frame (case studies), Top of frame (services) |

---

## 10. Component Hierarchy

```
<MainContent>
  <LogoBar />
  <Separator />

  {caseStudies.map(study => (
    <Section key={study.id}>
      <SectionHeader
        title={study.title}
        tags={study.tags}
        sectionId={study.id}     // for scroll-to-section on click
      />
      <Separator />
      {study.blocks.map(block => (
        <ContentBlock
          key={block.id}
          splitLeft={block.splitLeft}
          splitRight={block.splitRight}
          leftContent={block.leftContent}
          rightContent={block.rightContent}
        />
      ))}
      <Separator />
    </Section>
  ))}

  <Section key="services">
    <SectionHeader title="Services" tags={['Strategy','Strategy']} sectionId="services" />
    <Separator />
    {servicesSection.blocks.map(block => (
      <ContentBlock key={block.id} ... />
    ))}
  </Section>
</MainContent>
```

### Component Props Summary

| Component        | Key Props                                                             |
| ---------------- | --------------------------------------------------------------------- |
| `LogoBar`        | `collapsed: boolean` (driven by scroll), `logoScale: number`          |
| `SectionHeader`  | `title`, `tags[]`, `sectionId`, `state: 'expanded'|'collapsed'|'dismissed'` |
| `ContentBlock`   | `splitLeft`, `splitRight`, `leftContent`, `rightContent`              |
| `BlockColumn`    | `type`, `image?`, `body?`, `subHeading?`                              |
| `Separator`      | None (pure presentational)                                            |
| `TagPill`        | `label`                                                               |
