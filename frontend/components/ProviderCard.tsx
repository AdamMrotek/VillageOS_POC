"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, Volume1, VolumeX, ExternalLink } from "lucide-react";
import type { ProviderResult } from "@/lib/types";

interface ProviderCardProps {
  result: ProviderResult;
}

const CATEGORY_CLASSES: Record<string, string> = {
  birthday_venue: "bg-pink-100 text-pink-800",
  sports_club:    "bg-green-100 text-green-800",
  school:         "bg-blue-100 text-blue-800",
};

function NoiseBadge({ level }: { level: string }) {
  if (level === "quiet")    return <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><VolumeX size={12} /> quiet</span>;
  if (level === "loud")     return <span className="inline-flex items-center gap-1 text-xs text-red-600"><Volume2 size={12} /> loud</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-amber-700"><Volume1 size={12} /> moderate</span>;
}

export function ProviderCard({ result }: ProviderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { provider, relevance_score } = result;

  const categoryClass =
    CATEGORY_CLASSES[provider.category] ?? "bg-gray-100 text-gray-700";

  const ageLabel =
    provider.age_range_min != null && provider.age_range_max != null
      ? `Ages ${provider.age_range_min}–${provider.age_range_max}`
      : provider.age_range_min != null
      ? `Age ${provider.age_range_min}+`
      : null;

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{provider.name}</CardTitle>
          <Badge className={categoryClass} variant="outline">
            {provider.category.replaceAll("_", " ")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{provider.city}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p
          className={`text-sm text-muted-foreground ${!expanded ? "line-clamp-2" : ""}`}
        >
          {provider.description}
        </p>
        {provider.description.length > 120 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}

        {provider.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {provider.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {ageLabel && <span>{ageLabel}</span>}
          {provider.noise_level && <NoiseBadge level={provider.noise_level} />}
          {provider.price_indicator && (
            <span className="font-medium text-foreground">{provider.price_indicator}</span>
          )}
        </div>

        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink size={11} /> Website
          </a>
        )}
      </CardContent>

      {/* Relevance score strip */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-blue-400 transition-all"
          style={{ width: `${Math.round(relevance_score * 100)}%` }}
        />
      </div>
    </Card>
  );
}
