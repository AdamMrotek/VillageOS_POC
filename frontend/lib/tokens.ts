/** Meadow design tokens — source of truth for inline styles and JS logic. */

export const T = {
  bg:             '#F4F1EA',  // page background — warm off-white
  surface:        '#FFFFFF',  // card / panel surface
  surfaceAlt:     '#EBE6DA',  // secondary surface, empty states
  ink:            '#16221A',  // primary text, headings, strong borders
  inkSoft:        '#4A5346',  // secondary text, subtitles
  inkMute:        '#8A8F83',  // tertiary text, labels, meta
  hairline:       '#D8D1BF',  // borders, dividers, grid lines
  accent:         '#5C7A4A',  // primary accent — forest green
  accentSoft:     '#D4DCC4',  // accent surface, badges, prep panel bg
  accentDark:     '#3F5731',  // accent text on light backgrounds
  warm:           '#C28A1F',  // warm highlight — deadlines, urgent items
  warmSurface:    '#F2E4C6',  // warm card background
} as const

export type Token = keyof typeof T

export const fonts = {
  serif:  "var(--font-serif, 'Source Serif 4', Georgia, serif)",
  sans:   "var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)",
  mono:   "var(--font-mono, 'IBM Plex Mono', ui-monospace, monospace)",
} as const

/** Left-border accent color per event type. */
export const eventColors: Record<string, string> = {
  school:     '#3B82F6',  // blue-500
  sport:      T.accent,
  birthday:   '#EC4899',  // pink-500
  fundraiser: '#F97316',  // orange-500
  meeting:    '#EAB308',  // yellow-500
  deadline:   '#EF4444',  // red-500
  default:    T.inkMute,
} as const

/** Background tint per event type (for chip fill). */
export const eventSurfaces: Record<string, string> = {
  school:     '#DBEAFE',  // blue-100
  sport:      T.accentSoft,
  birthday:   '#FCE7F3',  // pink-100
  fundraiser: '#FFEDD5',  // orange-100
  meeting:    '#FEF9C3',  // yellow-100
  deadline:   T.warmSurface,
  default:    T.surfaceAlt,
} as const
