"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoredEvent, EventType } from "@/lib/types";

const TYPE_DOT: Record<EventType, string> = {
  school: "bg-blue-500",
  sport: "bg-green-500",
  birthday: "bg-pink-500",
  fundraiser: "bg-orange-500",
  meeting: "bg-yellow-500",
  deadline: "bg-red-500",
  other: "bg-gray-400",
};

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface Props {
  events: StoredEvent[];
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedDay: Date | null;
  onDaySelect: (d: Date) => void;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function eventsForDay(events: StoredEvent[], day: Date): StoredEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start_time), day));
}

export function MonthCalendar({ events, month, onMonthChange, selectedDay, onDaySelect }: Props) {
  const today = new Date();

  const year = month.getFullYear();
  const mon = month.getMonth();

  // First day of month — shift so Monday = 0
  const firstDow = (new Date(year, mon, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, mon, 0).getDate();

  // Build grid cells: 6 rows × 7 cols = 42 slots
  const cells: { date: Date; currentMonth: boolean }[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({
      date: new Date(year, mon - 1, daysInPrevMonth - firstDow + 1 + i),
      currentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, mon, d), currentMonth: true });
  }
  const trailing = 42 - cells.length;
  for (let d = 1; d <= trailing; d++) {
    cells.push({ date: new Date(year, mon + 1, d), currentMonth: false });
  }

  const monthLabel = month.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    onMonthChange(new Date(year, mon - 1, 1));
  }
  function nextMonth() {
    onMonthChange(new Date(year, mon + 1, 1));
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-zinc-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map(({ date, currentMonth }, i) => {
          const dayEvents = eventsForDay(events, date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
          const visibleDots = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - 3;

          return (
            <button
              key={i}
              onClick={() => onDaySelect(date)}
              className={[
                "flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors",
                currentMonth
                  ? "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  : "text-zinc-300 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900",
                isSelected
                  ? "bg-village-accent-soft text-village-ink hover:bg-village-accent/30"
                  : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium",
                  isToday && !isSelected
                    ? "ring-2 ring-zinc-900 dark:ring-zinc-100"
                    : "",
                ].join(" ")}
              >
                {date.getDate()}
              </span>

              {/* Event dots */}
              <div className="flex gap-0.5 h-2 items-center">
                {visibleDots.map((e, di) => (
                  <span
                    key={di}
                    className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[e.event_type]}`}
                  />
                ))}
                {overflow > 0 && (
                  <span
                    className="text-[9px] leading-none font-medium text-zinc-400"
                  >
                    +{overflow}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
