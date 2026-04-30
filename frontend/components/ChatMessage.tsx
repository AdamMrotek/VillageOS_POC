import { ProviderCard } from "@/components/ProviderCard";
import type { ProviderSearchResponse } from "@/lib/types";

interface ChatMessageProps {
  query: string;
  response: ProviderSearchResponse;
}

export function ChatMessage({ query, response }: ChatMessageProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pt-0.5">
          You
        </span>
        <p className="text-sm">{query}</p>
      </div>

      <div className="space-y-3 pl-0">
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed">
          {response.synthesis}
        </div>

        {response.results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {response.results.map((result) => (
              <ProviderCard key={result.provider.id} result={result} />
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {response.model_used} · {response.tokens_used} tokens
        </p>
      </div>
    </div>
  );
}
