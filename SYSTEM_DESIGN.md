# VillageOS — System Design Document

**Version:** 0.1  
**Date:** 2026-04-29  
**Author:** Adam Mrotek  
**Status:** Draft  
**Companion doc:** [PRD.md](./PRD.md)

---

## 1. System Overview

VillageOS is composed of four distinct layers. Each layer has a clear job and a clear boundary. The design goal is to make each layer independently testable and swappable.

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│         Next.js 14 (App Router) + Shadcn/UI                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP / REST
┌─────────────────────────▼───────────────────────────────────┐
│                       BACKEND API                           │
│              FastAPI (Python 3.12) + Pydantic v2            │
└──────┬─────────────────────────┬───────────────────────────-┘
       │                         │
┌──────▼──────┐          ┌───────▼──────────────────────────┐
│  AI LAYER   │          │           DATA LAYER             │
│  instructor │          │  PostgreSQL + pgvector            │
│  OpenAI /   │          │  (Supabase)                      │
│  Groq       │          └──────────────────────────────────┘
└─────────────┘
       │
┌──────▼──────────────────────────┐
│         MCP SERVER              │
│  TypeScript @modelcontextprotocol/sdk  │
│  Wraps FastAPI /events endpoint │
└─────────────────────────────────┘
```

---

## 2. Backend Framework

### Chosen: FastAPI (Python 3.12)

**What it does here:** Serves the REST API, owns request validation, orchestrates calls to the AI layer and database, and runs background ingestion tasks.

### Why FastAPI over the alternatives

| Alternative | Why rejected |
|------------|-------------|
| **Flask** | No async support natively; no built-in request/response validation; would need Marshmallow or Cerberus on top — duplicating what Pydantic already does |
| **Django + DRF** | Too much framework for a service whose main job is orchestrating LLM calls; ORM is useful but adds migration overhead before we've settled on the schema |
| **Express / Nest.js (Node)** | The AI ecosystem is 90% Python — `instructor`, `langchain`, `openai`, `pgvector` clients are all Python-first. Using Node means constantly translating between ecosystems |
| **Go (Gin / Fiber)** | Faster for raw throughput, but this system is I/O-bound (waiting on LLM API responses, not compute). Go's lack of AI tooling is a significant friction cost |

**Tradeoffs accepted:**
- Python is slower than Go/Rust for CPU-bound work — irrelevant here since every hot path is an awaited LLM or DB call
- FastAPI's async support requires disciplined use of `async def` throughout; mixing sync/async handlers breaks the event loop

**Key FastAPI features we rely on:**
- Pydantic v2 for request/response models (same models used by `instructor`)
- Automatic OpenAPI/Swagger docs at `/docs` — useful for MCP server integration
- `BackgroundTasks` for Phase 1–2 async jobs (email polling, preparation reminders) before we need Celery

---

## 3. Data Validation

### Chosen: Pydantic v2

**What it does here:** Defines the canonical data shapes used by _both_ FastAPI (HTTP layer) and `instructor` (AI layer). One schema, two enforcement points.

This is the most important architectural decision in the system. Pydantic is not just a validation library — it is the **contract between the LLM and the rest of the application**. When `instructor` forces the LLM to produce a `ParentEvent`, and FastAPI validates that the same `ParentEvent` leaves the API, there is exactly one definition of truth and zero translation.

### Why Pydantic v2 over alternatives

| Alternative | Why rejected |
|------------|-------------|
| **Marshmallow** | No native FastAPI integration; separate serialisation layer needed; v1 Pydantic syntax anyway |
| **attrs + cattrs** | No LLM tooling support; `instructor` is Pydantic-only |
| **Dataclasses** | No field-level validation, no JSON schema generation — `instructor` can't enforce them |
| **TypeScript Zod (if we'd gone Node)** | No Python AI SDK support |

**Tradeoffs accepted:**
- Pydantic v2 has breaking changes from v1; `instructor` requires v2 — lock `pydantic>=2.0` in `requirements.txt` explicitly
- Complex nested schemas (e.g. `ActionItem` inside `ParentEvent`) slow down LLM extraction slightly as the schema is larger; mitigate by keeping `ActionItem` lean

---

## 4. AI Extraction Layer

### 4.1 Structured Output Library

### Chosen: `instructor`

**What it does here:** Wraps the LLM API call with automatic retry logic and Pydantic schema enforcement. You pass a Pydantic model class; it returns a validated instance. If the LLM produces invalid JSON, `instructor` retries with the validation error appended to the prompt.

```python
import instructor
from openai import OpenAI

client = instructor.from_openai(OpenAI())

event = client.chat.completions.create(
    model="gpt-4o-mini",
    response_model=ParentEvent,
    messages=[{"role": "user", "content": raw_text}]
)
# event is a validated ParentEvent instance — guaranteed
```

### Why `instructor` over alternatives

| Alternative | Why rejected |
|------------|-------------|
| **LangChain** | Massive abstraction overhead for a single extraction task; hard to debug when the LLM does something unexpected; `instructor` is surgical where LangChain is opinionated |
| **Raw JSON mode** (`response_format={"type":"json_object"}`) | No automatic retry on schema violation; requires manual Pydantic parsing and error handling every time |
| **OpenAI Function Calling directly** | `instructor` is a thin wrapper _on top of_ function calling — it adds retry logic and Pydantic binding at almost zero cost |
| **Marvin** | Less actively maintained; narrower LLM provider support than `instructor` |
| **Outlines** | Excellent for local models; overkill and wrong abstraction level when using a hosted API |
| **LlamaIndex** | Document-centric; better for RAG pipelines than point extraction |

**Tradeoffs accepted:**
- `instructor` adds a small overhead (JSON schema passed as system context on every call — ~200 extra tokens)
- Retry behaviour means a single extraction can make 2–3 LLM calls; set `max_retries=2` to cap this

---

### 4.2 LLM Provider

### Chosen: OpenAI (primary) + Groq (development)

**Model routing strategy:**

```
Input received
      │
      ▼
  gpt-4o-mini  ──── confidence >= 0.7 ──── Return result
      │
  confidence < 0.7
      │
      ▼
   gpt-4o      ──── Return result (log escalation + token cost)
```

**Development / rapid iteration:** Groq (`llama-3.1-70b-versatile`) — sub-second responses, generous free tier, `instructor` supports it via the OpenAI-compatible endpoint.

### Why OpenAI over alternatives for extraction

| Alternative | Why rejected (for extraction) |
|------------|-------------------------------|
| **Anthropic Claude** | Better for synthesis and reasoning tasks (RAG responses, Morning Brief generation); less reliable for strict JSON extraction via `instructor` compared to OpenAI's native structured output support |
| **Groq (Llama-3) as primary** | Excellent for dev iteration; rate limits on free tier too restrictive for production; JSON extraction reliability is slightly lower than GPT-4o-mini for complex nested schemas |
| **Mistral** | Good cost story but smaller English-language community; fewer `instructor` usage examples to draw on |
| **Local Ollama** | Zero API cost, full privacy — but adds GPU infra complexity and latency that is unacceptable for the < 3s UX target |
| **Google Gemini** | API is competitive; `instructor` support is newer and less battle-tested |

**Where Anthropic Claude is used (Phase 3):**
- RAG synthesis responses ("I found 3 venues, here's why I recommend them")
- Morning Brief generation (narrative summary, not structured extraction)
- These are reasoning + prose tasks where Claude Sonnet/Haiku outperforms GPT-4o-mini

**Tradeoffs accepted:**
- Two LLM provider dependencies (OpenAI + Anthropic) means two API keys and two billing dashboards
- Model routing adds code complexity; mitigate with a `LLMRouter` class that hides the decision logic

---

### 4.3 OCR

### Chosen: GPT-4o Vision (primary) + Tesseract (fallback)

**Decision logic:**

```
Input is image?
      │
   File size > 1MB or PDF?
   ├── Yes → Tesseract (fast, free, good for clean printed text)
   └── No  → GPT-4o vision (handles photos, handwriting, WhatsApp screenshots)
```

### Why GPT-4o Vision over specialist OCR

| Alternative | Why rejected |
|------------|-------------|
| **AWS Textract** | Accurate for clean documents; fails on angled photos of flyers or handwritten notes; adds a third cloud dependency |
| **Google Cloud Vision** | Same story as Textract; excellent for structured forms, poor for real-world noisy images |
| **Azure Computer Vision** | Same family of tradeoffs |
| **Tesseract only** | Free and fast; fails on anything that isn't a clean scan; the primary real-world input (photographed school gate flyer) is exactly what Tesseract gets wrong |

**Key insight:** GPT-4o Vision isn't just doing OCR — it is simultaneously understanding layout context. A flyer with "FRIDAY 3PM" in large font and an address in small font at the bottom is understood _semantically_, not just character-by-character. This is why a specialist OCR tool + LLM extraction is strictly worse for messy real-world images.

**Tradeoffs accepted:**
- GPT-4o Vision is more expensive than Tesseract (~$0.003–0.005 per image call)
- Images must be base64-encoded before sending; large images should be resized to 512px longest side before sending to reduce token count

---

## 5. Data Layer

### 5.1 Primary Database

### Chosen: PostgreSQL (via Supabase)

**What it does here:** Stores `ParentEvent`, `Provider`, and user records. In Phase 2, the same Postgres instance runs the `pgvector` extension to store and query provider embeddings — one database for all persistence.

### Why PostgreSQL over alternatives

| Alternative | Why rejected |
|------------|-------------|
| **MongoDB** | Schema flexibility is less valuable when Pydantic enforces structure at the application layer; no native vector extension — would require a separate vector store |
| **SQLite** | PoC-only; no concurrent writes, no hosted managed option, no pgvector |
| **MySQL / PlanetScale** | No pgvector; PlanetScale's serverless model has connection limitations that conflict with async FastAPI |
| **Firebase Firestore** | Real-time sync is compelling but the query model (no joins, limited filtering) makes the RAG metadata pre-filter pattern awkward |
| **DynamoDB** | Excellent at scale; over-engineered for this use case; no vector support |

**Why Supabase over raw Postgres**

Supabase wraps Postgres with:
- Managed pgvector (`CREATE EXTENSION vector` pre-installed)
- Auth (used as fallback or complement to Clerk)
- Storage bucket for uploaded images and PDFs
- Realtime subscriptions (useful in Phase 3 for live notification delivery)
- Generous free tier (500MB database, 1GB storage)

The alternative (self-hosted Postgres on Railway/Render) saves money but adds backup, extension management, and connection pooling overhead.

**Tradeoffs accepted:**
- Vendor lock-in to Supabase's Postgres dialect; mitigate by keeping all SQL in standard Postgres syntax (no Supabase-specific functions in business logic)
- Supabase free tier has a 2-week inactivity pause; acceptable for a PoC, upgrade for Phase 2

---

### 5.2 Vector Store

### Chosen: pgvector (extension on the same Postgres instance)

**What it does here:** Stores 1536-dimensional embeddings of `Provider.description` and enables cosine similarity search for the RAG discovery feature.

### Why pgvector over dedicated vector databases

| Alternative | Why rejected |
|------------|-------------|
| **Pinecone** | Excellent at scale (10M+ vectors); adds a second infrastructure dependency, second API key, second billing; overkill for < 10,000 provider embeddings |
| **Weaviate** | Powerful but operationally complex; self-hosting requires Docker management; cloud version is expensive |
| **Qdrant** | Strong technical choice; same problem as Pinecone — a second system for a problem that pgvector solves adequately at this scale |
| **Chroma** | Good for local development; no managed cloud offering that matches Supabase's simplicity |
| **Redis (as vector store)** | Redis Stack adds vector search, but Redis is already earmarked as a Celery broker — mixing concerns in one Redis instance is risky |

**The key argument:** At 20–10,000 provider embeddings, pgvector's HNSW index is fast enough for sub-100ms queries. The operational simplicity of one database (one connection string, one backup, one monitoring setup) outweighs any performance difference. Revisit if provider count exceeds 100,000.

**Retrieval engineering pattern:**

```sql
-- Phase 1: pre-filter by city before vector search
SELECT id, name, description,
       embedding <=> $query_embedding AS distance
FROM providers
WHERE city = 'Kingston'                -- metadata filter FIRST
  AND age_range_min <= $child_age
  AND age_range_max >= $child_age
ORDER BY distance
LIMIT 5;
```

This pattern — **metadata filter → vector search** — is the correct retrieval engineering approach. Skipping the metadata filter would return semantically similar venues in the wrong city. This detail is what distinguishes retrieval engineering from `similarity_search()`.

---

### 5.3 Embedding Model

### Chosen: OpenAI `text-embedding-3-small`

| Alternative | Cost per 1M tokens | Dimensions | Why rejected |
|------------|-------------------|-----------|-------------|
| `text-embedding-3-large` | $0.13 | 3072 | 5x more expensive; marginal quality gain for short provider descriptions (< 500 tokens) |
| `text-embedding-ada-002` | $0.10 | 1536 | Older model; 3-small matches quality at $0.02/1M |
| Cohere `embed-v3` | $0.10 | 1024 | Good quality; adds a third LLM provider dependency |
| `all-MiniLM-L6-v2` (HuggingFace) | Free | 384 | Requires local inference; adds GPU/CPU infra; latency too high for real-time search |
| `nomic-embed-text` (local via Ollama) | Free | 768 | Same infra concern as above |

**Tradeoffs accepted:**
- Embeddings must be regenerated if you switch models (dimensions change); store `embedding_model` as a column on `Provider` to enable future migration
- Batch embed on provider creation/update; never embed on every read

---

## 6. Frontend

### 6.1 Framework

### Chosen: Next.js 14 (App Router)

### Why Next.js over alternatives

| Alternative | Why rejected |
|------------|-------------|
| **Vite + React (SPA)** | No SSR/SSG; requires a separate API layer (or a BFF) to avoid CORS issues with FastAPI; slower initial load |
| **Remix** | Excellent routing and data loading model; smaller ecosystem; less Shadcn/UI integration documentation; fewer hiring manager recognitions |
| **SvelteKit** | Faster bundle size; less recognisable for portfolio; fewer component libraries at Shadcn's maturity level |
| **Vue + Nuxt** | Strong option; Python+Vue is an unusual pairing; React skills are more transferable for the AI Tools Engineer job market |

**Why App Router over Pages Router:**
- React Server Components reduce client bundle for static pages (Provider profiles, public calendar pages)
- `use server` actions eliminate boilerplate API route files for simple mutations
- Streaming responses with `Suspense` suit the "AI is thinking" UX for extraction results

**Tradeoffs accepted:**
- App Router caching behaviour is complex; `revalidate` / `no-store` must be set explicitly on fetch calls to the FastAPI backend
- App Router is still maturing; some third-party libraries have partial or broken support

---

### 6.2 UI Components

### Chosen: Shadcn/UI + Tailwind CSS

### Why Shadcn over component libraries

| Alternative | Why rejected |
|------------|-------------|
| **MUI (Material UI)** | Opinionated Google Material styling is hard to override; "looks like a Google app" aesthetic doesn't fit a consumer parenting product |
| **Chakra UI** | Good DX; v3 migration broke ecosystem; less active than Shadcn |
| **Ant Design** | Enterprise-focused aesthetics; large bundle size; Tailwind interop is painful |
| **Mantine** | Solid choice; less portfolio recognition than Shadcn |
| **Raw Tailwind only** | Too slow to build from scratch for a PoC; no accessible keyboard navigation on custom components |

**Why Shadcn's "copy-paste" model matters:**
Traditional component libraries are `node_modules` dependencies — you're locked to their release cycle and their styling decisions. Shadcn components live in your codebase (`/components/ui/`). You own them, you style them, you update them selectively. There is no `npm audit` vulnerability from a transitive Shadcn dependency.

**Tradeoffs accepted:**
- "Copy-paste" means no automatic security patches; you must manually update individual components
- Tailwind's JIT compiler adds ~50ms to dev server cold starts on large projects

---

### 6.3 Calendar UI

### Chosen: FullCalendar (React wrapper)

| Alternative | Why rejected |
|------------|-------------|
| **react-big-calendar** | Smaller feature set; less actively maintained; no drag-and-drop in free tier |
| **@schedule-x/react** | Newer, lighter; missing event editing and external iCal import that Phase 2 needs |
| **Custom Shadcn grid** | Maximum control but 3–5 days to build a usable month/week view; not worth it for Phase 1 |

**Tradeoffs accepted:**
- FullCalendar's React wrapper has had SSR hydration issues in the past; use dynamic import with `ssr: false` in Next.js
- The free (MIT) tier lacks some views; the premium tier ($599/yr) adds timeline view — not needed until Phase 3

---

## 7. Authentication

### Chosen: Clerk (Phase 2+, not in Phase 1 PoC)

### Why Clerk over alternatives

| Alternative | Why rejected |
|------------|-------------|
| **NextAuth / Auth.js** | Flexible but requires building login UI from scratch; session management and JWT refresh is manual work; time cost is 2–3 days vs Clerk's < 1 day |
| **Supabase Auth** | Good option; tightly coupled to the Supabase client SDK; Clerk is provider-agnostic and works regardless of which database we use |
| **Auth0** | Enterprise feature set; generous free tier; more config overhead than Clerk; Clerk has a better Next.js App Router integration |
| **Firebase Auth** | Google-ecosystem lock-in; no native integration with FastAPI backend |
| **DIY JWT** | Never for a user-facing product; session invalidation, refresh token rotation, and secure cookie handling are subtle and error-prone |

**Clerk's role in this system:**
- Issues JWT tokens that FastAPI validates via the Clerk SDK for Python
- `userId` maps to the `parent_id` and `provider_id` foreign keys in Postgres
- Role metadata (`parent` vs `provider`) is stored in Clerk's user metadata, read by both the Next.js middleware and FastAPI

**Tradeoffs accepted:**
- Clerk is a third-party dependency for core auth; if Clerk goes down, login is broken. Mitigation: export user data regularly
- Free tier: 10,000 monthly active users — more than sufficient for Phase 2

---

## 8. MCP Server

### Chosen: TypeScript (`@modelcontextprotocol/sdk`)

**What it does here:** Exposes `get_events` and `get_free_slots` tools to Claude Desktop and Claude Code, allowing parents to query their VillageOS calendar from within their AI assistant.

### Why TypeScript over Python for the MCP server

| Alternative | Why rejected |
|------------|-------------|
| **Python MCP SDK** | Exists and works; TS SDK has more community examples, better type definitions for tool schemas, and aligns with how Anthropic documents MCP server development |
| **FastMCP (Python)** | Promising wrapper library that simplifies the Python SDK; less documentation than the TS SDK; worth reconsidering for Phase 3 if the TS build step is friction |

**Why a separate MCP server rather than embedding MCP in FastAPI:**
MCP servers speak a specific stdio/SSE protocol that is separate from HTTP REST. Mixing MCP transport handling into the FastAPI process creates coupling between two different interface contracts. The MCP server is a thin adapter (< 100 lines) that calls the FastAPI REST endpoints — it doesn't contain business logic.

```
Claude Desktop
      │
      │ MCP stdio/SSE
      ▼
 MCP Server (TypeScript)
      │
      │ HTTP GET /api/v1/events
      ▼
 FastAPI backend
      │
      ▼
 PostgreSQL
```

**Tradeoffs accepted:**
- Adds a TypeScript build step (`tsc`) to the project; use `tsx` in development to skip the compile step
- Two language runtimes (Python + Node) in one repo; manage with separate `requirements.txt` and `package.json`, kept in `backend/` and `mcp-server/` directories

---

## 9. Background Jobs

### Phase 1–2: FastAPI `BackgroundTasks`
### Phase 3: Celery + Redis

**Why this progression:**

`FastAPI BackgroundTasks` runs inside the same process as the web server. It is sufficient for:
- Generating embeddings after a new Provider is created
- Sending a single notification after an event is confirmed

It is **not** sufficient for:
- Email polling (needs to run on a schedule, independent of HTTP requests)
- Daily Morning Brief (needs guaranteed delivery with retries)
- WhatsApp ingestion (long-running, must not block API responses)

### Why Celery over alternatives for Phase 3

| Alternative | Why rejected |
|------------|-------------|
| **Temporal** | Best-in-class workflow orchestration; steep learning curve; significant operational overhead (Temporal server + workers); overkill for this scale |
| **RQ (Redis Queue)** | Simpler than Celery; less mature ecosystem; fewer examples for scheduled tasks (Celery Beat) |
| **Inngest** | Cloud-based workflow platform; good DX; adds a third-party dependency for a core application concern |
| **APScheduler** | In-process scheduler; same limitation as BackgroundTasks — dies when the FastAPI process restarts |

**Celery configuration:**
- Broker: Redis (also used for caching)
- Result backend: PostgreSQL (results stored alongside application data)
- Celery Beat for scheduled tasks: email polling every 5 minutes, Morning Brief at 7am daily

**Tradeoffs accepted:**
- Redis added as a required infrastructure component in Phase 3; use Upstash Redis (serverless, free tier) to avoid self-hosting
- Celery workers must be deployed as a separate process from the FastAPI server; adds a second Railway/Render service

---

## 10. Observability

### Chosen: Langfuse (LLM) + Sentry (errors)

**Langfuse** is an open-source LLM observability platform. It captures:
- Every LLM call: model, prompt, tokens in/out, latency, cost
- Trace IDs linking an HTTP request → extraction → LLM call chain
- Evaluation scores (used to track extraction accuracy over the golden dataset)

**Why this matters for the portfolio:** Langfuse's cost-per-event and accuracy dashboards are exactly the artefacts a hiring manager wants to see when evaluating prompt engineering claims. "I reduced cost-per-extraction from $0.009 to $0.004 by adding a preprocessing step" is only credible if you have the data.

**Sentry** catches and groups Python exceptions from FastAPI and JavaScript errors from Next.js. Both have official SDKs.

| Alternative | Why rejected |
|------------|-------------|
| **Helicone** | Proxy-based LLM observability; adds a network hop to every LLM call; Langfuse's SDK approach is lower-latency |
| **LangSmith** | LangChain's observability product; we're not using LangChain |
| **Datadog / New Relic** | Full APM suites; $50–200/month; overkill for this scale |
| **Custom logging only** | Token cost tracking requires parsing OpenAI response headers; reinventing Langfuse is not valuable engineering time |

---

## 11. Infrastructure & Deployment

### PoC (Phase 1)
| Component | Where |
|-----------|-------|
| FastAPI | `uvicorn main:app --reload` locally |
| Next.js | `next dev` locally |
| Storage | In-memory Python dict |
| LLM | OpenAI API (remote) |

### Phase 2
| Component | Where | Why |
|-----------|-------|-----|
| FastAPI | **Railway** | Python containers, one `railway.json`, free $5/month credit, simpler than ECS |
| Next.js | **Vercel** | Next.js native deployment; edge functions; preview deploys per PR branch |
| PostgreSQL + pgvector | **Supabase** | Managed, pgvector pre-installed, free tier generous |
| Redis | **Upstash** | Serverless Redis, pay-per-request, no server to manage |
| Images / PDFs | **Supabase Storage** | Already in the stack; S3-compatible API |

### Why not AWS end-to-end
At Phase 2 scale (< 500 users), the operational overhead of ECS, RDS, ElastiCache, S3, and CloudFront — each requiring IAM roles, VPCs, and separate billing — is pure distraction. Railway + Vercel + Supabase covers the same surface area with one-tenth the configuration. Migrate to AWS when the business case demands it (> 10,000 users, SLA requirements, enterprise compliance).

### Phase 3 additions
| Component | Where |
|-----------|-------|
| Celery workers | Railway (separate service, same repo) |
| MCP server | Railway (separate Node.js service) |
| Email ingestion service | Railway (separate Python service) |

---

## 12. Repository Structure

```
villageos/
├── backend/                    # Python FastAPI
│   ├── main.py
│   ├── schemas.py              # Pydantic models (ParentEvent, Provider, etc.)
│   ├── routers/
│   │   ├── extract.py          # POST /api/v1/extract
│   │   ├── events.py           # CRUD for ParentEvent
│   │   └── providers.py        # Provider CRUD + RAG search
│   ├── services/
│   │   ├── extraction.py       # instructor + LLM routing logic
│   │   ├── embeddings.py       # text-embedding-3-small calls
│   │   └── rag.py              # pgvector query + LLM synthesis
│   ├── workers/                # Celery tasks (Phase 3)
│   └── requirements.txt
│
├── frontend/                   # Next.js 14
│   ├── app/
│   │   ├── page.tsx            # PoC: textarea + event preview card
│   │   ├── calendar/           # Phase 2: FullCalendar view
│   │   └── providers/          # Phase 2: Provider profiles + search
│   ├── components/
│   │   └── ui/                 # Shadcn components (copy-paste)
│   └── package.json
│
├── mcp-server/                 # TypeScript MCP server
│   ├── index.ts
│   ├── tools/
│   │   ├── getEvents.ts
│   │   └── getFreeSlots.ts
│   └── package.json
│
├── tests/
│   └── golden_dataset/         # 10 raw input files + expected JSON outputs
│
├── PRD.md
└── SYSTEM_DESIGN.md
```

---

## 13. Decision Log

Decisions that are settled and why they are not up for re-evaluation.

| Decision | Chosen | Rejected | Reason it's settled |
|----------|--------|---------|---------------------|
| Backend language | Python | Node/Go | AI ecosystem dependency |
| Schema enforcement | Pydantic + instructor | Raw JSON parsing | Non-negotiable correctness guarantee |
| Vector store | pgvector | Pinecone / Weaviate | Scale doesn't justify second infra component |
| PoC auth | None (stateless) | Clerk | Phase 1 goal is proving extraction, not auth |
| Component library | Shadcn/UI | MUI / Chakra | Ownership model + Tailwind flexibility |

---

## 14. Open Decisions

Decisions still requiring investigation before Phase 2 begins.

| # | Decision | Option A | Option B | Deciding factor |
|---|----------|----------|----------|----------------|
| 1 | Primary extraction LLM | GPT-4o-mini | Groq Llama-3.1-70b | Run 10 golden dataset tests on both; compare accuracy + cost |
| 2 | RAG synthesis LLM | Claude Haiku | GPT-4o-mini | Qualitative review of 10 provider search responses |
| 3 | Celery broker | Redis (Upstash) | PostgreSQL (pg-boss) | Avoid Redis if pg-boss covers the scheduling need in Phase 3 |
| 4 | WhatsApp ingestion | Screenshot OCR | Business API webhook | Business API requires account approval; OCR is faster to ship |
| 5 | Preparation Timeline | Rule-based (`event_type → N days`) | LLM-generated per event | Start rule-based; add LLM if parent feedback says rules are too rigid |
| 6 | MCP server language | TypeScript SDK | Python FastMCP | Build PoC in TS; switch to FastMCP in Phase 3 if TS build is friction |
