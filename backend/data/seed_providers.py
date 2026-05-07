"""
Run: python -m backend.data.seed_providers
Loads providers.json, generates vibe descriptions + taxonomy tags via LLM,
and upserts all providers into ChromaDB. Idempotent.
"""
import json
import os
from dotenv import load_dotenv

load_dotenv()

from backend.schemas import Provider
from backend.services.vector_store import upsert_provider
from backend.services.vibe_generator import generate_vibe

_DATA_FILE = os.path.join(os.path.dirname(__file__), "providers.json")


def main() -> None:
    with open(_DATA_FILE) as f:
        raw = json.load(f)

    providers = [Provider(**p) for p in raw]
    for p in providers:
        print(f"\n  seeding: {p.id} — {p.name}")
        vibe = generate_vibe(p)
        print(f"    vibe: {vibe.vibe_description[:100]}…")
        print(f"    tags: {vibe.tags}")
        upsert_provider(p, vibe_description=vibe.vibe_description, tags=vibe.tags)

    print(f"\nDone. {len(providers)} providers in embeddings.json.")


if __name__ == "__main__":
    main()
