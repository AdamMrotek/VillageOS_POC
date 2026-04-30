import os
from openai import OpenAI
from backend.schemas import Provider, ProviderResult, ProviderSearchResponse
from backend.services.vector_store import query_providers

_client = OpenAI()
_MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = (
    "You are a helpful local guide for parents in Kingston. "
    "Given the parent's query and the following providers, write 2–3 sentences "
    "recommending the best options and why. Be specific. "
    "Do not invent information not in the provider data."
)


def search_providers(query: str, city: str | None, limit: int) -> ProviderSearchResponse:
    raw = query_providers(query, city, limit)

    results: list[ProviderResult] = []
    context_lines: list[str] = []

    for item in raw:
        m = item["metadata"]
        tags = [t for t in m.get("tags", "").split(",") if t]
        provider = Provider(
            id="",
            name=m["name"],
            category=m["category"],
            city=m["city"],
            description=m["description"],
            website=m.get("website") or None,
            contact_email=m.get("contact_email") or None,
            age_range_min=m["age_range_min"] if m.get("age_range_min", -1) != -1 else None,
            age_range_max=m["age_range_max"] if m.get("age_range_max", -1) != -1 else None,
            tags=tags,
            price_indicator=m.get("price_indicator") or None,
            noise_level=m.get("noise_level") or None,
        )
        results.append(ProviderResult(provider=provider, relevance_score=item["score"]))
        context_lines.append(
            f"Provider: {provider.name}\n"
            f"Category: {provider.category}\n"
            f"Description: {provider.description}\n"
            f"Tags: {', '.join(provider.tags)}\n"
            f"Noise level: {provider.noise_level or 'unknown'}\n"
            f"Price: {provider.price_indicator or 'unknown'}\n"
        )

    context = "\n".join(context_lines)
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
