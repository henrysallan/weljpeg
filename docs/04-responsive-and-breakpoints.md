# Feature Doc: Responsive Design & Breakpoints

> **Document version:** 2.0
> **Last updated:** 2025-02-15
> **Implementation:** `globals.css`, all `*.module.css` files

---

## 1. Overview

The site uses a mobile-first approach with CSS custom properties and media queries. There are three effective breakpoint tiers defined across various CSS module files and `globals.css`.

---

## 2. Breakpoint Tiers

| Tier     | Range            | Key Trigger                                              |
| -------- | ---------------- | -------------------------------------------------------- |
| Mobile   | < 640px          | `@media (max-width: 639px)` in globals and module CSS    |
| Tablet   | 640px -- 1023px  | `@media (min-width: 640px) and (max-width: 767px)` for padding; some components use 1023px |
| Desktop  | >= 1024px        | Default styles (no media query)                          |

**Note:** The breakpoints are not perfectly consistent across all files. Most component CSS uses 639px/640px as the mobile/tablet boundary, and some use 768px or 1024px for further refinements.

---

## 3. CSS Custom Properties (globals.css)

### Default (Desktop)

```css
:root {
  --color-bg: #F9F9F9;
  --color-text: #1A1C21;
  --color-icon-line: #33363F;
  --font-weight: 200;
  --page-padding: 10px;
  --logo-bar-expanded: 316px;   /* Not used in practice */
  --logo-bar-collapsed: 52px;
  --header-collapsed: 25.5px;
  --z-mail-icon: 100;
}
```

### Mobile Override (max-width: 639px)

```css
@media (max-width: 639px) {
  :root {
    --page-padding: 8px;
  }
}
```

### Tablet Override (640px -- 767px)

```css
@media (min-width: 640px) and (max-width: 767px) {
  :root {
    --page-padding: 20px;
  }
}
```

---

## 4. Component Responsive Behaviour

### 4.1 Landing Page (`LandingPage.module.css`)

| Property              | Desktop (>= 640px) | Mobile (< 640px)                    |
| --------------------- | ------------------- | ----------------------------------- |
| Cluster alignment     | Centred             | Left-aligned (`justify-content: flex-start; padding-left: 8px`) |
| Cluster width         | 314px               | `calc(100% - 40px)`, max 314px     |
| Font sizes            | 20px                | `clamp(18px, 5vw, 24px)`           |
| Title line-height     | 24px                | 20px                                |

### 4.2 SectionHeader (`SectionHeader.module.css`)

| Property            | Desktop (>= 1024px) | Tablet (640-1023px) | Mobile (< 640px) |
| ------------------- | -------------------- | ------------------- | ----------------- |
| Header block height | 70px                 | 60px                | 50px              |
| Title font-size     | clamp(20px,5vw,65px) | same (clamp handles it) | same          |
| Tags                | Visible, column      | Visible             | Hidden (`display: none`) |
| Title alignment     | Left, centred vertically | Same             | Same              |

The title uses `clamp(20px, 5vw, 65px)` which provides fluid scaling across all breakpoints.

### 4.3 ContentBlock (`ContentBlock.module.css`)

| Property         | Desktop         | Mobile (< 768px)        |
| ---------------- | --------------- | ----------------------- |
| Grid columns     | `{splitLeft}fr {splitRight}fr` | `1fr !important` (single column) |
| Image width      | 100% of column  | 100% of viewport width  |
| Text max-width   | 425px           | 425px (unchanged)       |

### 4.4 TagPill (`TagPill.module.css`)

No responsive overrides. The pill stays 140px wide at all sizes. Tags are hidden on mobile via the parent SectionHeader's `display: none` on the tags container.

### 4.5 MailIcon (`MailIcon.module.css`)

| Property | Desktop       | Mobile (< 640px) |
| -------- | ------------- | ----------------- |
| Width    | 52px          | 40px              |
| Height   | 41px          | 32px              |
| Padding  | 12px 14px     | 8px 10px          |

### 4.6 LogoBar (`LogoBar.module.css`)

No responsive overrides. Height is always `var(--logo-bar-collapsed)` (52px). The `--page-padding` custom property handles horizontal insets.

### 4.7 ContactPage (`ContactPage.module.css`)

No responsive overrides. The avatar remains 200x200px centred at all sizes.

---

## 5. Font System

### Self-Hosted Variable Font

```typescript
// layout.tsx
const manrope = localFont({
  src: "../public/fonts/Manrope-VariableFont_wght.ttf",
  variable: "--font-manrope",
  weight: "200 800",
});
```

The font is loaded via `next/font/local` and applied globally. The CSS variable `--font-manrope` is available throughout the app.

### Font Weight

All body text uses weight 200 (ExtraLight), set via `--font-weight: 200` in globals.css. Individual elements can override this.

### Fluid Typography

Key fluid font-size declarations:

| Element               | Declaration                    | Min    | Preferred | Max    |
| --------------------- | ------------------------------ | ------ | --------- | ------ |
| Section title         | `clamp(20px, 5vw, 65px)`      | 20px   | 5vw       | 65px   |
| Services sub-heading  | `clamp(36px, 4vw, 65px)`      | 36px   | 4vw       | 65px   |
| Landing title (mobile)| `clamp(18px, 5vw, 24px)`      | 18px   | 5vw       | 24px   |

---

## 6. Viewport Units

The site uses `dvh` (dynamic viewport height) units:

- **Landing page:** `height: 100dvh`
- **ContactPage:** `height: 100dvh`
- **Section:** `min-height: 100dvh`

`dvh` accounts for mobile browser chrome (address bar, toolbar) that changes the visible viewport height.

---

## 7. Image Strategy

All images use native HTML `<img>` tags with `object-fit: cover`. The Next.js `<Image>` component is **not** used.

Image paths:
- Case study images: `/images/{client}_{number}.png` (e.g., `redbull_1.png`)
- Landing carousel images: Same pool as above
- ImageSquiggle images: Loaded from `/images/landingimages/posts.json`
- Contact avatar: `/images/avi.png`

No responsive `srcset` or `sizes` attributes are set. No lazy loading attributes are explicitly configured.
