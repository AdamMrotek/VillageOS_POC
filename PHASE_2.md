# VillageOS — Phase 2: RAG Provider Search PoC

**Version:** 0.1  
**Date:** 2026-04-30  
**Status:** Draft

---

## Goal

Build a working RAG pipeline that lets a parent type a natural-language query ("birthday venue for a 4-year-old, not too loud") and receive AI-synthesised recommendations backed by real provider embeddings, displayed as **ProviderCard** components in a chat-style UI.

**Done when:** 5 seeded providers, 3 test queries, each returns ≥1 relevant card with synthesised explanation.

---

## Architecture

```
Parent types query
        │
        ▼
POST /api/v1/providers/search
        │
        ├─ Embed query (text-embedding-3-small)
        │
        ├─ Metadata pre-filter (city, age_range)   ← avoids geographically wrong results
        │
        ├─ Vector similarity search (ChromaDB, top-K=3)
        │
        ├─ Build context block from top-K provider docs
        │
        └─ LLM synthesis (gpt-4o-mini) → SearchResponse
                │
                ▼
        Frontend renders:
          - ChatMessage (AI text)
          - ProviderCard × N (one per result)
```

**Why ChromaDB over pgvector for PoC:** Zero infra — pure Python, persists to a local directory. pgvector requires Docker + Postgres; that's Phase 3. The `Provider` schema and search contract are identical, so the swap is a one-line change to the service layer.

---

## New Files

```
backend/
  routers/
    providers.py          # POST /api/v1/providers/search
  services/
    vector_store.py       # ChromaDB init, embed, upsert, query
    provider_search.py    # RAG pipeline: embed → filter → retrieve → synthesise
  data/
    seed_providers.py     # Runnable script: upserts 8 providers into ChromaDB
    providers.json        # Seed data (source of truth)

frontend/
  app/
    search/
      page.tsx            # /search route — chat UI
  components/
    ProviderCard.tsx       # Card component for a single provider result
    ChatMessage.tsx        # Wrapper for AI text + embedded cards
  lib/
    types.ts              # extend: Provider, ProviderSearchResponse
    api.ts                # extend: searchProviders()
```

---

## Data Schema

### Backend — add to `schemas.py`

```python
class Provider(BaseModel):
    id: str
    name: str
    category: str                    # "birthday_venue" | "sports_club" | "school" | etc.
    city: str                        # Used for metadata pre-filter
    description: str                 # Embedded + used in RAG context
    contact_email: Optional[str] = None
    website: Optional[str] = None
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    tags: list[str] = []
    price_indicator: Optional[str] = None   # "£" | "££" | "£££"
    noise_level: Optional[str] = None       # "quiet" | "moderate" | "loud"


class ProviderResult(BaseModel):
    provider: Provider
    relevance_score: float           # 0–1, from vector similarity


class ProviderSearchRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=500)
    city: Optional[str] = "Kingston" # Metadata pre-filter
    limit: int = Field(default=3, ge=1, le=10)


class ProviderSearchResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    results: list[ProviderResult]
    synthesis: str                   # LLM-generated recommendation paragraph
    model_used: str
    tokens_used: int
```

### Frontend — extend `lib/types.ts`

```typescript
export interface Provider {
  id: string;
  name: string;
  category: string;
  city: string;
  description: string;
  contact_email?: string | null;
  website?: string | null;
  age_range_min?: number | null;
  age_range_max?: number | null;
  tags: string[];
  price_indicator?: string | null;
  noise_level?: string | null;
}

export interface ProviderResult {
  provider: Provider;
  relevance_score: number;
}

export interface ProviderSearchResponse {
  results: ProviderResult[];
  synthesis: string;
  model_used: string;
  tokens_used: number;
}
```

---

## Seed Data — 8 Kingston Providers

File: `backend/data/providers.json`

```json
[
  {
    "id": "p001",
    "name": "Chessington World of Adventures",
    "category": "birthday_venue",
    "city": "Kingston",
    "description": "Theme park with rides and animal experiences. Offers birthday party packages for groups. Very popular with children aged 4–12. Can be loud and busy on weekends.",
    "website": "https://www.chessington.com",
    "age_range_min": 3,
    "age_range_max": 14,
    "tags": ["birthday", "outdoor", "theme-park", "groups"],
    "price_indicator": "£££",
    "noise_level": "loud"
  },
  {
    "id": "p002",
    "name": "The Clay Room Kingston",
    "category": "birthday_venue",
    "city": "Kingston",
    "description": "Pottery painting studio offering calm, creative birthday parties. Children paint ceramics and take them home fired. Ideal for smaller groups who prefer a quieter activity.",
    "website": "https://www.theclayroom.co.uk",
    "age_range_min": 4,
    "age_range_max": 12,
    "tags": ["birthday", "creative", "quiet", "indoor", "arts-crafts"],
    "price_indicator": "££",
    "noise_level": "quiet"
  },
  {
    "id": "p003",
    "name": "Kingston Gymnastics Club",
    "category": "sports_club",
    "city": "Kingston",
    "description": "Recreational and competitive gymnastics for children from age 3. Weekly classes plus holiday camps. Birthday parties in the gym available on Sundays.",
    "website": "https://www.kingstongym.co.uk",
    "age_range_min": 3,
    "age_range_max": 16,
    "tags": ["gymnastics", "sport", "birthday", "classes", "holiday-camp"],
    "price_indicator": "££",
    "noise_level": "moderate"
  },
  {
    "id": "p004",
    "name": "Surbiton Racket & Fitness Club",
    "category": "sports_club",
    "city": "Kingston",
    "description": "Tennis, squash, and fitness club with junior coaching programmes. Mini tennis for ages 4–8, full junior programme for ages 8+. Family-friendly atmosphere.",
    "age_range_min": 4,
    "age_range_max": 18,
    "tags": ["tennis", "sport", "junior", "coaching"],
    "price_indicator": "££",
    "noise_level": "moderate"
  },
  {
    "id": "p005",
    "name": "All Saints' Church of England Primary School",
    "category": "school",
    "city": "Kingston",
    "description": "Ofsted 'Outstanding' Church of England primary school in Kingston town centre. PTA runs regular events including bake sales, fairs, and sports days.",
    "age_range_min": 4,
    "age_range_max": 11,
    "tags": ["school", "primary", "church-of-england", "pta"],
    "price_indicator": "£",
    "noise_level": "moderate"
  },
  {
    "id": "p006",
    "name": "Hobbledown Heath Farm Park",
    "category": "birthday_venue",
    "city": "Kingston",
    "description": "Farm park with animals, play areas, and adventure zones. Birthday party packages include a dedicated party room and farm trail. Good for energetic young children.",
    "website": "https://www.hobbledown.com",
    "age_range_min": 2,
    "age_range_max": 10,
    "tags": ["birthday", "farm", "outdoor", "animals", "adventure"],
    "price_indicator": "££",
    "noise_level": "moderate"
  },
  {
    "id": "p007",
    "name": "Little Kickers Kingston",
    "category": "sports_club",
    "city": "Kingston",
    "description": "Football coaching franchise for pre-school and primary age children. Fun, non-competitive sessions focused on fundamentals and confidence. Age groups: 18 months to 7 years.",
    "website": "https://www.littlekickers.co.uk",
    "age_range_min": 1,
    "age_range_max": 7,
    "tags": ["football", "sport", "toddler", "pre-school", "coaching"],
    "price_indicator": "£",
    "noise_level": "moderate"
  },
  {
    "id": "p008",
    "name": "Richmond Park Café — Events Lawn",
    "category": "birthday_venue",
    "city": "Kingston",
    "description": "Outdoor party space adjacent to Richmond Park café. Suitable for informal picnic-style birthday parties. Open air, very quiet, no package — bring your own food and decorations.",
    "age_range_min": 1,
    "age_range_max": 99,
    "tags": ["birthday", "outdoor", "picnic", "quiet", "free", "nature"],
    "price_indicator": "£",
    "noise_level": "quiet"
  }
]
```

---

## Backend Implementation Plan

### Step 1 — Install dependencies

```
chromadb
openai          # already installed
```

Add to `requirements.txt`.

### Step 2 — `services/vector_store.py`

- Initialise a persistent ChromaDB client pointing to `backend/data/chroma_db/`
- `get_or_create_collection("providers")` — uses `text-embedding-3-small` via OpenAI embedding function
- `upsert_provider(provider: Provider)` — embed `name + category + description + tags joined`
- `query_providers(query: str, city_filter: str | None, limit: int) → list[dict]` — embed query, apply `where={"city": city_filter}` metadata filter, return top-K with distance scores

### Step 3 — `services/provider_search.py`

```
query_providers()               ← vector similarity
        │
        ▼
Build context block:
  "Provider: {name}\nDescription: {description}\nTags: {tags}\n\n" × N
        │
        ▼
gpt-4o-mini prompt:
  "You are a helpful local guide for parents in Kingston.
   Given the parent's query and the following providers, write 2–3 sentences
   recommending the best options and why. Be specific.
   
   Query: {query}
   
   Providers:
   {context}
   
   Respond in plain English. Do not invent information not in the provider data."
        │
        ▼
Return ProviderSearchResponse
```

### Step 4 — `routers/providers.py`

```
POST /api/v1/providers/search   →  ProviderSearchResponse
GET  /api/v1/providers          →  list[Provider]          (debug/admin)
```

Register router in `main.py`.

### Step 5 — `data/seed_providers.py`

Runnable script: `python -m backend.data.seed_providers`

Loads `providers.json`, calls `upsert_provider()` for each. Idempotent (ChromaDB upsert).

---

## Frontend Implementation Plan

### Step 1 — `ProviderCard.tsx`

Fields to display:
- Name (bold), category badge, city
- Description (truncated to 2 lines, expandable)
- Tags (Badge components, same pattern as EventCard)
- Age range: "Ages 3–12"
- Noise level icon: 🔇 quiet / 🔉 moderate / 🔊 loud
- Price indicator: £ / ££ / £££
- Website link (if present)
- Relevance score bar (subtle, 0–1 → thin coloured strip at card bottom)

### Step 2 — `ChatMessage.tsx`

Renders one turn of the chat:
- AI synthesis text (plain prose paragraph)
- Grid of `ProviderCard` components below it

### Step 3 — `/search` page (`app/search/page.tsx`)

Layout:
```
┌─────────────────────────────────┐
│  Find a provider                │
│                                 │
│  [Search input + button]        │
│                                 │
│  ┌─────────────────────────┐    │
│  │ AI synthesis paragraph  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Card 1│ │Card 2│ │Card 3│    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│  [History of past queries]      │
└─────────────────────────────────┘
```

State:
- `query: string` — controlled input
- `history: Array<{ query: string; response: ProviderSearchResponse }>` — past turns
- `loading: boolean`

Behaviour:
- Submit query → call `searchProviders()` → append to history
- Each history item renders as `<ChatMessage />`
- Input clears after submit; focus returns to input

### Step 4 — `lib/api.ts` extension

```typescript
export async function searchProviders(
  query: string,
  city = "Kingston",
  limit = 3
): Promise<ProviderSearchResponse> {
  const res = await fetch(`${API_BASE}/api/v1/providers/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, city, limit }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Step 5 — Nav link

Add "Find providers" link to the existing layout pointing to `/search`.

---

## Test Queries (PoC Validation)

| # | Query | Expected top result |
|---|-------|---------------------|
| 1 | "birthday venue for a 4-year-old that isn't too loud" | The Clay Room or Richmond Park |
| 2 | "football coaching for my toddler" | Little Kickers |
| 3 | "outdoor birthday party ideas in Kingston" | Hobbledown or Richmond Park |

All 3 queries must return ≥1 relevant card and a coherent synthesis paragraph.

---

## Done Criteria

- [ ] `python -m backend.data.seed_providers` completes without error, 8 providers in ChromaDB
- [ ] `POST /api/v1/providers/search` returns valid `ProviderSearchResponse` for all 3 test queries
- [ ] `/search` page renders, submitting a query displays `ChatMessage` with synthesis + cards
- [ ] `ProviderCard` displays name, description, tags, noise level, price, age range
- [ ] History persists within the session (prior queries remain visible above)
- [ ] No provider data is fabricated by the LLM (prompt explicitly prevents this)

---

## Token Spend Visibility

All LLM calls must log token usage so spend is always observable:

- `ProviderSearchResponse.tokens_used` already surfaces prompt + completion tokens per request
- Backend should also `print` / log `{model, prompt_tokens, completion_tokens, total_tokens}` on every OpenAI call so it appears in server output during development
- Phase 3: push these figures to a lightweight cost-tracking table (model, tokens, estimated_usd, timestamp) so spend can be queried over time

---

## Out of Scope for This PoC

- Auth / per-user provider subscriptions
- Provider profile admin pages
- Streaming responses
- pgvector / Supabase (Phase 3 infra swap)
- Adding / editing providers via UI
