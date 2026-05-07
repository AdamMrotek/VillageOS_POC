from __future__ import annotations

import json
import os

import numpy as np
from openai import OpenAI

from schemas import Provider

_EMBEDDINGS_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "embeddings.json")
)
_EMBED_MODEL = "text-embedding-3-small"

_store: list[dict] | None = None
_openai = OpenAI()


def _load_store() -> list[dict]:
    global _store
    if _store is not None:
        return _store
    if os.path.exists(_EMBEDDINGS_PATH):
        with open(_EMBEDDINGS_PATH) as f:
            _store = json.load(f)
    else:
        _store = []
    return _store


def _save_store(store: list[dict]) -> None:
    with open(_EMBEDDINGS_PATH, "w") as f:
        json.dump(store, f)


def _embed(text: str) -> list[float]:
    response = _openai.embeddings.create(input=text, model=_EMBED_MODEL)
    return response.data[0].embedding


def _cosine(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb)))


def _build_document(provider: Provider, vibe_description: str = "") -> str:
    parts: list[str] = []
    if vibe_description:
        parts.append(vibe_description)
    parts.append(
        f"{provider.name} — {provider.category.replace('_', ' ')} in {provider.city}. "
        f"{provider.description}"
    )
    return "\n\n".join(parts)


def upsert_provider(
    provider: Provider,
    vibe_description: str = "",
    tags: dict[str, list[str]] | None = None,
) -> None:
    store = _load_store()
    doc = _build_document(provider, vibe_description)
    embedding = _embed(doc)

    metadata: dict = {
        "city":            provider.city,
        "name":            provider.name,
        "category":        provider.category,
        "description":     provider.description,
        "tags":            ",".join(provider.tags),
        "age_range_min":   provider.age_range_min if provider.age_range_min is not None else -1,
        "age_range_max":   provider.age_range_max if provider.age_range_max is not None else -1,
        "price_indicator": provider.price_indicator or "",
        "noise_level":     provider.noise_level or "",
        "website":         provider.website or "",
        "contact_email":   provider.contact_email or "",
        "vibe_description": vibe_description,
    }
    for tag_name, values in (tags or {}).items():
        metadata[f"tag_{tag_name}"] = ",".join(values)

    entry = {"id": provider.id, "embedding": embedding, "metadata": metadata}
    idx = next((i for i, e in enumerate(store) if e["id"] == provider.id), None)
    if idx is not None:
        store[idx] = entry
    else:
        store.append(entry)

    _save_store(store)


def query_providers(query: str, city_filter: str | None, limit: int) -> list[dict]:
    store = _load_store()
    if not store:
        return []

    query_embedding = _embed(query)

    results = []
    for entry in store:
        meta = entry["metadata"]
        if city_filter and meta.get("city") != city_filter:
            continue
        score = _cosine(query_embedding, entry["embedding"])
        results.append({"metadata": meta, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]
