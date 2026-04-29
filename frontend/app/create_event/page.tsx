"use client";

import { useState } from "react";
import { ExtractForm } from "@/components/ExtractForm";
import { EventCard } from "@/components/EventCard";
import type { ExtractResponse } from "@/lib/types";

export default function CreateEventPage() {
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">VillageOS</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <section className="flex-1 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Paste your text
            </h2>
            <ExtractForm
              onResult={setResult}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </section>

          <section className="flex-1 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Event preview
            </h2>
            <EventCard
              event={result?.event ?? null}
              modelUsed={result?.model_used}
              tokensUsed={result?.tokens_used}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
