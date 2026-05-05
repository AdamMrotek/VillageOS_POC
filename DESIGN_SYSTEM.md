# VillageOS — Design System

**Version:** 0.2  
**Date:** 2026-05-05  
**Status:** Implemented — tokens live in CSS + TS  
**Source of truth:** `frontend/lib/tokens.ts` · `frontend/app/globals.css`  
**Component library:** shadcn/ui New York · `frontend/components/ui/`  
**Icons:** Lucide React (already in package.json)

---

## Direction

**Meadow** — warm, editorial, calm. The visual language borrows from print: serif display type, muted earthy tones, generous whitespace, and a clear ink-on-paper hierarchy. The goal is a tool that feels quiet and considered, not a dashboard.

---

## Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#F4F1EA` | Page background — warm off-white |
| `surface` | `#FFFFFF` | Card / panel surface |
| `surfaceAlt` | `#EBE6DA` | Secondary surface, empty states |
| `ink` | `#16221A` | Primary text, headings, strong borders |
| `inkSoft` | `#4A5346` | Secondary text, subtitles |
| `inkMute` | `#8A8F83` | Tertiary text, labels, meta |
| `hairline` | `#D8D1BF` | Borders, dividers, grid lines |
| `accent` | `#5C7A4A` | Primary accent — forest green |
| `accentSoft` | `#D4DCC4` | Accent surface, badges, prep panel bg |
| `accentDark` | `#3F5731` | Accent text on light backgrounds |
| `warm` | `#C28A1F` | Warm highlight — deadlines, urgent items |
| `warmSurface` | `#F2E4C6` | Warm card background (`card-urgent`) |

---

## Typography

### Font Stacks

| Role | Stack | Usage |
|------|-------|-------|
| `display` | `'Newsreader', 'Source Serif 4', Georgia, serif` | Headings, dates, hero numbers |
| `sans` | `'General Sans', 'Söhne', -apple-system, BlinkMacSystemFont, sans-serif` | Body, UI, navigation |
| `mono` | `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace` | Times, metadata, tags, counts |

**Loaded from Google Fonts:** Newsreader (ital, 300–700, opsz 6–72) + JetBrains Mono (400, 500, 600).  
General Sans falls back to system sans — load via self-host if licensed in production.

### Scale (used in meadow)

| Use | Size | Font | Notes |
|-----|------|------|-------|
| Hero headline | 60px | display | `font-weight: 400`, `letter-spacing: -0.025em` |
| Section heading | 30px | display | `font-weight: 400`, `letter-spacing: -0.015em` |
| Card heading | 22px | display | `font-weight: 400` |
| Stat number | 36px | display | `font-variant-numeric: tabular-nums` |
| Body | 13px | sans | `font-weight: 500` |
| Meta / secondary | 11–12px | sans or mono | |
| Label / eyebrow | 9.5px | sans or mono | `letter-spacing: 0.18–0.22em`, `text-transform: uppercase`, `font-weight: 600` |

---

## Box Model

### Shadows

**None.** The design is entirely flat. Depth comes from background-color contrast (`bg` → `surface`) and borders, never drop shadows. Do not add `box-shadow` to any element.

---

### Border Radius Scale

| Value | Usage |
|-------|-------|
| `1px` | Confidence dot bars |
| `4px` | Badges (AI, BETA, URGENT), count pills, buttons, event chips, small tags |
| `5px` | Dot inside AI badge (circle at 5×5) |
| `12px` | Mobile cards (today panel, review panel, prep mini) |
| `16px` | Main desktop panels (CenterColumn, RightRail panels) |
| `= size` | Circles / avatars — set radius equal to width/height (28px avatar → `border-radius: 28px`) |
| `40px` | Mobile device frame |
| `64–80px` | Empty-state icon circles |

---

### Lines & Borders — Semantic Roles

The design uses lines in four distinct roles. Use the right one — mixing them breaks the visual hierarchy.

#### 1. Structural break  
`border-bottom: 2px solid T.ink`  
Full ink weight. Signals a hard section change — used once per panel, directly under the panel's title/header. Example: the bottom edge of the CenterColumn header ("Week of 4 May").

#### 2. Data separator — counts / stats  
`border-top: 1px solid T.ink`  
Full ink weight, top side. Sits directly above stat numbers (events this week, prep count, confidence %). The line *introduces* the number — it reads like a column rule in print. `padding-top: 10px` (desktop) or `8px` (mobile) keeps the number clear of the rule.

#### 3. Hairline divider  
`border: 1px solid T.hairline` (or `border-top/bottom/right`)  
Warm grey. The workhorse. Used for:
- Panel / card outlines
- Week-day column vertical separators (`border-right`)
- Week-day header bottom edge
- Topbar bottom edge
- Selected-event strip top edge
- Discovery list row dividers
- Vertical dividers inside the detail strip (`border-left`, `padding-left: 20px`)
- Meta chip / count pill outline

#### 4. Contextual accent line  
| Style | Where |
|-------|-------|
| `border-bottom: 1.5px solid T.accent` | Active nav item underline |
| `border-left: 2px solid T.accent` | Event chip — sport / accent tone |
| `border-left: 2px solid T.warm` | Event chip — warm / deadline tone |
| `border-left: 2px solid T.inkMute` | Event chip — default tone |
| `border-bottom: 1px solid rgba(63,87,49,0.15)` | Prep list row dividers (on `T.accentSoft` bg — full hairline would be too loud) |
| `border: 1px solid rgba(255,255,255,0.2)` | Ghost button on dark (`T.ink`) background |

---

### Padding Scale

| Value | Usage |
|-------|-------|
| `2px 5px` | URGENT badge |
| `2px 6px` | BETA badge, provider tag pills |
| `4px 8px` | AI badge |
| `4px 10px` | Count / meta pill (e.g. "4 events") |
| `7px 14px` | Topbar inline button (Extract) |
| `8px 10px` | Week-day content area; event chip |
| `10px` | Full-width action button (Review N events) |
| `10px 14px` | Ghost button |
| `10px 16px` | Primary / confirm button |
| `12px 14px` | Week-day header cell |
| `14px` | Mobile prep mini panel |
| `16px` | Mobile cards (today, awaiting review) |
| `18px 28px` | Selected-event detail strip |
| `22px` | RightRail panels (prep, discovery) |
| `24px 28px 18px` | CenterColumn section header |
| `32px 40px 36px` | Desktop layout outer wrapper |
| `54px 20px 24px` | Mobile wrapper (54px top accommodates status bar) |
| `40px` | Empty-state centered content area |

---

### Gap / Spacing Scale

| Value | Usage |
|-------|-------|
| `2px` | Confidence dot internal gap |
| `4px` | Tag row |
| `6px` | Event chip internal stack; AI badge icon gap |
| `8px` | Header badge row; detail strip small gap |
| `10px` | Prep row grid gap; mobile event row grid gap; stats grid (mobile) |
| `12px` | Controls bar gap |
| `14px` | Eyebrow → heading bottom margin |
| `16px` | RightRail between panels; empty-state icon gap |
| `20px` | Main column grid gap; stats grid (desktop) |
| `22px` | Nav items |
| `24px` | Selected-event strip column gap; layout section vertical gap |
| `32px` | Logo → nav gap |
| `40px` | Hero grid gap |

---

### Layout Grids

| Context | Columns | Gap |
|---------|---------|-----|
| Desktop body | `1.7fr 1fr` (content : right rail) | `20px` |
| Hero area | `1.5fr 1fr` (headline : stats) | `40px` |
| Week calendar | `repeat(7, 1fr)` | none (borders used instead) |
| Stats row | `repeat(3, 1fr)` | `20px` desktop / `10px` mobile |
| Prep list row | `70px 1fr` | `10px` |
| Mobile event row | `52px 1fr` | `10px` |
| Provider row | `1fr auto` | `10px` |
| Selected-event strip | `1fr auto auto auto` | `24px` |

---

### Frame Sizes (mock/preview only)

| Context | Size |
|---------|------|
| Desktop frame | `1440 × 1020px` |
| Mobile frame | `390 × 844px`, `border-radius: 40px` |

---

## Event Type Colours

Used for left-border accents on event chips and calendar dots.

| Type | Accent color |
|------|-------------|
| `school` | `bg-blue-500` |
| `sport` | `bg-green-500` / `T.accent` |
| `birthday` | `bg-pink-500` |
| `fundraiser` | `bg-orange-500` / `T.warm` |
| `meeting` | `bg-yellow-500` |
| `deadline` | `bg-red-500` |

---

## Component Patterns

### Eyebrow label
```
font-size: 9.5px
letter-spacing: 0.18–0.22em
text-transform: uppercase
font-weight: 600
color: T.inkMute or T.accent
```

### Event chip
```
padding: 8px 10px
border-radius: 4px
background: T.surfaceAlt | T.accentSoft | T.warmSurface
border-left: 2px solid <accent | warm | inkMute>
```

### AI badge
```
font-size: 10px, letter-spacing: 0.14em, uppercase
color: T.accentDark
background: T.accentSoft
padding: 4px 8px, border-radius: 4px
Dot: 5×5px, border-radius: 5px, background: T.accent
```

### Confidence dots
5 × `4×8px` bars, `border-radius: 1px`.  
Filled: `T.accent`. Empty: `T.hairline`.

### Primary button
```
background: T.ink
color: T.surface
padding: 10px 16px, border-radius: 4px
font-size: 12px, font-weight: 500, letter-spacing: 0.02em
```

### Accent button (confirm / review)
```
background: T.accent
color: T.surface
(same sizing as primary)
```

---

## shadcn/ui Theme

**Style:** New York (`components.json → "style": "new-york"`)  
shadcn's standard CSS var slots are wired to Meadow tokens in `globals.css (:root)`.

| shadcn slot | Meadow token | Value |
|---|---|---|
| `--background` | `T.bg` | `#F4F1EA` |
| `--foreground` | `T.ink` | `#16221A` |
| `--card` | `T.surface` | `#FFFFFF` |
| `--primary` | `T.ink` | `#16221A` — dark button |
| `--secondary` | `T.surfaceAlt` | `#EBE6DA` |
| `--muted-foreground` | `T.inkMute` | `#8A8F83` |
| `--accent` | `T.accentSoft` | `#D4DCC4` — hover tint |
| `--border` | `T.hairline` | `#D8D1BF` |
| `--ring` | `T.accent` | `#5C7A4A` — focus ring |
| `--destructive` | red-500 | deadlines / errors |
| `--radius` | 4px base | buttons, chips |

---

## Semantic CSS Classes

Most classes are defined in `globals.css @layer components` and compose with Tailwind utilities.  
Exception: `.text-secondary` lives in `@layer utilities` — Tailwind v4 auto-generates a `text-secondary` utility from `--color-secondary` (surfaceAlt, near-invisible beige), so the override must sit in the utilities layer to win.

### WCAG AA contrast overrides

`inkMute` (#8A8F83) is ~3.3:1 on white and lower on tinted surfaces — below the 4.5:1 AA threshold for small text. `globals.css @layer components` automatically steps up muted text classes to `inkSoft` (#4A5346, ~8:1) when nested inside any card:

```
.card-default   .text-eyebrow / .text-footer / .text-meta / .text-time / .text-time-prominent → inkSoft
.card-default-mobile  (same)
.card-secondary (same)
.card-accent    (same)
.card-urgent    (same)
.card-secondary .text-secondary → ink  (full contrast on tinted bg)
.card-accent    .text-secondary → ink
.card-urgent    .text-secondary → ink
```

Do not override these rules with `text-village-ink-mute` on card backgrounds — they exist for WCAG compliance.

### Typography

| Class | Font | Size | Use |
|---|---|---|---|
| `.text-hero` | serif | 60px | Full-page hero, date display |
| `.text-title` | serif | 30px | Panel / page title |
| `.text-heading` | serif | 22px | Card heading, modal title |
| `.text-stat` | serif | 36px | Large counts, stats |
| `.text-body` | sans | 13px/500 | Primary body copy |
| `.text-secondary` | sans | 13px/400 | Softer secondary text |
| `.text-meta` | sans | 11px | Labels, captions, counts |
| `.text-eyebrow` | sans | 9.5px | UPPERCASE section labels |
| `.text-eyebrow-accent` | sans | 9.5px | UPPERCASE on accent panels |
| `.text-time` | mono | 11px | Muted timestamps ("9:30 AM") |
| `.text-time-prominent` | mono | 12px/500 | Time in selected event strip |
| `.text-date-hero` | serif | 60px | Large "4 May" display |
| `.text-date-label` | mono | 11px | "MON 05" column headers |
| `.text-date-day` | serif | 22px | Day number in week grid |
| `.text-footer` | sans | 11px | Card footer, attribution |

### Cards

No `box-shadow` anywhere. Depth via background contrast + borders only.

| Class | Background | Border | Radius | Use |
|---|---|---|---|---|
| `.card-default` | `T.surface` | hairline | 16px | Main desktop panels |
| `.card-default-mobile` | `T.surface` | hairline | 12px | Mobile cards |
| `.card-secondary` | `T.surfaceAlt` | hairline | 16px | Sub-panels, empty states |
| `.card-accent` | `T.accentSoft` | accent 15% | 16px | Prep, AI suggestion areas |
| `.card-urgent` | `T.warmSurface` | hairline + warm left | 4px | Deadlines, urgent items |
| `.card-primary` | `T.ink` | none | 16px | Inverted CTA cards |

### Lines

| Class | Style | Rule |
|---|---|---|
| `.line-structural` | `border-bottom: 2px solid T.ink` | Once per panel, under its title/header only |
| `.line-data` | `border-top: 1px solid T.ink` + `padding-top: 10px` | Above stat numbers — introduces the number |
| `.line-data-mobile` | same + `padding-top: 8px` | Mobile variant |
| `.line-divider` | `border: 1px solid T.hairline` | Panel outlines, row separators |
| `.line-divider-top/bottom/right/left` | directional hairline | Column borders, topbar, strip edges |
| `.line-accent-nav` | `border-bottom: 1.5px solid T.accent` | Active nav item only |
| `.line-accent-event` | `border-left: 2px solid T.accent` | Sport / green event chips |
| `.line-warm-event` | `border-left: 2px solid T.warm` | Deadline / warm event chips |
| `.line-muted-event` | `border-left: 2px solid T.inkMute` | Default event chips |
| `.line-prep-row` | `border-bottom: 1px solid rgba(63,87,49,0.15)` | Prep rows on `T.accentSoft` bg |
| `.line-ghost-button` | `border: 1px solid rgba(255,255,255,0.2)` | Ghost button on `T.ink` bg |

---

## Tailwind Utilities (village palette)

The full `T` object is also exposed as Tailwind utilities via `@theme inline`:

```
bg-village-bg          text-village-ink         border-village-hairline
bg-village-surface     text-village-ink-soft    border-village-accent
bg-village-surface-alt text-village-ink-mute    border-village-warm
bg-village-accent-soft text-village-accent-dark
bg-village-warm-surface text-village-warm
```

---

## Implementation Status

- [x] `frontend/lib/tokens.ts` — `T`, `fonts`, `eventColors`, `eventSurfaces`
- [x] `frontend/app/globals.css` — shadcn theme vars, `@theme inline`, semantic classes
- [x] `frontend/components.json` — style set to `new-york`
- [x] `frontend/app/layout.tsx` — Newsreader + JetBrains Mono loaded via next/font
- [ ] `frontend/app/meadow/page.tsx` — migrate inline `T` definition to `import { T } from '@/lib/tokens'`
- [ ] Other pages — migrate `bg-zinc-50`, `text-zinc-500` etc. to semantic village classes
