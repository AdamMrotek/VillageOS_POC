"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Paste a WhatsApp message, newsletter, email — anything with an event in it…"
          rows={8}
          className="resize-none"
          disabled={isLoading}
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground select-none">
          {text.length}/{MAX_CHARS}
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || text.trim().length < 10}
        className="self-start"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Extracting…
          </span>
        ) : (
          "Extract Event →"
        )}
      </Button>
    </form>
  );
}
