# VillageOS — Project Conclusion

**Version:** 1.0  
**Date:** 2026-05-04  
**Author:** Adam Mrotek  
**Status:** Complete (PoC)

---

## What Was Built

VillageOS is a family operating system that converts unstructured parent communications — WhatsApp threads, school newsletters, email chains — into structured, actionable calendar events using AI extraction. It was built in three phases over approximately one week, starting from a blank repo and ending with a working, end-to-end PoC.

---

## Phase Summary

### Phase 1 — Extraction Engine (Complete)

The vertical slice: **raw text in → structured JSON → UI card out**.

**What shipped:**
- FastAPI backend with a single `POST /api/v1/extract` endpoint
- `instructor` + Pydantic v2 enforcing schema-valid LLM output — no raw JSON parsing anywhere
- Model routing: `gpt-4o-mini` → `gpt-4o` escalation when confidence < 0.7
- Multi-provider support via a single `LLM_PROVIDER` env var (Ollama, Groq, OpenAI)
- Next.js frontend: textarea input, event preview card, loading and error states
- Token usage and model name surfaced in the UI

**Model evaluation findings (live testing, 2026-04-30):**

The most important discovery was that **extraction mode matters more than model size for nested fields**. No model in JSON mode reliably populated `action_items`. Only `gpt-4o-mini` with TOOLS mode extracted nested ticket pricing and action items correctly. 8B models consistently hallucinated `event_type: birthday` for unrelated events; 70B models did not.

| Provider | Speed | `event_type` | `action_items` |
|----------|-------|-------------|----------------|
| Ollama `qwen3:4b` | ~2 min | partial | ❌ |
| Groq `llama-3.3-70b` | 0.57s | ✅ | ❌ |
| OpenAI `gpt-4o-mini` TOOLS | 3.6s | ✅ | ✅ |

**Remaining:** Golden dataset pytest suite (10 tests) is the only unclosed Phase 1 item.

---

### Phase 2 — RAG Provider Search (Complete)

Natural-language provider discovery backed by vector search: **"birthday venue for a 4-year-old, not too loud"** → AI-synthesised recommendations with provider cards.

**What shipped:**
- ChromaDB as zero-infra local vector store (no Docker, no Postgres required for PoC)
- OpenAI `text-embedding-3-small` for provider embeddings
- Metadata pre-filter before vector search (`city`, `age_range`) — the correct retrieval engineering pattern
- LLM synthesis via `gpt-4o-mini` constrained to only information present in the retrieved documents
- 8 seeded Kingston providers with realistic descriptions, noise levels, age ranges, and price indicators
- `/search` page with chat-style history: each query appends a synthesis paragraph + provider card grid

**Key retrieval engineering decision:** Metadata filter runs *before* vector similarity search, not after. This prevents semantically similar but geographically wrong results — a subtle but critical distinction between retrieval engineering and a naive `similarity_search()` call.

**ChromaDB → pgvector swap:** The vector store is isolated behind a single `vector_store.py` service. Swapping to Supabase pgvector in Phase 4 is a one-file change.

---

### Phase 3 — Calendar View (Complete) + MCP Server (Cut)

**What shipped:**
- `/calendar` page with a custom Tailwind month grid (no FullCalendar dependency)
- Colour-coded event dots per day, today highlighted, 7-day upcoming timeline below the grid
- `GET /api/v1/events` backend endpoint with `?from_date&to_date` query params
- 12 seeded events across May 2026 covering all 7 event types, with realistic action items
- `StoredEvent` schema (`ParentEvent` + `id`) added and wired end-to-end

**MCP server — removed from scope.**

The MCP server was cut after a structural security analysis, not a time constraint. The core problem:

VillageOS is specifically designed to ingest content from sources *outside* the user's control — school emails, third-party newsletters, events entered by multiple parties. Any of these can be weaponised for indirect prompt injection:

```
Malicious event content enters VillageOS (via extraction, shared calendar, or imported newsletter)
    → parent asks Claude Desktop "what do I have this week?"
    → MCP returns poisoned event data as tool output
    → Claude acts on embedded instructions on the parent's behalf
```

The attack surface is structural. MCP tools are safe only when the connected data source is **fully trusted, write-controlled, and internal**. VillageOS fails both conditions by design. This was the right cut.

---

## Architecture Decisions That Held

**`instructor` + Pydantic as the AI contract.** Using the same Pydantic models for both LLM extraction enforcement and FastAPI request/response validation eliminated an entire class of schema drift bugs. There is one definition of `ParentEvent`, used at every enforcement point in the system. This was the most important architectural decision.

**Metadata filter before vector search.** The pre-filter pattern (`WHERE city = 'Kingston' AND age_range_min <= $child_age`) before running cosine similarity is what separates production retrieval from a toy demo. It was designed in from Phase 2 rather than bolted on.

**One database for all persistence.** pgvector as a Postgres extension (Supabase, Phase 4) means events, embeddings, and user records share one connection string, one backup, and one monitoring setup. Pinecone or Weaviate would have been a second infra dependency for a problem pgvector solves adequately at this scale.

**ChromaDB as PoC vector store.** Zero infrastructure for Phase 2 let the retrieval logic be validated against real queries before committing to a hosted database. The swap to pgvector is one file.

---

## What Was Learned

### On AI extraction

- Structured output mode (TOOLS / function calling) is not optional when the schema has nested objects. JSON mode does not enforce nested field population even when the schema defines them.
- Model routing based on confidence score is worth the added code complexity. A `gpt-4o-mini` → `gpt-4o` escalation path costs almost nothing when confidence is high (the common case) and materially improves output when it is not.
- The `instructor` retry loop should be capped. `max_retries=2` prevents runaway LLM spend on inputs that will never parse correctly.
- Preprocessing source text (stripping email signatures, footers, boilerplate) before the LLM call is the highest-leverage prompt cost reduction — not model routing.

### On RAG

- The quality of the synthesis is bounded by the quality of the retrieved documents. The 8 seeded providers have detailed, accurate descriptions because RAG cannot surface information that was not embedded.
- Top-K=3 is the right ceiling for a synthesis prompt. More retrieved documents increase synthesis coherence but also hallucination risk as the context grows.
- Embedding the query at search time costs ~0.001 tokens per character. At this scale it is negligible; at production scale, query caching becomes relevant.

### On MCP

- The security model for MCP tools assumes the data source is internal and controlled. Consumer products that aggregate from external inputs violate this assumption by design.
- Cutting a feature after discovering a structural security problem is good engineering, not a failure. The analysis is a more valuable portfolio artefact than a shipped-but-unsafe MCP server would have been.

---

## Cost Profile (PoC)

| Operation | Model | Approx. tokens | Approx. cost |
|-----------|-------|---------------|-------------|
| Text extraction (TOOLS) | `gpt-4o-mini` | ~640 | ~$0.0002 |
| Text extraction (escalated) | `gpt-4o` | ~640 | ~$0.006 |
| Query embedding | `text-embedding-3-small` | ~20 | < $0.0001 |
| RAG synthesis | `gpt-4o-mini` | ~800 | ~$0.0003 |

A typical parent session (3 extractions + 2 provider searches) costs under $0.002. The < $0.01 per extraction PoC target is met comfortably by `gpt-4o-mini` TOOLS mode; escalation to `gpt-4o` remains well under $0.01.

---

## What Phase 4 Would Deliver

The PoC proves the core product loop. Phase 4 would close the remaining gaps for a real user:

1. **Persistence** — replace in-memory event store with Supabase PostgreSQL. `POST /api/v1/events` saves confirmed events; the calendar shows them on next load.
2. **Extract → confirm → save flow** — the edit-before-save UI (review AI output, correct hallucinations, then persist) closes the loop from the extraction page to the calendar.
3. **Auth** — Clerk for Parent / Provider roles. Events are per-user, not global.
4. **pgvector swap** — migrate ChromaDB to Supabase pgvector. One file change in `vector_store.py`.
5. **Image upload** — GPT-4o vision for photographed flyers and WhatsApp screenshots.
6. **Golden dataset CI** — 10 pytest tests against `gpt-4o-mini` TOOLS mode as the regression gate.

---

## Repository Snapshot

```
villageos/
├── backend/
│   ├── main.py              ✅ FastAPI app + CORS + routers
│   ├── schemas.py           ✅ ParentEvent, Provider, StoredEvent, all response models
│   ├── routers/
│   │   ├── extract.py       ✅ POST /api/v1/extract
│   │   ├── events.py        ✅ GET /api/v1/events (seeded, in-memory)
│   │   └── providers.py     ✅ POST /api/v1/providers/search, GET /api/v1/providers
│   ├── services/
│   │   ├── extraction.py    ✅ instructor + multi-provider routing
│   │   ├── vector_store.py  ✅ ChromaDB init, upsert, query
│   │   └── provider_search.py ✅ embed → filter → retrieve → synthesise
│   └── data/
│       ├── providers.json   ✅ 8 Kingston providers
│       └── seed_providers.py ✅ Runnable upsert script
│
├── frontend/
│   ├── app/
│   │   ├── create_event/page.tsx  ✅ Extraction UI
│   │   ├── search/page.tsx        ✅ RAG search chat UI
│   │   └── calendar/page.tsx      ✅ Month grid + 7-day timeline
│   └── components/
│       ├── EventCard.tsx     ✅
│       ├── ExtractForm.tsx   ✅
│       ├── ProviderCard.tsx  ✅
│       ├── ChatMessage.tsx   ✅
│       ├── MonthCalendar.tsx ✅
│       └── WeekTimeline.tsx  ✅
│
└── tests/
    └── golden_dataset/      ⬜ 10 input/expected pairs — Phase 4
```

---

## Definition of Done — PoC

| Criterion | Status |
|-----------|--------|
| `POST /api/v1/extract` returns valid `ExtractResponse` | ✅ |
| Multi-provider LLM routing (Ollama / Groq / OpenAI) via env var | ✅ |
| `/create_event` page: textarea → API → event card | ✅ |
| Loading + error states render correctly | ✅ |
| Token count and model visible in card | ✅ |
| `POST /api/v1/providers/search` returns valid `ProviderSearchResponse` | ✅ |
| `/search` page: query → synthesis + provider cards + history | ✅ |
| `GET /api/v1/events` returns seeded events with date filtering | ✅ |
| `/calendar` page: month grid + 7-day timeline with colour coding | ✅ |
| All 10 golden dataset pytest tests pass | ⬜ Phase 4 |
| Events persist across backend restarts | ⬜ Phase 4 |
| MCP server | ✗ Cut (security) |
