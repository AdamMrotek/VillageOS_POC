"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/lib/api";
import type { StoredEvent } from "@/lib/types";
import { MonthCalendar } from "@/components/MonthCalendar";
import { WeekTimeline } from "@/components/WeekTimeline";

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
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Timeline anchor: selected day or today
  const timelineAnchor = selectedDay ?? new Date();

  // If a day is selected, show events for the 7 days starting from that day
  // If nothing selected, show next 7 days from today
  const timelineTitle = selectedDay
    ? `From ${selectedDay.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
    : "Next 7 days";

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-zinc-500 mt-1">Your family schedule at a glance.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
            Loading events…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
            Failed to load events: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Month calendar */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5 lg:w-96 shrink-0 self-start">
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

              {/* Legend */}
              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {(
                  [
                    ["school", "bg-blue-500", "School"],
                    ["sport", "bg-green-500", "Sport"],
                    ["birthday", "bg-pink-500", "Birthday"],
                    ["fundraiser", "bg-orange-500", "Fundraiser"],
                    ["meeting", "bg-yellow-500", "Meeting"],
                    ["deadline", "bg-red-500", "Deadline"],
                  ] as const
                ).map(([, dot, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs text-zinc-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
              <WeekTimeline
                events={events}
                anchorDay={timelineAnchor}
                title={timelineTitle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
