from fastapi import APIRouter, HTTPException
from schemas import Provider, ProviderSearchRequest, ProviderSearchResponse
from services.provider_search import search_providers
from services.vector_store import query_providers

router = APIRouter(prefix="/api/v1/providers", tags=["providers"])


@router.post("/search", response_model=ProviderSearchResponse)
async def search(req: ProviderSearchRequest) -> ProviderSearchResponse:
    try:
        return search_providers(req.query, req.city, req.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[dict])
async def list_providers(city: str | None = None) -> list[dict]:
    """Debug endpoint — returns raw ChromaDB metadata for all providers."""
    rows = query_providers("", city, limit=50)
    return [r["metadata"] for r in rows]
