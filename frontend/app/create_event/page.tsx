"use client";

import { useState } from "react";
import { ExtractForm } from "@/components/ExtractForm";
import { EventCard } from "@/components/EventCard";
import type { ExtractResponse } from "@/lib/types";

export default function CreateEventPage() {
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-village-bg px-10 py-8">
      <div className="max-w-[900px] mx-auto">

        <div className="mb-10">
          <p className="text-eyebrow-accent mb-2">VILLAGEOS · EVENT EXTRACTION</p>
          <h1 className="text-title mb-1">Extract Event</h1>
          <p className="text-secondary">Paste a message, email, or newsletter and we&apos;ll pull out the event details.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <section className="flex-1">
            <p className="text-eyebrow mb-2">PASTE YOUR TEXT</p>
            <div className="line-structural mb-5" />
            <ExtractForm
              onResult={setResult}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </section>

          <section className="flex-1">
            <p className="text-eyebrow mb-2">EVENT PREVIEW</p>
            <div className="line-structural mb-5" />
            <EventCard
              event={result?.event ?? null}
              modelUsed={result?.model_used}
              tokensUsed={result?.tokens_used}
            />
          </section>
        </div>

      </div>
    </div>
  );
}
