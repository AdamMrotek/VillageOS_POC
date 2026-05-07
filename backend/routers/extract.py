from fastapi import APIRouter, HTTPException
from schemas import ExtractRequest, ExtractResponse
from services.extraction import extract_event

router = APIRouter(prefix="/api/v1", tags=["extraction"])


@router.post("/extract", response_model=ExtractResponse)
async def extract(body: ExtractRequest) -> ExtractResponse:
    try:
        return await extract_event(body.raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
