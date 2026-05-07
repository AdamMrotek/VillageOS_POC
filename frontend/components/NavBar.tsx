"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { T, fonts } from "@/lib/tokens";

const NAV_TABS = [
  { label: "Today",    href: "/today" },
  { label: "Calendar", href: "/calendar" },
  { label: "Inbox",    href: "/create_event" },
  { label: "Discover", href: "/search" },
  { label: "Design",   href: "/design" },
];

const DAYS   = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function NavBar() {
  const pathname = usePathname();
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const d = new Date();
    setDateStr(
      `${DAYS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    );
  }, []);

  return (
    <header
      style={{
        background: T.bg,
        borderBottom: `1px solid ${T.hairline}`,
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: fonts.sans,
        flexShrink: 0,
      }}
    >
      {/* Brand + nav tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26, height: 26,
              background: T.ink,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.bg,
              fontFamily: fonts.serif,
              fontSize: 16, lineHeight: "1",
            }}
          >
            V
          </div>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              style={{
                fontFamily: fonts.serif, fontSize: 18,
                letterSpacing: "-0.01em", color: T.ink,
              }}
            >
              VillageOS
            </span>
          </Link>
          <span
            style={{
              fontSize: 9.5, padding: "2px 6px",
              background: T.accentSoft, color: T.accentDark,
              letterSpacing: "0.1em", fontFamily: fonts.mono,
            }}
          >
            BETA
          </span>
        </div>

        <nav style={{ display: "flex", gap: 22, fontSize: 12 }}>
          {NAV_TABS.map(({ label, href }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  color: isActive ? T.ink : T.inkSoft,
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive
                    ? `1.5px solid ${T.accent}`
                    : "1.5px solid transparent",
                  paddingBottom: 2,
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Date + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {dateStr && (
          <span
            style={{
              fontSize: 11, fontFamily: fonts.mono,
              color: T.inkMute, letterSpacing: "0.04em",
            }}
          >
            {dateStr}
          </span>
        )}
        <Link href="/create_event" style={{ textDecoration: "none" }}>
          <button
            style={{
              padding: "7px 14px", borderRadius: 4, fontSize: 11.5,
              background: T.ink, color: T.surface, border: "none",
              fontFamily: fonts.sans, fontWeight: 500,
              letterSpacing: "0.02em", cursor: "pointer",
            }}
          >
            + Extract
          </button>
        </Link>
        <div
          style={{
            width: 28, height: 28, borderRadius: 28,
            background: T.accent, color: T.surface,
            fontFamily: fonts.sans, fontSize: 11, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          AM
        </div>
      </div>
    </header>
  );
}
