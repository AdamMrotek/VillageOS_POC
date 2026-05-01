"use client";

import type { StoredEvent, EventType } from "@/lib/types";

const TYPE_BADGE: Record<EventType, { bg: string; text: string; label: string }> = {
  school:     { bg: "bg-blue-100 dark:bg-blue-900/40",     text: "text-blue-700 dark:text-blue-300",     label: "School" },
  sport:      { bg: "bg-green-100 dark:bg-green-900/40",   text: "text-green-700 dark:text-green-300",   label: "Sport" },
  birthday:   { bg: "bg-pink-100 dark:bg-pink-900/40",     text: "text-pink-700 dark:text-pink-300",     label: "Birthday" },
  fundraiser: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "Fundraiser" },
  meeting:    { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", label: "Meeting" },
  deadline:   { bg: "bg-red-100 dark:bg-red-900/40",       text: "text-red-700 dark:text-red-300",       label: "Deadline" },
  other:      { bg: "bg-zinc-100 dark:bg-zinc-800",         text: "text-zinc-600 dark:text-zinc-400",     label: "Other" },
};

interface Props {
  events: StoredEvent[];
  /** Anchor day (show this day through anchor+6). Defaults to today. */
  anchorDay?: Date;
  title?: string;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(d: Date) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function WeekTimeline({ events, anchorDay, title = "Next 7 days" }: Props) {
  const anchor = anchorDay ?? new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i));

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      <div className="flex flex-col gap-4">
        {days.map((day, di) => {
          const dayEvents = events
            .filter((e) => isSameDay(new Date(e.start_time), day))
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

          return (
            <div key={di}>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                {formatDayLabel(day)}
              </div>

              {dayEvents.length === 0 ? (
                <p className="text-sm text-zinc-300 dark:text-zinc-600 pl-2">Nothing scheduled</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayEvents.map((evt) => {
                    const badge = TYPE_BADGE[evt.event_type];
                    return (
                      <div
                        key={evt.id}
                        className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <span
                            className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-sm font-medium leading-snug">{evt.title}</span>
                        </div>

                        {!evt.is_all_day && (
                          <p className="text-xs text-zinc-400 mb-1.5 pl-0.5">
                            {formatTime(evt.start_time)}
                            {evt.end_time ? ` – ${formatTime(evt.end_time)}` : ""}
                            {evt.location ? ` · ${evt.location}` : ""}
                          </p>
                        )}

                        {evt.action_items.length > 0 && (
                          <ul className="flex flex-col gap-0.5 pl-0.5">
                            {evt.action_items.map((item, ii) => (
                              <li key={ii} className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span className="mt-0.5 shrink-0 w-3 h-3 rounded-sm border border-zinc-300 dark:border-zinc-600" />
                                <span>
                                  {item.description}
                                  {item.cost_estimate_gbp != null && (
                                    <span className="ml-1 text-zinc-400">
                                      £{item.cost_estimate_gbp.toFixed(0)}
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
