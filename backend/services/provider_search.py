from openai import OpenAI
from schemas import Provider, ProviderResult, ProviderSearchResponse
from services.vector_store import query_providers
from services.query_expander import expand_query

_client = OpenAI()
_MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = (
    "You are a helpful local guide for parents in Kingston. "
    "Given the parent's query and the following providers, write 2–3 sentences "
    "recommending the best options and why. Be specific. "
    "Do not invent information not in the provider data."
)


def _passes_tag_filter(metadata: dict, required_tags: dict[str, list[str]]) -> bool:
    for tag_name, required_values in required_tags.items():
        stored = metadata.get(f"tag_{tag_name}", "")
        stored_values = {v.strip() for v in stored.split(",") if v.strip()}
        if not any(v in stored_values for v in required_values):
            return False
    return True


def _build_provider(meta: dict, score: float) -> ProviderResult:
    tags = [t for t in meta.get("tags", "").split(",") if t]
    provider = Provider(
        id="",
        name=meta["name"],
        category=meta["category"],
        city=meta["city"],
        description=meta["description"],
        website=meta.get("website") or None,
        contact_email=meta.get("contact_email") or None,
        age_range_min=meta["age_range_min"] if meta.get("age_range_min", -1) != -1 else None,
        age_range_max=meta["age_range_max"] if meta.get("age_range_max", -1) != -1 else None,
        tags=tags,
        price_indicator=meta.get("price_indicator") or None,
        noise_level=meta.get("noise_level") or None,
    )
    return ProviderResult(provider=provider, relevance_score=score)


def search_providers(query: str, city: str | None, limit: int) -> ProviderSearchResponse:
    # Step 1: expand query into vibe description + extract hard tag constraints
    expanded = expand_query(query)

    # Step 2: vector search using the expanded vibe description
    candidates = query_providers(expanded.expanded, city, limit=20)

    # Step 3: hard filter by required tags; fall back to unfiltered if nothing passes
    filtered = [c for c in candidates if _passes_tag_filter(c["metadata"], expanded.required_tags)]
    if not filtered:
        print("[tag filter] no results after filtering — falling back to unfiltered")
        filtered = candidates

    top = filtered[:limit]

    results: list[ProviderResult] = [_build_provider(item["metadata"], item["score"]) for item in top]

    context = "\n".join(
        f"Provider: {r.provider.name}\n"
        f"Description: {r.provider.description}\n"
        f"Tags: {', '.join(r.provider.tags)}\n"
        f"Noise level: {r.provider.noise_level or 'unknown'}\n"
        f"Price: {r.provider.price_indicator or 'unknown'}\n"
        for r in results
    )
    user_msg = f"Query: {query}\n\nProviders:\n{context}"

    response = _client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=300,
        temperature=0.3,
    )

    usage = response.usage
    print(
        f"[token spend] model={_MODEL} "
        f"prompt={usage.prompt_tokens} "
        f"completion={usage.completion_tokens} "
        f"total={usage.total_tokens}"
    )

    return ProviderSearchResponse(
        results=results,
        synthesis=response.choices[0].message.content.strip(),
        model_used=_MODEL,
        tokens_used=usage.total_tokens,
    )
