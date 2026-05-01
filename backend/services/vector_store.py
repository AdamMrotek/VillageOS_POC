from __future__ import annotations

import os
import chromadb
from chromadb.utils import embedding_functions
from backend.schemas import Provider

_CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "chroma_db")
_COLLECTION_NAME = "providers"

_client: chromadb.PersistentClient | None = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection

    _client = chromadb.PersistentClient(path=os.path.abspath(_CHROMA_PATH))
    ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=os.environ["OPENAI_API_KEY"],
        model_name="text-embedding-3-small",
    )
    _collection = _client.get_or_create_collection(
        name=_COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def _build_document(provider: Provider, vibe_description: str = "") -> str:
    """
    Vibe description leads (drives semantic matching); factual name + description
    follow so keyword searches (e.g. "pottery", "football") still work.
    """
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
    col = _get_collection()
    doc = _build_document(provider, vibe_description)

    metadata: dict = {
        "city":           provider.city,
        "name":           provider.name,
        "category":       provider.category,
        "description":    provider.description,
        "tags":           ",".join(provider.tags),
        "age_range_min":  provider.age_range_min if provider.age_range_min is not None else -1,
        "age_range_max":  provider.age_range_max if provider.age_range_max is not None else -1,
        "price_indicator": provider.price_indicator or "",
        "noise_level":    provider.noise_level or "",
        "website":        provider.website or "",
        "contact_email":  provider.contact_email or "",
        "vibe_description": vibe_description,
    }

    # Store taxonomy tags as flat comma-separated strings for Python-side filtering
    for tag_name, values in (tags or {}).items():
        metadata[f"tag_{tag_name}"] = ",".join(values)

    col.upsert(ids=[provider.id], documents=[doc], metadatas=[metadata])


def query_providers(query: str, city_filter: str | None, limit: int) -> list[dict]:
    col = _get_collection()
    where = {"city": city_filter} if city_filter else None
    results = col.query(
        query_texts=[query],
        n_results=min(limit, col.count()),
        where=where,
        include=["metadatas", "distances"],
    )
    out = []
    for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
        score = max(0.0, 1.0 - dist)
        out.append({"metadata": meta, "score": score})
    return out
