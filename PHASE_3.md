# VillageOS — Phase 3 Design: Calendar View + MCP Server

**Version:** 0.1  
**Date:** 2026-05-01  
**Author:** Adam Mrotek  
**Status:** In Progress  
**Prerequisite:** Phase 1 (extraction), Phase 2 (provider RAG search)

---

## Goal

Two deliverables:

1. **Calendar view** — a `/calendar` page with a full month grid and a 7-day upcoming timeline showing titles and action items, fed by the backend events endpoint.
2. **MCP server** — a TypeScript stdio server that exposes `get_events` and `get_upcoming` tools so Claude Desktop / Claude Code can read the VillageOS calendar on request.

---

## 1. What We're Building

### 1.1 Calendar Page (`/calendar`)

```
┌─────────────────────────────────────────────────────────────┐
│  < May 2026 >                                               │
│                                                             │
│  Mo  Tu  We  Th  Fr  Sa  Su                                 │
│               1   2   3                                     │
│   4   5   6   7   8   9  10                                  │
│  11  12  13  14  15  16  17  ●● (event dots)                │
│  18  19  20  21  22  23  24                                  │
│  25  26  27  28  29  30  31                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Next 7 Days                                                │
│  ─────────────────────────────                              │
│  Fri 1 May                                                  │
│    🔴 Fundraiser deadline — Bring £2 in an envelope          │
│  Sat 2 May  (nothing)                                       │
│  Thu 7 May                                                  │
│    🟢 Football Practice — No action items                    │
└─────────────────────────────────────────────────────────────┘
```

**Month grid rules:**
- Today highlighted with a ring
- Each day with events shows colour-coded dots (one per event, capped at 3 + overflow count)
- Clicking a day filters the timeline to that day (optional enhancement)

**Event type → colour mapping:**

| Type | Colour |
|------|--------|
| school | blue |
| sport | green |
| birthday | pink |
| fundraiser | orange |
| meeting | yellow |
| deadline | red |
| other | grey |

### 1.2 Backend — Events Endpoint

New router at `GET /api/v1/events` returns `list[StoredEvent]`.

`StoredEvent` = `ParentEvent` + `id: str`.

For Phase 3 PoC the store is an in-memory list of seeded fake events (≥ 12 events across the current month). No persistence — a backend restart resets to seed data. Persistence via PostgreSQL comes in Phase 4.

Optional query params: `?from_date=ISO8601&to_date=ISO8601` for date range filtering.

### 1.3 MCP Server (`mcp-server/`)

TypeScript stdio server using `@modelcontextprotocol/sdk`.

**Tools exposed:**

| Tool | Params | Returns |
|------|--------|---------|
| `get_events` | `from_date?: string`, `to_date?: string` | JSON array of `StoredEvent` |
| `get_upcoming` | `days?: number` (default 7) | Events in the next N days |

The MCP server is a thin HTTP client over the FastAPI backend — it contains no business logic.

```
Claude Desktop / Claude Code
        │
        │ MCP stdio
        ▼
mcp-server/index.ts
        │
        │ HTTP GET /api/v1/events
        ▼
FastAPI backend (localhost:8000)
        │
        ▼
In-memory seed data (Phase 3 PoC)
```

---

## 2. File Changes

```
VillageOS/
├── backend/
│   ├── schemas.py              + StoredEvent model
│   ├── routers/events.py       NEW — GET /api/v1/events
│   └── main.py                 + include events router
│
├── frontend/
│   ├── app/
│   │   └── calendar/
│   │       └── page.tsx        NEW — calendar page (client component)
│   ├── components/
│   │   ├── MonthCalendar.tsx   NEW — month grid
│   │   └── WeekTimeline.tsx    NEW — 7-day upcoming panel
│   ├── lib/
│   │   ├── types.ts            + StoredEvent
│   │   └── api.ts              + getEvents()
│   └── app/layout.tsx          + Calendar nav link
│
├── mcp-server/
│   ├── package.json            NEW
│   ├── tsconfig.json           NEW
│   └── index.ts                NEW — MCP server entry
│
└── PHASE_3.md                  (this document)
```

---

## 3. Seed Event Dataset

12 fake events for May 2026, covering all event types and including action items:

| # | Title | Type | Date | Action Items |
|---|-------|------|------|--------------|
| 1 | Sports Day | sport | 15 May | Pack lunch, bring sunscreen, wear house colours |
| 2 | Bake Sale | fundraiser | 9 May | Bake 12 cookies, label with allergens |
| 3 | Emma's Birthday Party | birthday | 20 May | Buy a gift (≤£15), RSVP by 14 May |
| 4 | Parent-Teacher Evening | meeting | 22 May | Book a slot online, prepare questions |
| 5 | School Trip Deposit Due | deadline | 7 May | Pay £25 via ParentPay |
| 6 | Football Practice | sport | 7, 14, 21, 28 May | Shin pads, water bottle |
| 7 | Year 3 Assembly | school | 13 May | Arrive by 8:45am |
| 8 | Book Fair | school | 12–14 May | Bring £5 spending money |
| 9 | Swimming Lesson | sport | 8, 15, 22 May | Towel, goggles, cap |
| 10 | RSVP Deadline — Summer Fete | deadline | 5 May | Email coordinator |
| 11 | School Fundraiser Walk | fundraiser | 28 May | Return sponsor form, wear trainers |
| 12 | Half-Term starts | school | 30 May (all-day) | No action items |

---

## 4. MCP Server Usage

Once running, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "villageos": {
      "command": "node",
      "args": ["/path/to/VillageOS/mcp-server/dist/index.js"]
    }
  }
}
```

Or for development (no build step required):

```json
{
  "mcpServers": {
    "villageos": {
      "command": "npx",
      "args": ["tsx", "/path/to/VillageOS/mcp-server/index.ts"]
    }
  }
}
```

Then in Claude Desktop: *"What events do I have this week?"* → Claude calls `get_upcoming` → returns structured events → Claude synthesises a natural language answer.

---

## 5. Decisions

| Decision | Chosen | Why |
|----------|--------|-----|
| Calendar library | Custom Tailwind grid | FullCalendar is Phase 4; a simple grid is 50 lines and has zero dependencies |
| Event storage | In-memory seed | PostgreSQL persistence is Phase 4; PoC goal is to prove the calendar flow |
| **MCP server** | **Removed from scope** | See section 7 |

---

## 6. Open Questions for Phase 4

1. Replace in-memory store with Supabase PostgreSQL + persist confirmed events from the extraction flow.
2. Add `POST /api/v1/events` so the extract-and-confirm flow saves events to the store.
3. Add drag-and-drop event editing on the calendar (requires FullCalendar or a comparable lib).

---

## 7. MCP Server — Removed from Scope

**Decision (Phase 3 discovery):** The MCP server deliverable has been cut. Do not carry it into Phase 4.

### Reason 1 — Indirect prompt injection

VillageOS aggregates data from untrusted external sources: school emails, newsletters, third-party calendars, and events entered by multiple parties. Any of these can be weaponised.

Attack vector:
```
Malicious actor crafts a calendar event with embedded instructions
    → content enters VillageOS via extraction, shared calendar, or imported newsletter
    → parent asks their Claude instance "what do I have this week?"
    → MCP server returns poisoned event data as tool output
    → Claude executes the embedded instructions on the parent's behalf
```

The attacker never needs access to the parent's AI — they only need to influence what ends up in the data source. Because VillageOS is specifically designed to ingest content from sources outside the user's control, the attack surface is structural and cannot be patched away.

### Reason 2 — Auth cannot be guaranteed

The product serves multiple parties feeding and consuming calendar data. MCP server auth (OAuth, Bearer tokens, SSE) cannot be guaranteed to work correctly across all user configurations and all parties involved. The risk of misconfiguration exposing family data — including children's schedules and school locations — is unacceptable.

### Architectural principle

> **MCP tools are safe only when the connected data source is fully trusted, write-controlled, and internal.** VillageOS fails both conditions by design.

MCP remains a valid integration pattern for internal tooling on private, controlled data sources. It is not appropriate for a consumer product that aggregates from external, partially-untrusted inputs.

### Reason 3 — Focus and MVP loop

Beyond security, the MCP server was deprioritised to keep Phase 3 focused on closing the core product loop:

```
Parent pastes school communication
    → AI extracts structured event + action items
    → Event persisted to calendar
    → Parent sees it in the UI
```

Persistence (step 3) is the highest-value deliverable. Shipping it completes a working MVP that can be demonstrated to real users. The MCP server would have added infrastructure complexity without advancing the core loop or reaching new users.
