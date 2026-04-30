"""
Run: python -m backend.data.seed_providers
Loads providers.json and upserts all providers into ChromaDB. Idempotent.
"""
import json
import os
from dotenv import load_dotenv

load_dotenv()

from backend.schemas import Provider
from backend.services.vector_store import upsert_provider

_DATA_FILE = os.path.join(os.path.dirname(__file__), "providers.json")


def main() -> None:
    with open(_DATA_FILE) as f:
        raw = json.load(f)

    providers = [Provider(**p) for p in raw]
    for p in providers:
        upsert_provider(p)
        print(f"  upserted: {p.id} — {p.name}")

    print(f"\nDone. {len(providers)} providers in ChromaDB.")


if __name__ == "__main__":
    main()
