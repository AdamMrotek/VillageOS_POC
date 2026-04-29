"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ParentEvent, EventType } from "@/lib/types";
import { useState } from "react";

interface EventCardProps {
  event: ParentEvent | null;
  modelUsed?: string;
  tokensUsed?: number;
}

const EVENT_TYPE_CLASSES: Record<EventType, string> = {
  school:    "bg-blue-100 text-blue-800",
  sport:     "bg-green-100 text-green-800",
  birthday:  "bg-pink-100 text-pink-800",
  fundraiser:"bg-amber-100 text-amber-800",
  meeting:   "bg-purple-100 text-purple-800",
  deadline:  "bg-red-100 text-red-800",
  other:     "bg-gray-100 text-gray-700",
};

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
      <Card className="border-dashed opacity-50 h-full">
        <CardContent className="flex items-center justify-center h-full min-h-48 text-muted-foreground text-sm">
          Your event will appear here after extraction.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
          <Badge
            className={EVENT_TYPE_CLASSES[event.event_type]}
            variant="outline"
          >
            {event.event_type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatEventTime(event.start_time, event.is_all_day)}
          {event.end_time && !event.is_all_day && (
            <> – {formatEventTime(event.end_time, false)}</>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {event.location && (
          <p className="text-sm">
            <span className="font-medium">Where:</span> {event.location}
          </p>
        )}

        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}

        {event.action_items.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Action items</p>
            <ul className="space-y-1">
              {event.action_items.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-1">
                  <span className="mt-0.5">·</span>
                  <span>
                    {item.description}
                    {item.cost_estimate_gbp != null && (
                      <span className="text-muted-foreground ml-1">
                        (£{item.cost_estimate_gbp.toFixed(2)})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <p className="text-xs text-muted-foreground">
          Confidence: {Math.round(event.confidence * 100)}%
        </p>

        {(modelUsed || tokensUsed != null) && (
          <div>
            <button
              onClick={() => setDebugOpen((v) => !v)}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              {debugOpen ? "Hide" : "Show"} debug
            </button>
            {debugOpen && (
              <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                {modelUsed && <p>Model: {modelUsed}</p>}
                {tokensUsed != null && <p>Tokens: {tokensUsed}</p>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
