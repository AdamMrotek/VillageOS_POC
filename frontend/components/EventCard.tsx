"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { T, eventColors } from "@/lib/tokens";
import type { ParentEvent, EventType } from "@/lib/types";

interface EventCardProps {
  event: ParentEvent | null;
  modelUsed?: string;
  tokensUsed?: number;
}

function formatEventTime(isoString: string, isAllDay: boolean): string {
  const date = new Date(isoString);
  if (isAllDay) {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short", day: "numeric", month: "long",
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date);
}

export function EventCard({ event, modelUsed, tokensUsed }: EventCardProps) {
  const [debugOpen, setDebugOpen] = useState(false);

  if (!event) {
    return (
      <div className="card-secondary p-6 min-h-48 flex items-center justify-center">
        <p className="text-secondary text-center">Your event will appear here after extraction.</p>
      </div>
    );
  }

  const accentColor = eventColors[event.event_type as EventType] ?? eventColors.default;

  return (
    <div className="card-default overflow-hidden" style={{ borderLeft: `3px solid ${accentColor}` }}>
      <div className="p-5 space-y-4">

        <div>
          <p className="text-eyebrow mb-2">{event.event_type}</p>
          <p className="text-heading leading-tight">{event.title}</p>
          <p className="text-time mt-1.5">
            {formatEventTime(event.start_time, event.is_all_day)}
            {event.end_time && !event.is_all_day && ` – ${formatEventTime(event.end_time, false)}`}
          </p>
        </div>

        {(event.location || event.description) && (
          <div className="line-divider-top pt-4 space-y-2">
            {event.location && (
              <div className="flex items-start gap-2">
                <MapPin size={13} color={T.inkMute} className="mt-0.5 shrink-0" />
                <p className="text-body">{event.location}</p>
              </div>
            )}
            {event.description && (
              <p className="text-secondary">{event.description}</p>
            )}
          </div>
        )}

        {event.action_items.length > 0 && (
          <div className="line-divider-top pt-4 space-y-1.5">
            <p className="text-eyebrow mb-2">ACTION ITEMS</p>
            {event.action_items.map((item, i) => (
              <div key={`${i}-${item.description}`} className="flex items-start gap-2">
                <span className="text-time mt-0.5 shrink-0">·</span>
                <p className="text-body text-[12px]">
                  {item.description}
                  {item.cost_estimate_gbp != null && (
                    <span className="text-time ml-1">(£{item.cost_estimate_gbp.toFixed(2)})</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="line-divider-top pt-3 flex items-center justify-between">
          <p className="text-time">{Math.round(event.confidence * 100)}% confidence</p>
          {(modelUsed || tokensUsed != null) && (
            <button
              onClick={() => setDebugOpen((v) => !v)}
              className="text-time hover:text-village-ink-soft transition-colors"
            >
              {debugOpen ? "hide" : "debug"}
            </button>
          )}
        </div>

        {debugOpen && (
          <div className="space-y-0.5">
            {modelUsed && <p className="text-time">{modelUsed}</p>}
            {tokensUsed != null && <p className="text-time">{tokensUsed} tokens</p>}
          </div>
        )}

      </div>
    </div>
  );
}
