# VillageOS — Product Requirements Document

**Version:** 0.1  
**Date:** 2026-04-29  
**Author:** Adam Mrotek  
**Status:** Draft

---

## 1. Problem Statement

Parents managing children's schedules across schools, clubs, and local community activities suffer from **information fragmentation and cognitive overload**. Critical dates, deadlines, and action items are buried in:

- Multi-page PDF newsletters
- Chaotic WhatsApp group threads
- Flyer images photographed at the school gate
- Disorganised email chains

The core failure is not missing information — it is the manual labour of **extracting structure from noise**. No existing tool solves this end-to-end.

---

## 2. Product Vision

VillageOS turns unstructured parent communications into a unified, proactive family operating system. The key differentiator is the **AI Extraction Layer**: any piece of text or image goes in, a clean, actionable calendar event comes out — without the parent doing any manual data entry.

---

## 3. User Personas

### 3.1 The Parent
- Has 1–3 school-age children
- Receives 20–40 messages/week across WhatsApp, email, and paper notes
- Pain: misses deadlines and events because reading everything is impractical
- Goal: one place to see "what do I need to do this week for my kids"

### 3.2 The Provider
- Schools, clubs, sports teams, local businesses (e.g. birthday venues)
- Currently broadcasts via PDF newsletters, WhatsApp blasts, or nothing at all
- Pain: low read rates; no confirmation parents actually saw the update
- Goal: publish once, reach all parents subscribed to their group

### 3.3 The AI Engineer (Internal / Power User)
- Adam building this as a Full Stack AI Tools Engineer project
- Goal:  MCP integration

---

## 4. Core User Stories

### Extraction Engine
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| U1 | Parent | Paste a WhatsApp thread into a text box | Events are automatically extracted with dates, times, and action items |
| U2 | Parent | Upload a photo of a school flyer | OCR + AI turns it into a calendar card without any typing |
| U3 | Parent | Forward an email to a VillageOS address | The email body is processed and events appear in my calendar |
| U4 | Parent | Review and edit AI-extracted events before saving | I can correct hallucinations before they pollute my calendar |

### Calendar & Preparation
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| C1 | Parent | See all events on a unified calendar view | I have one source of truth across all my children and groups |
| C2 | Parent | Receive a "Preparation Timeline" for upcoming events | If the birthday is Saturday, I'm reminded to buy a gift on Thursday |
| C3 | Parent | Export events to Google Calendar / iCal | AI-extracted dates live where I already look |

### Provider Hub
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| P1 | Provider | Write an update in Markdown | It is broadcast automatically to all subscribed parent groups |
| P2 | Provider | See a public profile page for my organisation | Parents can find and subscribe to my updates |

### Discovery (RAG)
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| D1 | Parent | Ask "I need a birthday spot for a 4-year-old that isn't too loud" | I get AI-synthesised recommendations, not just keyword search results |
| D2 | Parent | Ask "When is the deadline for the bake sale?" | RAG queries my own stored events and provider documents |

### MCP Integration
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| M1 | Power User | Ask Claude Desktop "Am I free next Tuesday morning?" | Claude reads my VillageOS calendar via MCP and answers in context |

---

## 5. Data Schemas (Pydantic)

These are the canonical data shapes that the LLM extraction pipeline must produce. All AI output is validated against these before being stored or displayed.

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class EventType(str, Enum):
    school = "school"
    sport = "sport"
    birthday = "birthday"
    fundraiser = "fundraiser"
    meeting = "meeting"
    deadline = "deadline"
    other = "other"


class ActionItem(BaseModel):
    description: str                        # "Bring a labeled lunch box"
    due_by: Optional[datetime] = None       # Must be done before this time
    cost_estimate_gbp: Optional[float] = None


class ParentEvent(BaseModel):
    title: str = Field(..., description="Short human-readable title")
    event_type: EventType
    start_time: datetime
    end_time: Optional[datetime] = None
    is_all_day: bool = False
    location: Optional[str] = None
    description: Optional[str] = None
    action_items: list[ActionItem] = []
    tags: list[str] = []
    source_text: str = Field(..., description="Raw input that produced this event")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence 0–1")
    provider_id: Optional[str] = None       # FK to Provider if known


class Provider(BaseModel):
    id: str
    name: str
    category: str                           # "school" | "sports_club" | "venue" | etc.
    location: str                           # Free text, e.g. "Kingston, Surrey"
    description: str                        # Used for vector embedding + RAG
    contact_email: Optional[str] = None
    website: Optional[str] = None
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    tags: list[str] = []


class ExtractionResult(BaseModel):
    events: list[ParentEvent]
    raw_input: str
    model_used: str
    tokens_used: int
    extraction_timestamp: datetime
```

---

## 6. API Endpoints (Phase 1 PoC)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/extract` | Submit raw text/base64 image; returns `ExtractionResult` |
| `GET` | `/api/v1/events` | List all stored events (supports `?from=&to=` filter) |
| `POST` | `/api/v1/events` | Save a confirmed `ParentEvent` |
| `PATCH` | `/api/v1/events/{id}` | Edit an AI-extracted event |
| `DELETE` | `/api/v1/events/{id}` | Remove an event |
| `GET` | `/api/v1/providers` | List providers |
| `POST` | `/api/v1/providers/search` | RAG-powered natural language provider search |
| `GET` | `/api/v1/export/ical` | Export all events as `.ics` |

---

## 7. AI Architecture

### 7.1 Extraction Pipeline

```
Raw Input (text | image)
        │
        ▼
  [OCR if image]  ←── Tesseract or GPT-4o vision
        │
        ▼
  [LLM + Instructor]  ←── Forces output to match ParentEvent schema
        │
        ▼
  ExtractionResult  ←── Validated Pydantic model, confidence score attached
        │
        ▼
  Preview Card (UI) ←── Parent edits if needed, then confirms save
```

**Key constraint:** Use `instructor` library to guarantee schema-valid JSON output. Never parse raw LLM string responses.

**Token optimisation strategy:**
- Strip boilerplate from source text before sending (email signatures, headers)
- Use `gpt-4o-mini` or `groq/llama-3` for extraction; escalate to `gpt-4o` only when confidence < 0.7
- Log `tokens_used` per extraction to track cost per event

### 7.2 RAG Provider Search

```
Provider.description + tags + reviews
        │
        ▼
  text-embedding-3-small (OpenAI)
        │
        ▼
  pgvector (Supabase or local Docker)
        │
  Parent query: "birthday for 4-year-old, not too loud"
        │
        ▼
  Metadata filter: city = "Kingston"  ←── Pre-filter before vector search
        │
        ▼
  Top-K=5 vector similarity search
        │
        ▼
  LLM synthesis: "Here are 3 spots I recommend because..."
```

**Why metadata filter before vector search:** Avoids returning semantically similar but geographically irrelevant results. Demonstrates real retrieval engineering, not just `similarity_search()`.

### 7.3 MCP Server

Exposes two tools to Claude Desktop / Claude Code:

| Tool | Input | Output |
|------|-------|--------|
| `get_events` | `from_date`, `to_date` | List of `ParentEvent` |
| `get_free_slots` | `date`, `duration_minutes` | List of available time windows |

Built with `@modelcontextprotocol/sdk` (TypeScript) or `mcp` Python SDK, wrapping the existing FastAPI endpoints.

---

## 8. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | Python 3.12 + FastAPI | AI ecosystem is Python-native |
| AI Extraction | `instructor` + OpenAI / Groq | Guaranteed schema-valid output |
| OCR | GPT-4o vision or Tesseract | Image → text before LLM extraction |
| Data Validation | Pydantic v2 | Single source of truth for schemas |
| Vector DB | pgvector (Supabase) | Avoids a second infra dependency |
| Frontend | Next.js 14 + Shadcn/UI + Tailwind | Fast to build, looks polished immediately |
| Auth | Clerk | Fastest path to Parent/Provider accounts |
| Calendar UI | FullCalendar or custom Shadcn | Display extracted events |
| MCP Server | TypeScript MCP SDK | Matches Claude ecosystem conventions |
| Storage (PoC) | In-memory / JSON file | No Postgres until Phase 2 |
| Storage (Prod) | PostgreSQL + pgvector | Events + embeddings in one DB |

---

## 9. Phase Roadmap

### Phase 1 — Vertical Slice PoC (Target: 7 days)

**Goal:** Prove `Unstructured Text In → Structured JSON → UI Card Out`

- [ ] FastAPI server with `/api/v1/extract` endpoint
- [ ] `ParentEvent` Pydantic schema finalised
- [ ] `instructor` + OpenAI integration returning validated JSON
- [ ] Next.js single page: textarea left, Event Preview Card right
- [ ] 10 golden-dataset test cases passing (WhatsApp threads, newsletters, flyers)
- [ ] Token usage logged per extraction
- [ ] Basic MCP server exposing `get_events`

**Done when:** All 10 golden-dataset inputs produce correct JSON with no manual intervention.

---

### Phase 2 — Full Stack Integration (Target: 3 weeks post-PoC)

**Goal:** A usable product for a real parent

- [ ] PostgreSQL + pgvector (Supabase)
- [ ] Parent + Provider auth (Clerk)
- [ ] Calendar view (FullCalendar)
- [ ] Event edit + confirm flow (fix AI hallucinations before save)
- [ ] Provider profile pages
- [ ] 20 seeded Kingston providers with embeddings
- [ ] Natural language provider search UI
- [ ] Google Calendar / iCal export

---

### Phase 3 — Proactive AI & Scaling (Target: 6 weeks post-PoC)

**Goal:** AI Tools Engineer portfolio is complete

- [ ] Email ingestion (IMAP polling → auto-extract)
- [ ] WhatsApp webhook ingestion
- [ ] Preparation Timeline: automated reminder logic
- [ ] Daily "Morning Brief" notifications (Celery/Temporal worker)
- [ ] RAG over provider PDFs and school handbooks
- [ ] MCP server deployed and documented
- [ ] Prompt engineering write-up for resume (top-K tuning, metadata filtering, cost-per-event metric)

---

## 10. Golden Dataset (PoC Validation)

Before writing code, collect 10 messy real-world inputs. Extraction is considered working when all 10 produce correct `ParentEvent` objects with `confidence >= 0.8`.

| # | Input Type | Example Content |
|---|-----------|----------------|
| 1 | WhatsApp thread | Bake sale argument thread, date buried mid-conversation |
| 2 | WhatsApp thread | Sports day time change, multiple conflicting messages |
| 3 | PDF newsletter | 3-page school newsletter with 5+ events |
| 4 | Email | Formal event invitation with RSVP deadline |
| 5 | Email | Informal parent email chain about a party |
| 6 | Flyer image | Photographed A4 flyer with date and location |
| 7 | Screenshot | WhatsApp screenshot (text via GPT-4o vision) |
| 8 | WhatsApp thread | Fundraiser with action item ("bring £2 in an envelope") |
| 9 | Email | School trip with permission slip deadline |
| 10 | WhatsApp thread | Birthday party invite with ambiguous relative date ("next Saturday") |

---

## 11. Out of Scope (v1)

- Native mobile apps
- Direct WhatsApp Business API integration (webhook only for now)
- Payment processing for providers
- Moderation / content policy for provider posts
- Multi-language support
- Offline mode

---

## 12. Success Metrics

| Metric | PoC Target | Phase 2 Target |
|--------|-----------|----------------|
| Extraction accuracy | 10/10 golden dataset | > 90% on user-submitted inputs |
| Cost per extraction | < $0.01 | < $0.005 (with model routing) |
| Time to event card | < 3s | < 2s |
| Provider search relevance | N/A | > 80% user satisfaction (manual review) |
| MCP tool call success rate | 100% (local) | 100% (deployed) |

---

## 13. Open Questions

1. **Primary LLM:** OpenAI GPT-4o-mini vs Groq Llama-3 for extraction? (Cost vs latency tradeoff)
2. **Vector DB:** Self-hosted pgvector in Docker vs Supabase managed? (PoC: local Docker; prod: Supabase)
3. **Auth timing:** Add Clerk in Phase 1 PoC or keep stateless until Phase 2?
4. **WhatsApp ingestion:** Webhook (requires approved Business account) or screenshot OCR path for PoC?
5. **Preparation Timeline logic:** Rule-based ("N days before event type X") or LLM-generated per event?
