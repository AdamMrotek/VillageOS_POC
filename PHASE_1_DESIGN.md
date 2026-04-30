# VillageOS — Phase 1 Implementation Design

**Version:** 0.3  
**Date:** 2026-04-30  
**Author:** Adam Mrotek  
**Status:** In Progress — backend + frontend built, model evaluation complete (see Section 10)  
**Companion docs:** [PRD.md](./PRD.md) · [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)

---

## Goal

Build the vertical slice: **raw text in → structured JSON → UI card out**.

No database. No auth. No image upload. No calendar view. One API endpoint, one page, one card. Done when all 10 golden-dataset inputs produce a correct event card.

---

## 1. What We Are Building

```
┌─────────────────────────────────────────────────────────────┐
│  /create_event  (Next.js page)                              │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  Textarea            │  │  Event Card (static)         │ │
│  │                      │  │                              │ │
│  │  Paste WhatsApp      │  │  Title: Bake Sale            │ │
│  │  text, newsletter,   │  │  Type:  Fundraiser           │ │
│  │  anything...         │  │  Date:  Sun 24 May, 3:00 PM  │ │
│  │                      │  │  Where: School Hall          │ │
│  │  [Extract →]         │  │  Bring: £2 in an envelope    │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ POST /api/v1/extract
                          ▼
              ┌───────────────────────┐
              │  FastAPI              │
              │  + instructor         │
              │  + Ollama (dev)       │
              │  + OpenAI (prod)      │
              └───────────────────────┘
```

---

## 2. Repository Layout

```
villageos/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── schemas.py           # Pydantic models
│   ├── routers/
│   │   └── extract.py       # POST /api/v1/extract
│   ├── services/
│   │   └── extraction.py    # instructor + LLM logic (Ollama / OpenAI)
│   ├── .env                 # OPENAI_API_KEY + LLM_PROVIDER (git-ignored)
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   └── create_event/
│   │       └── page.tsx     # The single page
│   ├── components/
│   │   ├── ui/              # Shadcn components
│   │   ├── EventCard.tsx    # The result card
│   │   └── ExtractForm.tsx  # The textarea + button
│   ├── lib/
│   │   └── api.ts           # fetch wrapper for /api/v1/extract
│   └── package.json
│
└── tests/
    └── golden_dataset/
        ├── 01_bake_sale.txt
        ├── 01_bake_sale_expected.json
        └── ...              # 10 pairs total
```

---

## 3. Backend

### 3.1 Pydantic Schemas (`backend/schemas.py`)

These are the only models needed for Phase 1. Keep them lean — every optional field is a field the LLM can hallucinate.

```python
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class EventType(str, Enum):
    school     = "school"
    sport      = "sport"
    birthday   = "birthday"
    fundraiser = "fundraiser"
    meeting    = "meeting"
    deadline   = "deadline"
    other      = "other"


class ActionItem(BaseModel):
    description: str
    cost_estimate_gbp: Optional[float] = None


class ParentEvent(BaseModel):
    title: str              = Field(..., description="Short title, max 60 chars")
    event_type: EventType
    start_time: datetime    = Field(..., description="ISO 8601. Infer year from context; default to next occurrence if ambiguous")
    end_time: Optional[datetime] = None
    is_all_day: bool        = False
    location: Optional[str] = None
    description: Optional[str] = Field(None, description="One sentence summary, max 120 chars")
    action_items: list[ActionItem] = []
    confidence: float       = Field(..., ge=0.0, le=1.0, description="Your confidence in the extraction, 0 to 1")


class ExtractRequest(BaseModel):
    raw_text: str = Field(..., min_length=10, max_length=8000)


class ExtractResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    event: ParentEvent
    model_used: str
    tokens_used: int
```

**Field design decisions:**

- `source_text` is **dropped** from Phase 1 (no DB — no need to store provenance yet; add back in Phase 2)
- `provider_id` is **dropped** (no providers in Phase 1)
- `tags` is **dropped** (adds noise to the LLM schema; add in Phase 2 when we need filtering)
- `confidence` is **kept** — it drives the escalation logic and is logged from day one
- `description` max 120 chars prevents the LLM writing an essay in that field
- `title` max 60 chars prevents multi-sentence titles
- `ConfigDict(protected_namespaces=())` on `ExtractResponse` suppresses Pydantic's warning about the `model_used` field name

---

### 3.2 Extraction Service (`backend/services/extraction.py`)

Supports two providers via the `LLM_PROVIDER` env var. Ollama runs locally (free, no API key). OpenAI is used for production or higher accuracy.

```python
import os
import instructor
from openai import AsyncOpenAI
from datetime import date
from backend.schemas import ParentEvent, ExtractResponse

SYSTEM_PROMPT = """
You are a calendar assistant for parents. Extract structured event information
from the text provided. Rules:
- If multiple events exist, extract only the most prominent one.
- If a date is relative ("next Friday"), resolve it to an absolute date.
  Today is {today}.
- If you cannot determine a required field with confidence, set confidence < 0.7.
- Never invent details not present in the text.
""".strip()

_client = None
_provider = None


def _get_client():
    global _client, _provider
    if _client is not None:
        return _client, _provider

    _provider = os.getenv("LLM_PROVIDER", "ollama")

    if _provider == "ollama":
        _client = instructor.from_openai(
            AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama"),
            mode=instructor.Mode.JSON,
        )
    else:
        _client = instructor.from_openai(AsyncOpenAI())

    return _client, _provider


def _models() -> tuple[str, str]:
    """Return (fast_model, smart_model) for the current provider."""
    _, provider = _get_client()
    if provider == "ollama":
        return "qwen2.5:7b", "qwen2.5:7b"
    return "gpt-4o-mini", "gpt-4o"


async def extract_event(raw_text: str) -> ExtractResponse:
    today = date.today().isoformat()
    fast_model, smart_model = _models()
    client, _ = _get_client()

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(today=today)},
        {"role": "user",   "content": raw_text},
    ]

    model = fast_model
    response, completion = await client.chat.completions.create_with_completion(
        model=model,
        response_model=ParentEvent,
        max_retries=2,
        messages=messages,
    )

    if response.confidence < 0.7 and fast_model != smart_model:
        model = smart_model
        response, completion = await client.chat.completions.create_with_completion(
            model=model,
            response_model=ParentEvent,
            max_retries=2,
            messages=messages,
        )

    return ExtractResponse(
        event=response,
        model_used=model,
        tokens_used=completion.usage.total_tokens,
    )
```

**Key decisions:**

- `LLM_PROVIDER=ollama` (default) points at `http://localhost:11434/v1` — Ollama's OpenAI-compatible endpoint. No API key needed.
- `instructor.Mode.JSON` is used for Ollama because it doesn't support OpenAI-style function calling; JSON mode is more reliable.
- `LLM_PROVIDER=openai` uses the standard OpenAI client — just change the env var, no code changes.
- Model escalation (`confidence < 0.7`) is skipped for Ollama since both fast and smart model are the same (`qwen2.5:7b`). Only applies when using OpenAI (`gpt-4o-mini` → `gpt-4o`).
- `create_with_completion` returns both the Pydantic model AND the raw completion, so we can read `usage.total_tokens` without a second API call.
- `max_retries=2` caps instructor's retry loop if the LLM produces invalid JSON.
- The client is initialised lazily — the server starts cleanly even without a real API key in the env.

---

### 3.3 Router (`backend/routers/extract.py`)

```python
from fastapi import APIRouter, HTTPException
from backend.schemas import ExtractRequest, ExtractResponse
from backend.services.extraction import extract_event

router = APIRouter(prefix="/api/v1", tags=["extraction"])


@router.post("/extract", response_model=ExtractResponse)
async def extract(body: ExtractRequest) -> ExtractResponse:
    try:
        return await extract_event(body.raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 3.4 App Entry Point (`backend/main.py`)

```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers.extract import router

app = FastAPI(title="VillageOS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

`load_dotenv()` must be called before any other import so `OPENAI_API_KEY` and `LLM_PROVIDER` are in the environment before the lazy client initialises.

CORS allows `localhost:3000` only. In Phase 2, replace with the Vercel deployment URL.

---

### 3.5 Dependencies (`backend/requirements.txt`)

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
instructor==1.4.0
openai==1.40.0
httpx<0.28
pydantic==2.8.0
python-dotenv==1.0.1
```

**Note:** `httpx<0.28` is required. `httpx` 0.28 removed the `proxies` argument that `openai` 1.40.0 passes internally, causing a crash on startup. Pinning `httpx<0.28` resolves this without upgrading either `instructor` or `openai` (which have their own breaking changes in later versions).

**Python version:** 3.9 (system Python on macOS). `instructor` versions above 1.4.0 use `str | Path` union syntax which requires Python 3.10+. Stay on `instructor==1.4.0` until Python is upgraded.

---

### 3.6 API Contract

**Test input (bake sale)**
```
Reminder from school: Bake Sale this Friday 24th May at 3pm in the school hall. Please bring £2 in a labelled envelope.
```

**Request**
```
POST /api/v1/extract
Content-Type: application/json

{
  "raw_text": "Reminder from school: Bake Sale this Friday 24th May at 3pm in the school hall. Please bring £2 in a labelled envelope."
}
```

**Response (success — Ollama)**
```json
{
  "event": {
    "title": "Bake Sale",
    "event_type": "fundraiser",
    "start_time": "2026-05-24T15:00:00",
    "end_time": null,
    "is_all_day": false,
    "location": "school hall",
    "description": "Bake Sale fundraising event at school.",
    "action_items": [
      { "description": "Bring £2 in a labelled envelope to the Bake Sale.", "cost_estimate_gbp": null }
    ],
    "confidence": 0.98
  },
  "model_used": "qwen2.5:7b",
  "tokens_used": 957
}
```

**Response (validation error)**
```json
{ "detail": "raw_text must be at least 10 characters" }
```

**Response (LLM error / timeout)**
```json
{ "detail": "..." }
```

---

### 3.7 Running the Backend

```bash
# From repo root
cd /path/to/villageos

# First time only
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt

# Set env (Ollama needs no API key)
# backend/.env already contains: LLM_PROVIDER=ollama

# Start server
backend/.venv/bin/uvicorn backend.main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
# Health check: http://localhost:8000/health
```

To switch to OpenAI, change `backend/.env`:
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## 4. Frontend

### 4.1 Page Layout (`frontend/app/create_event/page.tsx`)

Two-column layout. Left: input form. Right: event card (empty state until extraction runs).

```
┌──────────────────────────────────────────────────────────────┐
│  VillageOS                                                   │
├──────────────────────────────┬───────────────────────────────┤
│  PASTE YOUR TEXT             │  EVENT PREVIEW                │
│                              │                               │
│  ┌────────────────────────┐  │  [Empty state: ghost card     │
│  │                        │  │   with placeholder text]      │
│  │  Textarea              │  │                               │
│  │  (min 4 rows)          │  │  ─ OR ─                       │
│  │                        │  │                               │
│  └────────────────────────┘  │  ┌───────────────────────┐   │
│                              │  │  BAKE SALE             │   │
│  [Extract Event →]  button   │  │  Fundraiser            │   │
│                              │  │  Sun 24 May · 3:00 PM  │   │
│  Loading spinner while       │  │  school hall           │   │
│  waiting for API             │  │                        │   │
│                              │  │  Action items:         │   │
│                              │  │  · Bring £2 envelope   │   │
│                              │  │                        │   │
│                              │  │  Confidence: 98%       │   │
│                              │  │  Model: qwen2.5:7b     │   │
│                              │  └───────────────────────┘   │
└──────────────────────────────┴───────────────────────────────┘
```

**Mobile:** Stack vertically (textarea on top, card below). Tailwind `flex-col md:flex-row`.

---

### 4.2 Component Breakdown

#### `ExtractForm.tsx`

Responsibilities:
- Controlled textarea (min 4 rows, max 8000 chars, char counter displayed)
- "Extract Event" button
- Calls `lib/api.ts` on submit
- Passes result up to the page via `onResult` callback
- Handles loading state (button disabled + spinner) and error state (red error banner)

Props:
```typescript
interface ExtractFormProps {
  onResult: (result: ExtractResponse | null) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}
```

#### `EventCard.tsx`

Responsibilities:
- Renders a `ParentEvent` as a styled card
- Shows an empty/ghost state when `event` is null
- Formats `start_time` as human-readable ("Fri 24 May · 3:00 PM")
- Colour-codes `event_type` badge (fundraiser = amber, school = blue, sport = green, etc.)
- Shows confidence as a subtle percentage at the bottom
- Shows `model_used` and `tokens_used` in a collapsed "Debug" section (useful for portfolio demos)

Props:
```typescript
interface EventCardProps {
  event: ParentEvent | null;
  modelUsed?: string;
  tokensUsed?: number;
}
```

#### `lib/api.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function extractEvent(rawText: string): Promise<ExtractResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text: rawText }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Extraction failed");
  }

  return res.json();
}
```

---

### 4.3 TypeScript Types (`frontend/lib/types.ts`)

Mirror the Pydantic schemas exactly. These are the only types used in the frontend — no `any`.

```typescript
export type EventType =
  | "school"
  | "sport"
  | "birthday"
  | "fundraiser"
  | "meeting"
  | "deadline"
  | "other";

export interface ActionItem {
  description: string;
  cost_estimate_gbp?: number | null;
}

export interface ParentEvent {
  title: string;
  event_type: EventType;
  start_time: string;       // ISO 8601 string from JSON
  end_time?: string | null;
  is_all_day: boolean;
  location?: string | null;
  description?: string | null;
  action_items: ActionItem[];
  confidence: number;
}

export interface ExtractResponse {
  event: ParentEvent;
  model_used: string;
  tokens_used: number;
}
```

---

### 4.4 Event Type Badge Colours

| EventType | Tailwind classes |
|-----------|-----------------|
| `school` | `bg-blue-100 text-blue-800` |
| `sport` | `bg-green-100 text-green-800` |
| `birthday` | `bg-pink-100 text-pink-800` |
| `fundraiser` | `bg-amber-100 text-amber-800` |
| `meeting` | `bg-purple-100 text-purple-800` |
| `deadline` | `bg-red-100 text-red-800` |
| `other` | `bg-gray-100 text-gray-700` |

---

### 4.5 Date Formatting

Use the browser's `Intl.DateTimeFormat` — no extra library needed.

```typescript
function formatEventTime(isoString: string, isAllDay: boolean): string {
  const date = new Date(isoString);
  if (isAllDay) {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short", day: "numeric", month: "long",
    }).format(date);
    // → "Fri 24 May"
  }
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date);
  // → "Fri 24 May at 3:00 pm"
}
```

---

### 4.6 Shadcn Components Installed

```bash
cd frontend
npx shadcn@latest init        # New York style, CSS variables
npx shadcn@latest add button textarea card badge separator
```

---

### 4.7 Running the Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000/create_event
```

`frontend/.env.local` already contains:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 5. Environment Variables

| Variable | Where | Dev value |
|----------|-------|-----------|
| `LLM_PROVIDER` | `backend/.env` | `ollama` |
| `OPENAI_API_KEY` | `backend/.env` | `sk-...` (only needed when `LLM_PROVIDER=openai`) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | `http://localhost:8000` |

Neither `.env` file is committed. Both are covered by `.gitignore`.

---

## 6. Golden Dataset

Ten input/expected-output pairs that define "Phase 1 is done." Store raw inputs as `.txt` files and expected outputs as `.json` files in `tests/golden_dataset/`.

| # | File | Input type | Key challenge |
|---|------|-----------|--------------|
| 01 | `bake_sale` | WhatsApp thread | Date buried mid-argument |
| 02 | `sports_day` | WhatsApp thread | Time change mid-thread, conflicting messages |
| 03 | `newsletter` | Pasted newsletter | Multiple events — extract the most prominent |
| 04 | `trip_email` | Email | Permission slip deadline + event date (two dates) |
| 05 | `party_invite` | Email (informal) | No explicit year, infer from context |
| 06 | `fundraiser` | WhatsApp thread | Action item with cost ("bring £2") |
| 07 | `football_match` | WhatsApp thread | Recurring event ("every Saturday") — extract next occurrence |
| 08 | `school_meeting` | Email | All-day event with no time given |
| 09 | `birthday_party` | WhatsApp thread | Relative date ("next Saturday") must resolve to absolute |
| 10 | `trip_reminder` | Email chain | Reply thread; relevant info is in one message, noise in others |

**Pass criteria per test case:**
- `event_type` matches expected
- `start_time` is within ±30 minutes of expected
- `title` is non-empty and not the raw input
- `confidence >= 0.7`
- No `instructor` validation error thrown

Run with:
```bash
cd backend
python -m pytest tests/golden_dataset/ -v
```

---

## 7. What Is Explicitly Out of Scope for Phase 1

| Item | When |
|------|------|
| Image / OCR upload | Phase 2 |
| Saving events to a database | Phase 2 |
| Edit-before-save UI | Phase 2 |
| Authentication | Phase 2 |
| Multiple events from one input | Phase 2 |
| Provider search / RAG | Phase 2 |
| MCP server | Phase 1 stretch goal |
| Mobile responsiveness beyond basic stacking | Phase 2 |
| Error retry UI ("Try again" button) | Phase 2 |

---

## 8. Definition of Done

Phase 1 is complete when:

- [x] `POST /api/v1/extract` returns a valid `ExtractResponse` — verified with curl + Ollama
- [x] `/create_event` page loads, accepts text, calls the API, and renders the event card
- [x] Loading state (spinner) and error state (error banner) both render correctly
- [x] Token count and model used are visible in the card debug section
- [x] No hardcoded values — all config via `.env` / `.env.local`
- [ ] All 10 golden-dataset pytest tests pass
- [ ] `confidence < 0.7` triggers escalation to `gpt-4o` (verify by checking `model_used` in response) — only testable with `LLM_PROVIDER=openai`

---

## 10. Model Evaluation — Phase 1 Live Testing

**Date:** 2026-04-30  
**Test input:** Stanley's May Day event (multi-section structured document with activities, refreshments, and ticket pricing)  
**Evaluated dimensions:** speed, event_type accuracy, action_items extraction, token usage

### Results

| Model | Provider | Mode | Speed | `event_type` | `action_items` | Tokens |
|---|---|---|---|---|---|---|
| `qwen2.5:7b` | Ollama (local) | JSON | ~seconds | good | — | — |
| `qwen3:4b` | Ollama (local) | TOOLS | ~2 min | ✅ correct | ❌ missed | 4,567 |
| `qwen3:4b` | Ollama (local) | JSON | ~2 min | partial | partial | 6,124 |
| `llama3.1:8b` | Ollama (local) | TOOLS | 4.7s | ❌ `birthday` | ❌ missed | 677 |
| `llama-3.1-8b-instant` | Groq | TOOLS | 0.97s | ❌ `birthday` | ❌ missed | 891 |
| `llama-3.1-8b-instant` | Groq | JSON | 0.88s | ❌ `birthday` | ❌ missed | 2,405 |
| `llama-3.3-70b-versatile` | Groq | JSON | 0.42s | ✅ `other` | ❌ missed | 1,073 |
| `llama-3.3-70b-versatile` | Groq | TOOLS | 0.57s | ✅ `other` | ❌ missed | 905 |
| `gpt-4o-mini` | OpenAI | JSON | 2.4s | ✅ `other` | ❌ missed | 1,043 |
| `gpt-4o-mini` | OpenAI | TOOLS | 3.6s | `fundraiser` | ✅ captured | 639 |

### Key Findings

1. **Local models are too slow for production** — Qwen3:4b took ~2 minutes even on a 4B model. Acceptable for offline dev only.
2. **Groq is fastest** — `llama-3.3-70b-versatile` on Groq at 0.42–0.57s is the fastest result, faster than even the 8b model due to Groq's LPU hardware.
3. **TOOLS mode is required for action_items** — No model in JSON mode captured nested `action_items`. Only `gpt-4o-mini` with TOOLS mode extracted ticket pricing. JSON mode doesn't enforce optional nested field population.
4. **Model size matters more than mode for `event_type`** — 8b models consistently hallucinated `birthday` for "May Day". 70b models correctly classified as `other`.
5. **Groq 70b + TOOLS is the sweet spot for production** — 0.57s, correct event_type, only weak point is action_items. `gpt-4o-mini` TOOLS captures action_items but is 6× slower.

### Provider Config (Current)

Update `backend/.env` to switch provider:

```bash
# Groq (fast, free tier)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...

# OpenAI (best action_items extraction)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Local dev (no API key needed)
LLM_PROVIDER=ollama
```

Model pairs per provider (fast → smart on confidence < 0.7):

| Provider | Fast model | Smart model |
|---|---|---|
| Ollama | `llama3.1:8b` | `llama3.1:8b` |
| Groq | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` |
| OpenAI | `gpt-4o-mini` | `gpt-4o` |

### Recommendation for Golden Dataset Tests

Run the 10 golden dataset tests against `gpt-4o-mini` + TOOLS mode (OpenAI) as the reference provider. This produced the best structured output quality. Use Groq as the speed-optimised alternative once action_items extraction is validated via prompt tuning.

---

## 9. Build Order

```
1.  ✅ backend/schemas.py
2.  ✅ backend/services/extraction.py
3.  ✅ backend/routers/extract.py
4.  ✅ backend/main.py
5.  ✅ Manual API test via curl — Ollama returning correct JSON
6.  ✅ frontend/lib/types.ts
7.  ✅ frontend/lib/api.ts
8.  ✅ frontend/components/EventCard.tsx
9.  ✅ frontend/components/ExtractForm.tsx
10. ✅ frontend/app/create_event/page.tsx
11. ✅ End-to-end manual test (bake sale text → event card)
12. ⬜ Write golden dataset tests
13. ⬜ Run pytest — fix failures
```
