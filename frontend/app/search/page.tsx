"use client";

import { useRef, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { Search } from "lucide-react";
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
      setHistory((prev) => [{ id: nextId.current++, query: trimmed, response }, ...prev]);
      setQuery("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-village-bg px-10 py-8">
      <div className="max-w-[900px] mx-auto">

        <div className="mb-10">
          <p className="text-eyebrow-accent mb-2">VILLAGEOS · FIND A PROVIDER</p>
          <h1 className="text-title mb-1">Provider Search</h1>
          <p className="text-secondary">Describe what you&apos;re looking for in natural language.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. birthday venue for a 4-year-old that isn't too loud"
            className="flex-1 h-[42px] rounded-[4px] border border-village-hairline bg-village-surface px-3 text-body placeholder:text-village-ink-mute focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-village-accent transition-colors disabled:opacity-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 5}
            className="inline-flex items-center gap-2 px-4 py-[10px] rounded-[4px] bg-village-ink text-white text-[12px] font-medium tracking-[0.02em] hover:opacity-80 transition-opacity disabled:opacity-30"
          >
            {loading ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Search size={13} />
                Search
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mb-6 rounded-[4px] bg-village-warm-surface border border-village-hairline px-3 py-2">
            <p className="text-body text-village-warm">{error}</p>
          </div>
        )}

        {history.length === 0 && !loading && (
          <p className="text-secondary">
            Try: &ldquo;birthday venue for a 4-year-old that isn&apos;t too loud&rdquo; or &ldquo;football coaching for my toddler&rdquo;
          </p>
        )}

        {history.length > 0 && (
          <div className="space-y-10">
            {history.map((entry) => (
              <ChatMessage key={entry.id} query={entry.query} response={entry.response} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
