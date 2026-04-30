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


def upsert_provider(provider: Provider) -> None:
    col = _get_collection()
    doc = f"{provider.name} {provider.category} {provider.description} {' '.join(provider.tags)}"
    col.upsert(
        ids=[provider.id],
        documents=[doc],
        metadatas=[{
            "city": provider.city,
            "category": provider.category,
            "name": provider.name,
            "description": provider.description,
            "tags": ",".join(provider.tags),
            "age_range_min": provider.age_range_min if provider.age_range_min is not None else -1,
            "age_range_max": provider.age_range_max if provider.age_range_max is not None else -1,
            "price_indicator": provider.price_indicator or "",
            "noise_level": provider.noise_level or "",
            "website": provider.website or "",
            "contact_email": provider.contact_email or "",
        }],
    )


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
        # cosine distance → similarity score
        score = max(0.0, 1.0 - dist)
        out.append({"metadata": meta, "score": score})
    return out
