from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers.extract import router as extract_router
from backend.routers.providers import router as providers_router
from backend.routers.events import router as events_router

app = FastAPI(title="VillageOS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(extract_router)
app.include_router(providers_router)
app.include_router(events_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
