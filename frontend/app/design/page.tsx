import { T, eventColors, eventSurfaces } from '@/lib/tokens'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Clock, User, ChevronRight, Plus, X, Check,
  AlertCircle, Info, Sparkles, MapPin, Flag, ArrowRight,
  Bell, Search, FileText, Settings, Home, ChevronDown,
  GraduationCap, Trophy, Gift, DollarSign, Users,
} from 'lucide-react'

// ─── Local helpers ────────────────────────────────────────────────────────────

const colorTokens = [
  { name: 'bg',           label: 'Background',   hex: T.bg },
  { name: 'surface',      label: 'Surface',       hex: T.surface },
  { name: 'surfaceAlt',   label: 'Surface Alt',   hex: T.surfaceAlt },
  { name: 'ink',          label: 'Ink',           hex: T.ink },
  { name: 'inkSoft',      label: 'Ink Soft',      hex: T.inkSoft },
  { name: 'inkMute',      label: 'Ink Mute',      hex: T.inkMute },
  { name: 'hairline',     label: 'Hairline',      hex: T.hairline },
  { name: 'accent',       label: 'Accent',        hex: T.accent },
  { name: 'accentSoft',   label: 'Accent Soft',   hex: T.accentSoft },
  { name: 'accentDark',   label: 'Accent Dark',   hex: T.accentDark },
  { name: 'warm',         label: 'Warm',          hex: T.warm },
  { name: 'warmSurface',  label: 'Warm Surface',  hex: T.warmSurface },
] as const

const eventTypes = [
  { type: 'school',     label: 'School Assembly',      time: '9:00 AM' },
  { type: 'sport',      label: 'Soccer Practice',       time: '3:30 PM' },
  { type: 'birthday',   label: "Emma's Birthday",       time: 'All day' },
  { type: 'fundraiser', label: 'Bake Sale',             time: '12:00 PM' },
  { type: 'meeting',    label: 'Parent Meeting',        time: '6:00 PM' },
  { type: 'deadline',   label: 'Permission Slip Due',   time: '11:59 PM' },
] as const

const radiusScale = [
  { value: '1px',  label: 'Confidence bars' },
  { value: '4px',  label: 'Badges / pills / Buttons / chips' },
  { value: '12px', label: 'Mobile cards' },
  { value: '16px', label: 'Desktop panels' },
]

const showcaseIcons = [
  Calendar, Clock, User, ChevronRight, Plus, X, Check,
  AlertCircle, Info, Sparkles, MapPin, Flag, ArrowRight,
  Bell, Search, FileText, Settings, Home, ChevronDown,
  GraduationCap, Trophy, Gift, DollarSign, Users,
]

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-6">
      <p className="text-eyebrow mb-2">{label}</p>
      <div className="line-structural" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-background px-10 py-8">
      {/* Page header */}
      <div className="max-w-[1200px] mx-auto mb-14">
        <p className="text-eyebrow-accent mb-2">VILLAGEOS · v0.2</p>
        <h1 className="text-hero mb-1">Design System</h1>
        <p className="text-secondary">Meadow — warm, editorial, calm.</p>
      </div>

      <div className="max-w-[1200px] mx-auto space-y-16">

        {/* ══ COLOR TOKENS ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="COLOR TOKENS" />
          <div className="grid grid-cols-6 gap-4">
            {colorTokens.map(({ name, label, hex }) => (
              <div key={name}>
                <div
                  className="h-14 rounded-lg border border-village-hairline mb-2"
                  style={{ background: hex }}
                />
                <p className="text-body text-[11px] font-semibold">{label}</p>
                <p className="text-time">{hex}</p>
                <p className="text-time">T.{name}</p>
              </div>
            ))}
          </div>
          {/* Event type accent row */}
          <div className="mt-6 grid grid-cols-6 gap-4">
            {(Object.entries(eventColors) as [string, string][])
              .filter(([k]) => k !== 'default')
              .map(([type, hex]) => (
                <div key={type}>
                  <div
                    className="h-10 rounded-lg mb-2"
                    style={{ background: hex }}
                  />
                  <p className="text-time capitalize">{type}</p>
                  <p className="text-time">{hex}</p>
                </div>
              ))}
          </div>
        </section>

        {/* ══ TYPOGRAPHY ════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="TYPOGRAPHY" />
          <div className="space-y-4">

            {/* Serif display */}
            <div className="card-default p-8 space-y-5">
              <p className="text-eyebrow mb-1">DISPLAY — NEWSREADER SERIF</p>
              <div className="line-divider-bottom pb-5">
                <p className="text-hero">The Village Calendar</p>
                <p className="text-time mt-1">.text-hero — 60px / 400 / −0.025em</p>
              </div>
              <div className="line-divider-bottom pb-5">
                <p className="text-title">Week of 4 May</p>
                <p className="text-time mt-1">.text-title — 30px / 400 / −0.015em</p>
              </div>
              <div className="line-divider-bottom pb-5">
                <p className="text-heading">Soccer Practice — Riverside Park</p>
                <p className="text-time mt-1">.text-heading — 22px / 400</p>
              </div>
              <div>
                <p className="text-stat">14</p>
                <p className="text-time mt-1">.text-stat — 36px / tabular-nums</p>
              </div>
            </div>

            {/* Sans body */}
            <div className="card-default p-8">
              <p className="text-eyebrow mb-5">BODY — GENERAL SANS</p>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-body">Primary body — Emma has soccer at 3:30 today.</p>
                    <p className="text-time">.text-body — 13px / 500</p>
                  </div>
                  <div>
                    <p className="text-secondary">Secondary — Signed permission slip required.</p>
                    <p className="text-time">.text-secondary — 13px / 400 / inkSoft</p>
                  </div>
                  <div>
                    <p className="text-meta">Meta — Riverside Park · 3:30–5:00 PM · Coach Dan</p>
                    <p className="text-time">.text-meta — 11px / inkMute</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-eyebrow">UPCOMING EVENTS · 4 TODAY</p>
                    <p className="text-time">.text-eyebrow — 9.5px / uppercase / +0.2em</p>
                  </div>
                  <div>
                    <p className="text-eyebrow-accent">AI SUGGESTIONS · 2 NEW</p>
                    <p className="text-time">.text-eyebrow-accent — same, accentDark</p>
                  </div>
                  <div>
                    <p className="text-footer">VillageOS · Powered by AI · Privacy Policy</p>
                    <p className="text-time">.text-footer — 11px / inkMute</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mono time/date */}
            <div className="card-default p-8">
              <p className="text-eyebrow mb-5">TIME & DATE — JETBRAINS MONO</p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-time">3:30 PM · Tue 06</p>
                  <p className="text-time mt-1">.text-time</p>
                </div>
                <div>
                  <p className="text-time-prominent">9:00 AM · 40 min</p>
                  <p className="text-time mt-1">.text-time-prominent</p>
                </div>
                <div>
                  <p className="text-date-label">MON 05 · MAY 2026</p>
                  <p className="text-time mt-1">.text-date-label</p>
                </div>
                <div>
                  <p className="text-date-hero">4</p>
                  <p className="text-time mt-1">.text-date-hero — large display</p>
                </div>
                <div>
                  <p className="text-date-day">14</p>
                  <p className="text-time mt-1">.text-date-day — week grid</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ BUTTONS ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="BUTTONS" />
          <div className="card-default p-8 space-y-6">

            <div>
              <p className="text-eyebrow mb-4">SHADCN VARIANTS</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="default">Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            <div className="line-divider-top pt-5">
              <p className="text-eyebrow mb-4">VILLAGE VARIANTS</p>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  className="inline-flex items-center px-4 py-[10px] rounded-[4px] bg-village-ink text-white text-[12px] font-medium tracking-[0.02em] hover:opacity-80 transition-opacity"
                >
                  Review 4 events
                </button>
                <button
                  className="inline-flex items-center px-4 py-[10px] rounded-[4px] bg-village-accent text-white text-[12px] font-medium tracking-[0.02em] hover:opacity-80 transition-opacity"
                >
                  Confirm prep
                </button>
                <button
                  className="inline-flex items-center px-[14px] py-[10px] rounded-[4px] bg-village-ink text-white text-[12px] font-medium tracking-[0.02em] hover:opacity-70 transition-opacity line-ghost-button"
                >
                  Ghost on ink
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-[4px] border border-village-hairline text-village-ink text-[12px] font-medium tracking-[0.02em] hover:bg-village-surface-alt transition-colors"
                >
                  <FileText size={13} /> Extract
                </button>
              </div>
            </div>

            <div className="line-divider-top pt-5">
              <p className="text-eyebrow mb-4">SIZES</p>
              <div className="flex gap-3 items-center flex-wrap">
                <Button size="xs">XSmall</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Plus /></Button>
                <Button size="icon" variant="outline"><Plus /></Button>
                <Button size="icon-sm" variant="ghost"><X /></Button>
              </div>
            </div>

            <div className="line-divider-top pt-5">
              <p className="text-eyebrow mb-4">WITH ICONS</p>
              <div className="flex gap-3 items-center flex-wrap">
                <Button><Calendar className="mr-1" size={14} /> Add event</Button>
                <Button variant="outline"><Search className="mr-1" size={14} /> Find provider</Button>
                <Button variant="secondary"><Sparkles className="mr-1" size={14} /> AI review</Button>
                <Button variant="ghost">See all <ChevronRight className="ml-1" size={14} /></Button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ BADGES ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="BADGES" />
          <div className="card-default p-8 space-y-5">

            <div>
              <p className="text-eyebrow mb-4">SHADCN VARIANTS</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            <div className="line-divider-top pt-5">
              <p className="text-eyebrow mb-4">VILLAGE BADGES</p>
              <div className="flex flex-wrap gap-3 items-center">
                {/* AI */}
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-village-accent-soft text-village-accent-dark text-[10px] tracking-[0.14em] uppercase font-semibold">
                  <span className="w-[5px] h-[5px] rounded-full bg-village-accent inline-block shrink-0" />
                  AI
                </span>
                {/* BETA */}
                <span className="inline-flex items-center px-2 py-1 rounded-[4px] border border-village-hairline text-village-ink-mute text-[10px] tracking-[0.14em] uppercase font-semibold">
                  BETA
                </span>
                {/* URGENT */}
                <span
                  className="inline-flex items-center px-2 py-1 rounded-[4px] bg-village-warm-surface text-[10px] tracking-[0.14em] uppercase font-semibold"
                  style={{ color: T.warm, border: `1px solid ${T.warm}` }}
                >
                  URGENT
                </span>
                {/* Count pill */}
                <span className="inline-flex items-center px-2 py-1 rounded-[4px] border border-village-hairline text-village-ink-mute font-mono text-[10px]">
                  4 events
                </span>
                {/* Provider tag */}
                <span className="inline-flex items-center px-2 py-1 rounded-[4px] bg-village-surface-alt text-village-ink-soft text-[10px] tracking-[0.06em] uppercase font-semibold">
                  Google
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-[4px] bg-village-surface-alt text-village-ink-soft text-[10px] tracking-[0.06em] uppercase font-semibold">
                  iCloud
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CARDS ═════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="CARDS" />
          <div className="grid grid-cols-3 gap-4">

            <div className="card-default p-6">
              <p className="text-eyebrow mb-3">DEFAULT</p>
              <p className="text-heading mb-1">Parent Meeting</p>
              <p className="text-secondary mb-4">School gym · 6:00 PM</p>
              <p className="text-footer">Surface white · hairline border · 16px</p>
            </div>

            <div className="card-secondary p-6">
              <p className="text-eyebrow mb-3">SECONDARY</p>
              <p className="text-heading mb-1">Awaiting Review</p>
              <p className="text-secondary mb-4">3 events need attention</p>
              <p className="text-footer">surfaceAlt bg · hairline border · 16px</p>
            </div>

            <div className="card-accent p-6">
              <p className="text-eyebrow-accent mb-3">ACCENT · AI</p>
              <p className="text-heading mb-1">This Week's Prep</p>
              <p className="text-secondary mb-4">2 items to action before Monday</p>
              <p className="text-footer">accentSoft bg · subtle green border · 16px</p>
            </div>

            <div className="card-urgent p-6">
              <p className="text-eyebrow mb-3">URGENT</p>
              <p className="text-heading mb-1">Permission Slip Due</p>
              <p className="text-secondary mb-4">Riverside Trip · Tomorrow 9 AM</p>
              <p className="text-footer">warmSurface bg · warm left stripe · 6px</p>
            </div>

            <div className="card-primary p-6">
              <p className="text-eyebrow mb-3" style={{ color: T.inkMute }}>PRIMARY</p>
              <p className="text-heading mb-2" style={{ color: T.surface }}>Extract from photo</p>
              <p className="text-footer mb-5" style={{ color: T.inkMute }}>
                Ink bg · white text · 16px radius
              </p>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-village-accent text-white text-[12px] font-medium hover:opacity-80 transition-opacity">
                <Plus size={13} /> Add event
              </button>
            </div>

            <div className="card-default-mobile p-5">
              <p className="text-eyebrow mb-3">DEFAULT MOBILE</p>
              <p className="text-heading mb-1">Today</p>
              <p className="text-secondary mb-4">Tuesday, 6 May · 3 events</p>
              <p className="text-footer">Surface white · hairline border · 12px</p>
            </div>
          </div>
        </section>

        {/* ══ EVENT CHIPS ═══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="EVENT CHIPS" />
          <div className="card-default p-8">
            <div className="grid grid-cols-3 gap-3">
              {eventTypes.map(({ type, label, time }) => (
                <div
                  key={type}
                  className="flex items-start justify-between p-[8px_10px] rounded-[4px]"
                  style={{
                    background: eventSurfaces[type],
                    borderLeft: `2px solid ${eventColors[type]}`,
                  }}
                >
                  <div>
                    <p className="text-body font-semibold text-[12px]">{label}</p>
                    <p className="text-time mt-0.5 capitalize">{type}</p>
                  </div>
                  <p className="text-time shrink-0">{time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CONFIDENCE DOTS ═══════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="CONFIDENCE DOTS" />
          <div className="card-default p-8">
            <div className="flex gap-8 items-end">
              {[5, 4, 3, 2, 1].map((filled) => (
                <div key={filled} className="flex flex-col items-center gap-2">
                  <div className="flex gap-[2px] items-end">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[4px] h-[8px] rounded-[1px]"
                        style={{ background: i < filled ? T.accent : T.hairline }}
                      />
                    ))}
                  </div>
                  <p className="text-time">{filled}/5</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ LINES & BORDERS ═══════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="LINES & BORDERS" />
          <div className="card-default p-8 space-y-8">

            <div>
              <p className="text-eyebrow mb-2">1 · STRUCTURAL BREAK — .line-structural</p>
              <p className="text-secondary mb-3">Once per panel, directly under its title. Hard section change, 2px ink.</p>
              <div className="line-structural" />
            </div>

            <div>
              <p className="text-eyebrow mb-2">2 · DATA SEPARATOR — .line-data</p>
              <p className="text-secondary mb-4">Above stat numbers only. Reads like a print column rule. 1px ink.</p>
              <div className="flex gap-10">
                {[['14', 'Events this week'], ['3', 'Prep items'], ['87%', 'Confidence']].map(([n, l]) => (
                  <div key={l} className="line-data">
                    <p className="text-stat">{n}</p>
                    <p className="text-time mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-eyebrow mb-2">3 · HAIRLINE DIVIDER — .line-divider-*</p>
              <p className="text-secondary mb-4">Workhorse. Panel outlines, row separators, column borders. 1px warm grey.</p>
              <div className="flex gap-6 items-start flex-wrap">
                <div className="line-divider p-3 rounded-[4px]"><p className="text-meta">all sides</p></div>
                <div className="line-divider-top pt-3"><p className="text-meta">top</p></div>
                <div className="line-divider-bottom pb-3"><p className="text-meta">bottom</p></div>
                <div className="line-divider-right pr-3"><p className="text-meta">right</p></div>
                <div className="line-divider-left pl-3"><p className="text-meta">left</p></div>
              </div>
            </div>

            <div>
              <p className="text-eyebrow mb-2">4 · CONTEXTUAL ACCENT</p>
              <p className="text-secondary mb-4">Event chip stripes, active nav underline, ghost button outline, prep row divider.</p>
              <div className="flex gap-4 flex-wrap items-start">
                <div className="p-3 line-accent-event rounded-r-[6px] bg-village-accent-soft">
                  <p className="text-meta">.line-accent-event</p>
                  <p className="text-time">sport / green</p>
                </div>
                <div className="p-3 line-warm-event rounded-r-[6px] bg-village-warm-surface">
                  <p className="text-meta">.line-warm-event</p>
                  <p className="text-time">deadline / warm</p>
                </div>
                <div className="p-3 line-muted-event rounded-r-[6px] bg-village-surface-alt">
                  <p className="text-meta">.line-muted-event</p>
                  <p className="text-time">default</p>
                </div>
                <div className="p-3 bg-village-ink rounded-[4px] line-ghost-button">
                  <p className="text-meta text-white">.line-ghost-button</p>
                  <p className="text-time" style={{ color: T.inkMute }}>on ink bg</p>
                </div>
                <div className="py-2 line-accent-nav inline-block">
                  <p className="text-body text-[12px]">Active nav item</p>
                  <p className="text-time">.line-accent-nav</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ RADIUS SCALE ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="BORDER RADIUS" />
          <div className="card-default p-8">
            <div className="flex gap-6 items-end flex-wrap">
              {radiusScale.map(({ value, label }) => {
                const px = parseInt(value)
                const size = Math.min(96, Math.max(32, px * 2 + 36))
                return (
                  <div key={value} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-village-accent-soft border border-village-hairline"
                      style={{ width: size, height: size, borderRadius: value }}
                    />
                    <p className="text-time">{value}</p>
                    <p className="text-time text-[9px] text-center max-w-[72px]">{label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══ ICONS ═════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader label="ICONS — LUCIDE REACT" />
          <div className="card-default p-8">
            <p className="text-eyebrow mb-5">RECOMMENDED SET · SIZES 16 / 20 / 24</p>
            <div className="grid grid-cols-8 gap-y-6">
              {showcaseIcons.map((Icon, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-1.5">
                    <Icon size={16} color={T.inkMute} />
                    <Icon size={20} color={T.inkSoft} />
                    <Icon size={24} color={T.ink} />
                  </div>
                  <p className="text-time text-center" style={{ fontSize: 9 }}>
                    16 · 20 · 24
                  </p>
                </div>
              ))}
            </div>
            <div className="line-divider-top mt-6 pt-5">
              <p className="text-eyebrow mb-3">COLOR USAGE</p>
              <div className="flex gap-6 items-center">
                <div className="flex items-center gap-2">
                  <Info size={20} color={T.inkMute} />
                  <p className="text-meta">inkMute — meta / decorative</p>
                </div>
                <div className="flex items-center gap-2">
                  <Info size={20} color={T.inkSoft} />
                  <p className="text-meta">inkSoft — secondary</p>
                </div>
                <div className="flex items-center gap-2">
                  <Info size={20} color={T.ink} />
                  <p className="text-meta">ink — primary</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles size={20} color={T.accent} />
                  <p className="text-meta">accent — AI / action</p>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} color={T.warm} />
                  <p className="text-meta">warm — urgent / deadline</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <footer className="max-w-[1200px] mx-auto mt-16 py-6 line-divider-top">
        <p className="text-footer">
          VillageOS Design System · Meadow v0.2 · shadcn New York · Lucide React
        </p>
      </footer>
    </div>
  )
}
