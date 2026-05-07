"use client";

import { useState } from "react";
import { VolumeX, Volume1, Volume2, ExternalLink } from "lucide-react";
import { T } from "@/lib/tokens";
import type { ProviderResult } from "@/lib/types";

interface ProviderCardProps {
  result: ProviderResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  birthday_venue: '#EC4899',
  sports_club:    T.accent,
  school:         '#3B82F6',
};

function NoiseBadge({ level }: { level: string }) {
  if (level === "quiet")
    return <span className="inline-flex items-center gap-1 text-time" style={{ color: T.accent }}><VolumeX size={11} />quiet</span>;
  if (level === "loud")
    return <span className="inline-flex items-center gap-1 text-time" style={{ color: '#EF4444' }}><Volume2 size={11} />loud</span>;
  return <span className="inline-flex items-center gap-1 text-time" style={{ color: T.warm }}><Volume1 size={11} />moderate</span>;
}

export function ProviderCard({ result }: ProviderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { provider, relevance_score } = result;
  const catColor = CATEGORY_COLORS[provider.category] ?? T.inkMute;

  const ageLabel =
    provider.age_range_min != null && provider.age_range_max != null
      ? `Ages ${provider.age_range_min}–${provider.age_range_max}`
      : provider.age_range_min != null
      ? `Age ${provider.age_range_min}+`
      : null;

  return (
    <div className="card-default overflow-hidden flex flex-col">
      <div
        className="px-4 py-3 border-b border-village-hairline"
        style={{ borderLeft: `3px solid ${catColor}` }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-body font-semibold text-[14px] leading-tight">{provider.name}</p>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] tracking-[0.1em] uppercase font-semibold shrink-0"
            style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
          >
            {provider.category.replaceAll("_", " ")}
          </span>
        </div>
        <p className="text-time mt-1">{provider.city}</p>
      </div>

      <div className="p-4 flex-1 space-y-3">
        <p className={`text-secondary text-[12px] ${!expanded ? "line-clamp-2" : ""}`}>
          {provider.description}
        </p>
        {provider.description.length > 120 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-time hover:text-village-ink-soft transition-colors"
          >
            {expanded ? "show less" : "show more"}
          </button>
        )}

        {provider.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {provider.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-[4px] border border-village-hairline bg-village-surface-alt text-village-ink-soft text-[10px] tracking-[0.06em] uppercase font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {ageLabel && <span className="text-time">{ageLabel}</span>}
          {provider.noise_level && <NoiseBadge level={provider.noise_level} />}
          {provider.price_indicator && (
            <span className="text-body text-[12px]">{provider.price_indicator}</span>
          )}
        </div>

        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-time hover:opacity-80 transition-opacity"
            style={{ color: T.accentDark }}
          >
            <ExternalLink size={11} />Website
          </a>
        )}
      </div>

      <div className="h-[3px] bg-village-surface-alt">
        <div
          className="h-full transition-all"
          style={{ width: `${Math.round(relevance_score * 100)}%`, background: T.accent }}
        />
      </div>
    </div>
  );
}
