"use client";

import { useState, CSSProperties } from "react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F1EA",
  surface: "#FFFFFF",
  surfaceAlt: "#EBE6DA",
  ink: "#16221A",
  inkSoft: "#4A5346",
  inkMute: "#8A8F83",
  hairline: "#D8D1BF",
  accent: "#5C7A4A",
  accentSoft: "#D4DCC4",
  accentDark: "#3F5731",
  warm: "#C28A1F",
};

const display = `'Newsreader', 'Source Serif 4', Georgia, serif`;
const sans = `'General Sans', 'Söhne', -apple-system, BlinkMacSystemFont, sans-serif`;
const mono = `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace`;

// ─── Micro components ─────────────────────────────────────────────────────────
function ConfDots({ value = 0.9 }: { value?: number }) {
  const filled = Math.round(value * 5);
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 8,
            borderRadius: 1,
            background: i < filled ? T.accent : T.hairline,
          }}
        />
      ))}
    </span>
  );
}

function AIBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: T.accentDark,
        fontFamily: sans,
        fontWeight: 600,
        padding: "4px 8px",
        background: T.accentSoft,
        borderRadius: 4,
      }}
    >
      <span
        style={{ width: 5, height: 5, borderRadius: 5, background: T.accent }}
      />
      AI · extracted
    </span>
  );
}

// ─── Week day cell ─────────────────────────────────────────────────────────────
interface Event {
  time: string;
  title: string;
  where?: string;
  tone?: "accent" | "warm" | "default";
}

function WeekDay({
  label,
  date,
  events = [],
  isToday,
}: {
  label: string;
  date: string;
  events?: Event[];
  isToday?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${T.hairline}`,
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          background: isToday ? T.ink : "transparent",
          color: isToday ? T.surface : T.ink,
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: isToday ? 0.8 : 1,
            color: isToday ? T.accentSoft : T.inkMute,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: display,
            fontSize: 22,
            lineHeight: 1.1,
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {date}
        </div>
      </div>
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
        }}
      >
        {events.map((e, i) => (
          <div
            key={i}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background:
                e.tone === "accent"
                  ? T.accentSoft
                  : e.tone === "warm"
                    ? "#F2E4C6"
                    : T.surfaceAlt,
              fontSize: 11,
              lineHeight: 1.35,
              borderLeft: `2px solid ${e.tone === "accent"
                  ? T.accent
                  : e.tone === "warm"
                    ? T.warm
                    : T.inkMute
                }`,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontFamily: mono,
                color: T.inkMute,
                letterSpacing: "0.05em",
              }}
            >
              {e.time}
            </div>
            <div
              style={{ color: T.ink, fontWeight: 500, marginTop: 1 }}
            >
              {e.title}
            </div>
            {e.where && (
              <div
                style={{ color: T.inkSoft, fontSize: 10.5, marginTop: 1 }}
              >
                {e.where}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Center column ─────────────────────────────────────────────────────────────
function CenterColumn({ empty }: { empty: boolean }) {
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 16,
        border: `1px solid ${T.hairline}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: sans,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 28px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: `2px solid ${T.ink}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: T.accent,
              fontWeight: 600,
            }}
          >
            02 · Output
          </div>
          <h3
            style={{
              fontFamily: display,
              fontSize: 30,
              lineHeight: 1.15,
              margin: "8px 0 0",
              color: T.ink,
              fontWeight: 400,
              letterSpacing: "-0.015em",
              whiteSpace: "nowrap",
              paddingBottom: 4,
            }}
          >
            Week of 4 May
          </h3>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <AIBadge />
          <span
            style={{
              fontSize: 11,
              fontFamily: mono,
              color: T.inkMute,
              padding: "4px 10px",
              border: `1px solid ${T.hairline}`,
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {empty ? "—" : "4 events"}
          </span>
        </div>
      </div>

      {empty ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            textAlign: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 80,
              background: T.surfaceAlt,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: display,
              fontSize: 36,
              color: T.inkMute,
              fontStyle: "italic",
            }}
          >
            w
          </div>
          <div>
            <div
              style={{
                fontFamily: display,
                fontSize: 22,
                color: T.ink,
                marginBottom: 4,
              }}
            >
              Your week awaits
            </div>
            <div
              style={{
                fontSize: 13,
                color: T.inkMute,
                maxWidth: 320,
                lineHeight: 1.55,
              }}
            >
              Once you forward an email or paste a thread, the calendar fills
              in here.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
            }}
          >
            <WeekDay
              label="Mon"
              date="04"
              isToday
              events={[{ time: "09:00", title: "School run", where: "St Mary's" }]}
            />
            <WeekDay
              label="Tue"
              date="05"
              events={[
                {
                  time: "08:30",
                  title: "School photos",
                  where: "White polo, navy",
                },
                {
                  time: "15:30",
                  title: "Football — Lily",
                  where: "Kingston Rec",
                  tone: "accent",
                },
              ]}
            />
            <WeekDay
              label="Wed"
              date="06"
              events={[
                {
                  time: "all day",
                  title: "Reply: permission slip",
                  where: "£8.50 · Kew",
                  tone: "warm",
                },
              ]}
            />
            <WeekDay
              label="Thu"
              date="07"
              events={[
                { time: "17:00", title: "Buy gift — Theo", where: "£15–20" },
              ]}
            />
            <WeekDay
              label="Fri"
              date="08"
              events={[
                {
                  time: "15:30",
                  title: "Withdraw cash",
                  where: "£2 envelope",
                },
              ]}
            />
            <WeekDay
              label="Sat"
              date="09"
              events={[
                {
                  time: "10:00",
                  title: "Bake sale",
                  where: "School hall",
                  tone: "warm",
                },
                {
                  time: "14:00",
                  title: "Theo's 5th",
                  where: "The Glasshouse",
                  tone: "accent",
                },
              ]}
            />
            <WeekDay label="Sun" date="10" events={[]} />
          </div>

          {/* Selected event strip */}
          <div
            style={{
              padding: "18px 28px",
              borderTop: `1px solid ${T.hairline}`,
              background: T.bg,
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: T.inkMute,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Selected · Sat 14:00
              </div>
              <div
                style={{
                  fontFamily: display,
                  fontSize: 22,
                  color: T.ink,
                  lineHeight: 1.1,
                }}
              >
                Theo's 5th — pirate party
              </div>
              <div
                style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}
              >
                The Glasshouse, Kingston · Buy gift by Thursday (£15–20)
              </div>
            </div>
            <div
              style={{
                borderLeft: `1px solid ${T.hairline}`,
                paddingLeft: 20,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: T.inkMute,
                  marginBottom: 4,
                }}
              >
                Source
              </div>
              <div
                style={{ fontSize: 11, fontFamily: mono, color: T.ink }}
              >
                Whatsapp · Aunt Em
                <br />
                <span
                  style={{ color: T.accent, textDecoration: "underline" }}
                >
                  view thread →
                </span>
              </div>
            </div>
            <div
              style={{
                borderLeft: `1px solid ${T.hairline}`,
                paddingLeft: 20,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: T.inkMute,
                  marginBottom: 4,
                }}
              >
                Confidence
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <ConfDots value={0.76} />
                <span
                  style={{ fontSize: 11, fontFamily: mono, color: T.ink }}
                >
                  76%
                </span>
              </div>
            </div>
            <button
              style={{
                padding: "10px 16px",
                borderRadius: 6,
                background: T.ink,
                color: T.surface,
                border: "none",
                fontSize: 12,
                fontFamily: sans,
                fontWeight: 500,
                letterSpacing: "0.02em",
                cursor: "pointer",
              }}
            >
              Confirm event
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Right rail ────────────────────────────────────────────────────────────────
function RightRail({ empty }: { empty: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: sans,
        height: "100%",
      }}
    >
      {/* Prep */}
      <div
        style={{
          background: T.accentSoft,
          borderRadius: 16,
          padding: 22,
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: T.accentDark,
                fontWeight: 600,
              }}
            >
              03 · Prep
            </div>
            <h4
              style={{
                fontFamily: display,
                fontSize: 22,
                margin: "6px 0 0",
                color: T.ink,
                fontWeight: 400,
                letterSpacing: "-0.01em",
              }}
            >
              Prep
            </h4>
          </div>
        </div>
        {empty ? (
          <div
            style={{ fontSize: 12.5, color: T.accentDark, lineHeight: 1.55 }}
          >
            Reminders surface here once events exist — gifts to buy, slips to
            sign, kits to wash.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                day: "TODAY",
                task: "Football studs",
                meta: "For Tuesday",
                urgent: false,
              },
              {
                day: "TOMORROW",
                task: "Reply to permission slip",
                meta: "Wed deadline · £8.50",
                urgent: true,
              },
              {
                day: "THU",
                task: "Buy gift for Theo",
                meta: "Pirate party · £15–20",
                urgent: false,
              },
              {
                day: "FRI",
                task: "Withdraw £2 cash",
                meta: "Bake sale envelope",
                urgent: false,
              },
            ].map((p, i, arr) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < arr.length - 1
                      ? `1px solid rgba(63,87,49,0.15)`
                      : "none",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: mono,
                    color: T.accentDark,
                    letterSpacing: "0.08em",
                    paddingTop: 3,
                    fontWeight: 600,
                  }}
                >
                  {p.day}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: T.ink,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {p.task}
                    {p.urgent && (
                      <span
                        style={{
                          fontSize: 8.5,
                          padding: "2px 5px",
                          borderRadius: 3,
                          background: T.warm,
                          color: T.surface,
                          letterSpacing: "0.08em",
                        }}
                      >
                        URGENT
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.accentDark,
                      marginTop: 2,
                    }}
                  >
                    {p.meta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discovery */}
      <div
        style={{
          background: T.surface,
          borderRadius: 16,
          padding: 22,
          border: `1px solid ${T.hairline}`,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: T.inkMute,
              fontWeight: 600,
            }}
          >
            04 · Discover
          </div>
          <h4
            style={{
              fontFamily: display,
              fontSize: 22,
              margin: "6px 0 0",
              color: T.ink,
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            Ask your village
          </h4>
        </div>
        <div
          style={{
            background: T.bg,
            borderRadius: 6,
            padding: "12px 14px",
            fontSize: 12.5,
            color: T.inkSoft,
            marginBottom: 14,
            lineHeight: 1.5,
            border: `1px solid ${T.hairline}`,
          }}
        >
          <span
            style={{
              color: T.accent,
              fontFamily: mono,
              fontSize: 11,
              marginRight: 6,
            }}
          >
            ›
          </span>
          a quiet birthday spot for a 4-year-old in Kingston
        </div>
        {empty ? (
          <div
            style={{ fontSize: 12, color: T.inkMute, lineHeight: 1.55 }}
          >
            Try natural language. Subscriptions and recommendations surface as
            you go.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                name: "The Glasshouse",
                meta: "Venue · Kingston",
                tags: ["quiet", "ages 3–7"],
                match: 0.91,
              },
              {
                name: "Little Hands Studio",
                meta: "Crafts · Surbiton",
                tags: ["craft", "small groups"],
                match: 0.84,
              },
              {
                name: "Riverside Tea Rooms",
                meta: "Café · Kingston",
                tags: ["cozy"],
                match: 0.78,
              },
            ].map((r, i, arr) => (
              <div
                key={i}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < arr.length - 1 ? `1px solid ${T.hairline}` : "none",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}
                  >
                    {r.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.inkMute,
                      marginTop: 2,
                    }}
                  >
                    {r.meta}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                    {r.tags.map((t, j) => (
                      <span
                        key={j}
                        style={{
                          fontSize: 9.5,
                          padding: "2px 6px",
                          borderRadius: 3,
                          background: T.accentSoft,
                          color: T.accentDark,
                          fontFamily: mono,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontFamily: display,
                      color: T.accent,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Math.round(r.match * 100)}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: T.inkMute,
                      letterSpacing: "0.1em",
                    }}
                  >
                    MATCH
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Desktop ───────────────────────────────────────────────────────────────────
function MeadowDesktop({ empty }: { empty: boolean }) {
  return (
    <div

    >

      {/* Hero */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 40,
          alignItems: "flex-end",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: T.accent,
              fontWeight: 600,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{ width: 24, height: 1, background: T.accent }}
            />
            Good morning, Adam
          </div>
          <h1
            style={{
              fontFamily: display,
              fontSize: 60,
              lineHeight: 1.02,
              fontWeight: 400,
              margin: 0,
              color: T.ink,
              letterSpacing: "-0.025em",
            }}
          >
            Your week,
            <br />
            <em style={{ color: T.accent }}>quietly assembled.</em>
          </h1>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            paddingBottom: 12,
          }}
        >
          {[
            { n: empty ? "—" : "4", l: "events this week" },
            { n: empty ? "—" : "5", l: "things to prep" },
            { n: empty ? "—" : "92%", l: "avg confidence" },
          ].map((s, i) => (
            <div
              key={i}
              style={{ borderTop: `1px solid ${T.ink}`, paddingTop: 10 }}
            >
              <div
                style={{
                  fontFamily: display,
                  fontSize: 36,
                  color: T.ink,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: T.inkMute,
                  marginTop: 6,
                  fontWeight: 600,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr",
          gap: 20,
          flex: 1,
          minHeight: 0,
        }}
      >
        <CenterColumn empty={empty} />
        <RightRail empty={empty} />
      </div>
    </div>
  );
}

// ─── Mobile ────────────────────────────────────────────────────────────────────
function MeadowMobile({ empty }: { empty: boolean }) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: T.bg,
        fontFamily: sans,
        color: T.ink,
        padding: "54px 20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxSizing: "border-box",
        borderRadius: 40,
        border: `1px solid ${T.hairline}`,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Status bar */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 28px",
          fontSize: 13,
          fontWeight: 600,
          color: T.ink,
        }}
      >
        <span style={{ fontFamily: sans }}>9:41</span>
        <span
          style={{
            fontSize: 11,
            fontFamily: mono,
            color: T.inkMute,
            fontWeight: 500,
          }}
        >
          MON 04 MAY
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          paddingBottom: 12,
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: T.accent,
            fontWeight: 600,
          }}
        >
          This week
        </div>
        <h2
          style={{
            fontFamily: display,
            fontSize: 34,
            margin: "6px 0 0",
            lineHeight: 0.96,
            fontWeight: 400,
            letterSpacing: "-0.025em",
          }}
        >
          Calm,
          <br />
          <em style={{ color: T.accent }}>configured.</em>
        </h2>
      </div>

      {empty ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 18,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 64,
              background: T.accentSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: display,
              fontSize: 32,
              fontStyle: "italic",
              color: T.accent,
            }}
          >
            w
          </div>
          <div>
            <div
              style={{
                fontFamily: display,
                fontSize: 22,
                color: T.ink,
                marginBottom: 6,
              }}
            >
              A blank week
            </div>
            <div
              style={{ fontSize: 12.5, color: T.inkMute, lineHeight: 1.55 }}
            >
              Forward an email or paste a thread.
              <br />
              The rest happens automatically.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {[
              { n: "4", l: "events" },
              { n: "5", l: "prep" },
              { n: "92%", l: "conf." },
            ].map((s, i) => (
              <div
                key={i}
                style={{ borderTop: `1px solid ${T.ink}`, paddingTop: 8 }}
              >
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 22,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: T.inkMute,
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          {/* Today */}
          <div
            style={{
              background: T.surface,
              borderRadius: 12,
              padding: 16,
              border: `1px solid ${T.hairline}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <span style={{ fontFamily: display, fontSize: 18 }}>
                Today, 4 May
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: mono,
                  color: T.inkMute,
                  letterSpacing: "0.06em",
                }}
              >
                2 EVENTS
              </span>
            </div>
            {[
              {
                time: "15:30",
                title: "Football — Lily",
                where: "Kingston Rec",
                tone: "accent" as const,
              },
              {
                time: "17:00",
                title: "Pick up Theo",
                where: "Mum's · Cedar Lane",
                tone: "default" as const,
              },
            ].map((e, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px 1fr",
                  gap: 10,
                  padding: "8px 0",
                  borderTop:
                    i > 0 ? `1px solid ${T.hairline}` : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: T.inkMute,
                    paddingTop: 2,
                    letterSpacing: "0.04em",
                  }}
                >
                  {e.time}
                </span>
                <div
                  style={{
                    borderLeft: `2px solid ${e.tone === "accent" ? T.accent : T.inkMute
                      }`,
                    paddingLeft: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: T.ink,
                    }}
                  >
                    {e.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.inkMute,
                      marginTop: 1,
                    }}
                  >
                    {e.where}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Awaiting review */}
          <div
            style={{
              background: T.ink,
              borderRadius: 12,
              padding: 16,
              color: T.surface,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: T.accentSoft,
                  fontWeight: 600,
                }}
              >
                3 awaiting review
              </span>
              <ConfDots value={0.86} />
            </div>
            <div
              style={{
                fontFamily: display,
                fontSize: 17,
                lineHeight: 1.3,
                marginBottom: 12,
                letterSpacing: "-0.01em",
              }}
            >
              <em style={{ color: T.accentSoft }}>
                WhatsApp · Y2 parents —{" "}
              </em>
              "Bake sale Saturday 10am, £2 in an envelope."
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 4,
                  background: T.accent,
                  color: T.surface,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: sans,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                }}
              >
                Review 3 events
              </button>
              <button
                style={{
                  padding: "10px 14px",
                  borderRadius: 4,
                  background: "transparent",
                  color: T.surface,
                  border: `1px solid rgba(255,255,255,0.2)`,
                  fontSize: 12,
                  fontFamily: sans,
                  cursor: "pointer",
                }}
              >
                Later
              </button>
            </div>
          </div>

          {/* Prep mini */}
          <div
            style={{
              background: T.accentSoft,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <span style={{ fontFamily: display, fontSize: 16 }}>
                Get ready
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: T.accentDark,
                  fontWeight: 600,
                }}
              >
                Prep · 4
              </span>
            </div>
            {[
              { d: "TUE", t: "Football studs", m: "Lily" },
              { d: "WED", t: "Reply: permission slip", m: "£8.50" },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "46px 1fr",
                  gap: 10,
                  padding: "6px 0",
                  borderTop:
                    i > 0 ? `1px solid rgba(63,87,49,0.15)` : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 9.5,
                    color: T.accentDark,
                    letterSpacing: "0.08em",
                    paddingTop: 2,
                    fontWeight: 600,
                  }}
                >
                  {p.d}
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                    {p.t}
                  </div>
                  <div style={{ fontSize: 10.5, color: T.accentDark }}>
                    {p.m}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bottom nav */}
      <div
        style={{
          marginTop: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 4,
          paddingTop: 8,
          borderTop: `1px solid ${T.hairline}`,
        }}
      >
        {[
          { l: "Today", a: true },
          { l: "Cal" },
          { l: "Add" },
          { l: "Find" },
          { l: "Me" },
        ].map((n, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              padding: "8px 0",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: n.a ? T.ink : T.inkMute,
              fontWeight: n.a ? 600 : 500,
              borderTop: n.a
                ? `2px solid ${T.accent}`
                : "2px solid transparent",
              marginTop: -9,
              paddingTop: 10,
            }}
          >
            {n.l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MeadowPage() {
  const [empty, setEmpty] = useState(false);

  const controlStyle: CSSProperties = {
    padding: "6px 14px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: sans,
    fontWeight: 500,
    letterSpacing: "0.04em",
    cursor: "pointer",
    border: `1px solid ${T.hairline}`,
  };

  return (
    <>
      {/* Load display + mono fonts from Google */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>

      <div
        style={{
          background: "#EDEBE3",
          minHeight: "100vh",
          padding: "24px 32px 48px",
          fontFamily: sans,
        }}
      >
        {/* Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >

          <div style={{ flex: 1 }} />
          <button
            onClick={() => setEmpty(false)}
            style={{
              ...controlStyle,
              background: !empty ? T.ink : T.surface,
              color: !empty ? T.surface : T.inkSoft,
            }}
          >
            Populated
          </button>
          <button
            onClick={() => setEmpty(true)}
            style={{
              ...controlStyle,
              background: empty ? T.ink : T.surface,
              color: empty ? T.surface : T.inkSoft,
            }}
          >
            Empty state
          </button>
        </div>
        <MeadowDesktop empty={empty} />
      </div>
    </>
  );
}
