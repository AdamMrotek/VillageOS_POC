"use client";

import { useRef, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { searchProviders } from "@/lib/api";
import type { ProviderSearchResponse } from "@/lib/types";

interface HistoryEntry {
  id: number;
  query: string;
  response: ProviderSearchResponse;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await searchProviders(trimmed);
      setHistory((prev) => [...prev, { id: nextId.current++, query: trimmed, response }]);
      setQuery("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Find a provider</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Describe what you&apos;re looking for in natural language.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. birthday venue for a 4-year-old that isn't too loud"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || query.trim().length < 5}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Searching
              </span>
            ) : (
              "Search"
            )}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {history.length > 0 && (
          <div className="space-y-10">
            {history.map((entry) => (
              <ChatMessage key={entry.id} query={entry.query} response={entry.response} />
            ))}
          </div>
        )}

        {history.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            Try: &ldquo;birthday venue for a 4-year-old that isn&apos;t too loud&rdquo; or &ldquo;football coaching for my toddler&rdquo;
          </p>
        )}
      </main>
    </div>
  );
}
