"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { extractEvent } from "@/lib/api";
import type { ExtractResponse } from "@/lib/types";

const MAX_CHARS = 8000;

interface ExtractFormProps {
  onResult: (result: ExtractResponse | null) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export function ExtractForm({ onResult, isLoading, setIsLoading }: ExtractFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    onResult(null);
    setIsLoading(true);
    try {
      const result = await extractEvent(text);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Paste a WhatsApp message, newsletter, email — anything with an event in it…"
          rows={8}
          className="w-full resize-none rounded-[4px] border border-village-hairline bg-village-surface px-3 py-2.5 text-body placeholder:text-village-ink-mute focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-village-accent transition-colors disabled:opacity-50"
          disabled={isLoading}
        />
        <span className="absolute bottom-2.5 right-3 text-time select-none">
          {text.length}/{MAX_CHARS}
        </span>
      </div>

      {error && (
        <div className="rounded-[4px] bg-village-warm-surface border border-village-hairline px-3 py-2">
          <p className="text-body text-village-warm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || text.trim().length < 10}
        className="self-start inline-flex items-center gap-1.5 px-4 py-[10px] rounded-[4px] bg-village-ink text-white text-[12px] font-medium tracking-[0.02em] hover:opacity-80 transition-opacity disabled:opacity-30"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Extracting…
          </>
        ) : (
          <>
            <FileText size={13} />
            Extract Event
          </>
        )}
      </button>
    </form>
  );
}
