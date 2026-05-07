"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/lib/api";
import type { StoredEvent } from "@/lib/types";
import { MonthCalendar } from "@/components/MonthCalendar";
import { T, fonts, eventColors, eventSurfaces } from "@/lib/tokens";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeekEvent {
  time: string;
  title: string;
  where?: string;
  color: string;
  surface: string;
}

// ─── WeekDay cell ─────────────────────────────────────────────────────────────
function WeekDay({
  label,
  date,
  events = [],
  isToday,
}: {
  label: string;
  date: string;
  events?: WeekEvent[];
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
            fontFamily: fonts.serif,
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
          overflowY: "auto",
        }}
      >
        {events.map((e, i) => (
          <div
            key={i}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: e.surface,
              fontSize: 11,
              lineHeight: 1.35,
              borderLeft: `2px solid ${e.color}`,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontFamily: fonts.mono,
                color: T.inkMute,
                letterSpacing: "0.05em",
              }}
            >
              {e.time}
            </div>
            <div style={{ color: T.ink, fontWeight: 500, marginTop: 1 }}>
              {e.title}
            </div>
            {e.where && (
              <div style={{ color: T.inkSoft, fontSize: 10.5, marginTop: 1 }}>
                {e.where}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e))
      )
      .finally(() => setLoading(false));
  }, []);

  const anchor = selectedDay ?? new Date();
  const monday = getMondayOfWeek(anchor);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const eventsByDay = weekDays.map((day) =>
    events
      .filter((e) => {
        const ed = new Date(e.start_time);
        return (
          ed.getFullYear() === day.getFullYear() &&
          ed.getMonth() === day.getMonth() &&
          ed.getDate() === day.getDate()
        );
      })
      .map(
        (e): WeekEvent => ({
          time: e.is_all_day ? "all day" : formatTime(e.start_time),
          title: e.title,
          where: e.location ?? undefined,
          color: eventColors[e.event_type] ?? eventColors.default,
          surface: eventSurfaces[e.event_type] ?? eventSurfaces.default,
        })
      )
  );

  const weekLabel = monday.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  const weekEventCount = weekDays.reduce(
    (acc, _, i) => acc + eventsByDay[i].length,
    0
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        background: T.bg,
        padding: "32px 40px",
        gap: 20,
        fontFamily: fonts.sans,
        minHeight: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Left: month calendar + legend */}
      <div
        style={{
          background: T.surface,
          borderRadius: 16,
          border: `1px solid ${T.hairline}`,
          padding: 20,
          width: 300,
          flexShrink: 0,
          alignSelf: "flex-start",
        }}
      >
        <MonthCalendar
          events={events}
          month={month}
          onMonthChange={setMonth}
          selectedDay={selectedDay}
          onDaySelect={(d) =>
            setSelectedDay((prev) =>
              prev &&
              prev.getFullYear() === d.getFullYear() &&
              prev.getMonth() === d.getMonth() &&
              prev.getDate() === d.getDate()
                ? null
                : d
            )
          }
        />
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${T.hairline}`,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 16px",
          }}
        >
          {(
            [
              ["school", "School"],
              ["sport", "Sport"],
              ["birthday", "Birthday"],
              ["fundraiser", "Fundraiser"],
              ["meeting", "Meeting"],
              ["deadline", "Deadline"],
            ] as const
          ).map(([type, label]) => (
            <div
              key={type}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 7,
                  background: eventColors[type],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 10.5, color: T.inkMute }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Meadow week grid */}
      <div
        style={{
          flex: 1,
          background: T.surface,
          borderRadius: 16,
          border: `1px solid ${T.hairline}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Panel header */}
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
              Calendar
            </div>
            <h3
              style={{
                fontFamily: fonts.serif,
                fontSize: 30,
                lineHeight: 1.15,
                margin: "8px 0 0",
                color: T.ink,
                fontWeight: 400,
                letterSpacing: "-0.015em",
              }}
            >
              Week of {weekLabel}
            </h3>
          </div>
          <span
            style={{
              fontSize: 11,
              fontFamily: fonts.mono,
              color: T.inkMute,
              padding: "4px 10px",
              border: `1px solid ${T.hairline}`,
              borderRadius: 4,
              alignSelf: "flex-start",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "—" : `${weekEventCount} event${weekEventCount !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.inkMute,
              fontSize: 13,
            }}
          >
            Loading events…
          </div>
        )}

        {error && (
          <div style={{ padding: 24, color: "#EF4444", fontSize: 13 }}>
            Failed to load events: {error}
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              minHeight: 200,
            }}
          >
            {weekDays.map((day, i) => {
              const dayMidnight = new Date(day);
              dayMidnight.setHours(0, 0, 0, 0);
              return (
                <WeekDay
                  key={i}
                  label={DAY_LABELS[i]}
                  date={String(day.getDate()).padStart(2, "0")}
                  events={eventsByDay[i]}
                  isToday={dayMidnight.getTime() === todayMidnight.getTime()}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
