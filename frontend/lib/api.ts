import type { ExtractResponse, ProviderSearchResponse, StoredEvent } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function extractEvent(rawText: string): Promise<ExtractResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text: rawText }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Extraction failed");
  }

  return res.json();
}

export async function getEvents(
  fromDate?: string,
  toDate?: string,
): Promise<StoredEvent[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  const qs = params.toString();
  const res = await fetch(`${BASE_URL}/api/v1/events${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function searchProviders(
  query: string,
  city = "Kingston",
  limit = 3
): Promise<ProviderSearchResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/providers/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, city, limit }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
