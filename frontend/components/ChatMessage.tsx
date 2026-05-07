import { ProviderCard } from "@/components/ProviderCard";
import type { ProviderSearchResponse } from "@/lib/types";

interface ChatMessageProps {
  query: string;
  response: ProviderSearchResponse;
}

export function ChatMessage({ query, response }: ChatMessageProps) {
  return (
    <div className="space-y-4">
      <div className="line-divider-bottom pb-4 flex gap-3 items-start">
        <span className="text-eyebrow shrink-0 pt-0.5">YOU</span>
        <p className="text-body">{query}</p>
      </div>

      <div className="space-y-4">
        <div className="card-accent px-4 py-3">
          <p className="text-secondary">{response.synthesis}</p>
        </div>

        {response.results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {response.results.map((result) => (
              <ProviderCard key={result.provider.id} result={result} />
            ))}
          </div>
        )}

        <p className="text-time">{response.model_used} · {response.tokens_used} tokens</p>
      </div>
    </div>
  );
}
