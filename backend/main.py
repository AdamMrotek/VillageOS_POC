import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.extract import router as extract_router
from routers.providers import router as providers_router
from routers.events import router as events_router

app = FastAPI(title="VillageOS API", version="0.1.0")

_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(extract_router)
app.include_router(providers_router)
app.include_router(events_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
