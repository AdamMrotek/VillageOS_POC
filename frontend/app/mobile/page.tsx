"use client";

import { useState } from "react";
import { T, fonts } from "@/lib/tokens";

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

// ─── Mobile mockup ─────────────────────────────────────────────────────────────
function MeadowMobile({ empty }: { empty: boolean }) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: T.bg,
        fontFamily: fonts.sans,
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
        <span style={{ fontFamily: fonts.sans }}>9:41</span>
        <span
          style={{
            fontSize: 11,
            fontFamily: fonts.mono,
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
            fontFamily: fonts.serif,
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
              fontFamily: fonts.serif,
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
                fontFamily: fonts.serif,
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
                    fontFamily: fonts.serif,
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
              <span style={{ fontFamily: fonts.serif, fontSize: 18 }}>
                Today, 4 May
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: fonts.mono,
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
                accent: true,
              },
              {
                time: "17:00",
                title: "Pick up Theo",
                where: "Mum's · Cedar Lane",
                accent: false,
              },
            ].map((e, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px 1fr",
                  gap: 10,
                  padding: "8px 0",
                  borderTop: i > 0 ? `1px solid ${T.hairline}` : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.mono,
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
                    borderLeft: `2px solid ${e.accent ? T.accent : T.inkMute}`,
                    paddingLeft: 10,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>
                    {e.title}
                  </div>
                  <div style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>
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
                fontFamily: fonts.serif,
                fontSize: 17,
                lineHeight: 1.3,
                marginBottom: 12,
                letterSpacing: "-0.01em",
              }}
            >
              <em style={{ color: T.accentSoft }}>WhatsApp · Y2 parents — </em>
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
                  fontFamily: fonts.sans,
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
                  fontFamily: fonts.sans,
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
              <span style={{ fontFamily: fonts.serif, fontSize: 16 }}>
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
                    fontFamily: fonts.mono,
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
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.t}</div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MobilePage() {
  const [empty, setEmpty] = useState(false);

  const btnStyle = (active: boolean) => ({
    padding: "6px 14px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: fonts.sans,
    fontWeight: 500,
    letterSpacing: "0.04em",
    cursor: "pointer",
    border: `1px solid ${T.hairline}`,
    background: active ? T.ink : T.surface,
    color: active ? T.surface : T.inkSoft,
  });

  return (
    <div
      style={{
        background: "#EDEBE3",
        minHeight: "100vh",
        padding: "24px 32px 48px",
        fontFamily: fonts.sans,
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
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: T.inkMute,
            fontWeight: 600,
          }}
        >
          Mobile preview · 390 × 844
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setEmpty(false)} style={btnStyle(!empty)}>
          Populated
        </button>
        <button onClick={() => setEmpty(true)} style={btnStyle(empty)}>
          Empty state
        </button>
      </div>

      <MeadowMobile empty={empty} />
    </div>
  );
}
