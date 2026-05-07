# VillageOS — MVP Design Document

**Version:** 1.0  
**Date:** 2026-05-06  
**Author:** Adam Mrotek  
**Status:** Draft  
**Scope:** Login → Event Extraction → Timeline

---

## 1. Problem This MVP Solves

The PoC proved the extraction loop works. The missing piece is a real user journey: a parent needs to log in, extract an event from messy text, confirm it, and immediately see it on their timeline. Today those three steps are disconnected — there is no auth, no save mechanism, and the calendar only shows hardcoded seed data.

---

## 2. User Journey

```
Visit /create_event or /calendar (no session)
    │
    ▼ middleware intercepts
Redirect → /login
    │
Clerk sign-in form
    │ credentials / OAuth
    ▼
Session cookie set → redirect /create_event
    │
Paste WhatsApp / email / newsletter text
    │
"Extract Event →" button
    │
    ▼ POST /api/v1/extract
AI extraction → EventCard preview
    │
Parent reviews title, dates, action items
    │
"Confirm & Save →" button
    │
    ▼ POST /api/v1/events
StoredEvent persisted → "View in timeline →" link
    │
Navigate /calendar
    │
    ▼ GET /api/v1/events
MonthCalendar + WeekTimeline show the new event
```

---

## 3. Pages

### 3.1 Login — `/login`

**Status:** New page.

**Layout:** Single-column centred. Page background `bg-village-bg` (`#F4F1EA`). The Clerk `<SignIn>` component sits inside a `.card-default` panel.

```
┌──────────────────────────────────────┐
│  VillageOS logo (header, no nav)     │
├──────────────────────────────────────┤
│                                      │
│         VillageOS   (.text-heading)  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  [Clerk <SignIn> component]  │    │  ← .card-default, p-8, max-w-sm
│  │  — email / password          │    │
│  │  — Google / social OAuth     │    │
│  │  — Clerk manages all states  │    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

**States:**

| State | Behaviour |
|---|---|
| Default | Clerk sign-in form |
| Submitting | Clerk renders internal loading spinner |
| Auth error | Clerk renders inline error (wrong password, etc.) |
| Success | `afterSignInUrl` → redirect `/create_event` |
| Already authenticated | `middleware.ts` redirects `/login` → `/create_event` |

**Clerk appearance override** (passed as `appearance` prop to `<SignIn>`):

```typescript
variables: {
  colorBackground:      '#FFFFFF',  // T.surface
  colorInputBackground: '#F4F1EA',  // T.bg
  colorText:            '#16221A',  // T.ink
  colorTextSecondary:   '#4A5346',  // T.inkSoft
  colorPrimary:         '#5C7A4A',  // T.accent
  colorDanger:          '#EF4444',  // red-500
  borderRadius:         '4px',      // Meadow base radius
  fontFamily:           'inherit',  // picks up General Sans from body
}
```

**Navigation:** `layout.tsx` wraps `<nav>` in Clerk's `<SignedIn>`. Login page shows logo only — no nav links.

**New files:** `frontend/app/login/page.tsx`, `frontend/middleware.ts`  
**Modified:** `frontend/app/layout.tsx`

---

### 3.2 Event Extraction — `/create_event`

**Status:** Exists. Needs Confirm & Save flow.

**Current layout:** Two columns — `ExtractForm` (left) + `EventCard` preview (right). No save mechanism.

**Target layout (same columns, new elements in right column):**

```
┌────────────────────────────────────────────────────────────┐
│  PASTE YOUR TEXT              EVENT PREVIEW                 │
│  ───────────────              ────────────                  │
│  [ExtractForm]                [EventCard — existing]        │
│                                                             │
│  [Extract Event →]            ────────────────────────────  │
│   (loading spinner)           [Confirm & Save →]  (new)    │
│                               [Save error banner] (new)    │
│                               [Saved ✓ + timeline link]    │
└────────────────────────────────────────────────────────────┘
```

**EventCard — new optional props:**

```typescript
onSave?:       () => Promise<void>
isSaving?:     boolean
saveError?:    string | null
savedEventId?: string | null
```

`onSave` is optional — the card is a dumb presenter. When `onSave` is undefined, no save UI renders (backwards-compatible with future read-only uses).

**Confirm & Save button states:**

| State | Button text | Style |
|---|---|---|
| Extracted, not saved | "Confirm & Save →" | `bg-village-accent text-white` full-width |
| Saving | "Saving…" + Loader2 spin | disabled, same bg |
| Saved | "Saved to timeline ✓" + CheckCircle2 | disabled, `.card-accent` colours |
| Error | "Retry save" | destructive outline |

Button placement: below existing `<Separator />` and confidence dots, at the card bottom. Full-width (`w-full`). Padding `10px 16px` (Meadow primary button spec).

After a successful save, the following appears below the button:
```
"View in timeline →"   (.text-meta underline text-village-accent-dark, Link to /calendar)
```

**Error state:** Red banner above the button:
```html
<div class="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
  {saveError}
</div>
```
Identical pattern to the existing extract error in `ExtractForm`.

**Page state management** (`create_event/page.tsx`):

```typescript
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);
const [savedEventId, setSavedEventId] = useState<string | null>(null);

// Reset save state when a new extraction starts:
const handleExtract = async (text: string) => {
  setSaveError(null);
  setSavedEventId(null);
  // ... existing extract logic
};

const handleSave = async () => {
  if (!extractedEvent) return;
  setIsSaving(true);
  setSaveError(null);
  try {
    const token = await getToken();
    const stored = await saveEvent(extractedEvent, token!);
    setSavedEventId(stored.id);
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : 'Failed to save event');
  } finally {
    setIsSaving(false);
  }
};
```

**Lucide icons used:** `Loader2` (spin), `CheckCircle2` (saved), `AlertCircle` (error)

**Modified files:** `frontend/components/EventCard.tsx`, `frontend/app/create_event/page.tsx`, `frontend/lib/api.ts`

---

### 3.3 Timeline — `/calendar`

**Status:** Exists. Needs real persisted events + minor Meadow polish.

**Layout unchanged:** `MonthCalendar` (left, fixed 384px) + `WeekTimeline` (right, flex-1). No structural change to either component.

**Changes:**

**Page heading:**
- Before: `<h1>Calendar</h1>` (raw Tailwind)
- After: `<h1 className="text-title">Timeline</h1>` (Newsreader 30px) + `<p className="text-secondary">Your family schedule at a glance.</p>`

**"+ Extract event" CTA button** — inline with heading:

```typescript
<div className="flex items-center justify-between mb-6">
  <h1 className="text-title">Timeline</h1>
  <Link href="/create_event">
    <Button size="sm" className="bg-village-accent text-white hover:bg-village-accent-dark">
      + Extract event
    </Button>
  </Link>
</div>
```

**Card panel classes:** Swap raw `bg-white rounded-xl border` wrappers on MonthCalendar and WeekTimeline panels to `.card-default`.

**Empty state** (when `events.length === 0` after loading):

```
┌──────────────────────────────────────┐  ← .card-secondary
│                                      │
│  [CalendarDays icon, 40px, inkMute]  │
│                                      │
│  Nothing here yet.    (.text-title)  │
│  Paste a message to extract your     │
│  first event.         (.text-body)   │
│                                      │
│  [Extract an event →]  (accent btn)  │
└──────────────────────────────────────┘
```

**Auth token:** Page calls `const { getToken } = useAuth()`, resolves token before calling `getEvents()`.

**States:**

| State | Behaviour |
|---|---|
| Loading | Existing centred spinner |
| Error | Existing red error banner |
| No events | New empty state with CTA (above) |
| Events present | MonthCalendar dots + WeekTimeline chips (existing) |
| Day selected | WeekTimeline anchors to selected day (existing) |

**Modified files:** `frontend/app/calendar/page.tsx`, `frontend/lib/api.ts`

---

## 4. Backend Changes

### 4.1 `POST /api/v1/events` — New endpoint

File: `backend/routers/events.py`

**In-memory store** (module-level, resets on restart — intentional for PoC):

```python
_USER_EVENTS: dict[str, StoredEvent] = {}
```

The `usr-` prefix on IDs (`f"usr-{uuid.uuid4()}"`) distinguishes user events from seed IDs (`evt-001` through `evt-015`) in logs and debug output.

**Endpoint:**

```
POST /api/v1/events
Authorization: Bearer <clerk_jwt>   (via require_clerk_auth dependency)
Body: ParentEvent
Returns: StoredEvent  →  201 Created

Errors:
  401 — missing or invalid JWT
  422 — Pydantic validation failure
```

**Updated `GET /api/v1/events`:** merges both stores before applying date filter and sort:

```python
all_events = SEED_EVENTS + list(_USER_EVENTS.values())
# then existing from_date / to_date filter + sort by start_time
```

Seeds remain visible alongside user events — no flag needed for MVP. Upgrade path: when Postgres is added, swap `_USER_EVENTS` for a SQLAlchemy query.

---

### 4.2 `backend/auth.py` — New file

FastAPI dependency for Clerk JWT verification:

```python
async def require_clerk_auth(
    authorization: str = Header(None)
) -> str:
    """
    Reads Authorization: Bearer <jwt>.
    Fetches Clerk JWKS (cached 1 hour in memory).
    Decodes RS256 JWT via python-jose.
    Returns user_id (sub claim) on success.
    Raises HTTP 401 on failure.
    """
```

**JWKS caching:** Module-level dict `{"jwks": ..., "fetched_at": datetime}`. On each call, if `fetched_at` is more than 1 hour ago, refetch. This avoids a round-trip on every request in normal operation.

**JWKS URL:** Derived from `CLERK_PUBLISHABLE_KEY` — the key encodes the instance domain (e.g. `https://<instance>.clerk.accounts.dev/.well-known/jwks.json`).

**Required package:** `python-jose[cryptography]` — add to `backend/requirements.txt`.

---

### 4.3 `backend/main.py`

Add `"Authorization"` to CORS `allow_headers`:

```python
allow_headers=["Content-Type", "Authorization"]
```

---

## 5. Frontend Auth Wiring

### 5.1 `frontend/middleware.ts` — New file

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/login(.*)", "/meadow(.*)", "/design(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
```

**Protected routes:** `/create_event`, `/calendar`, `/search`  
**Public routes:** `/`, `/login`, `/meadow`, `/design`

### 5.2 `frontend/app/layout.tsx` — Modified

```typescript
import { ClerkProvider, SignedIn } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>
          <header>
            <Link href="/">VillageOS</Link>
            <SignedIn>
              <nav>
                {/* existing nav links */}
              </nav>
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 5.3 Environment Variables

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/create_event
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/create_event
```

**Backend (`.env`):**
```
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 5.4 `frontend/lib/api.ts` — New and modified functions

**New — `saveEvent`:**

```typescript
export async function saveEvent(
  event: ParentEvent,
  authToken: string
): Promise<StoredEvent> {
  const res = await fetch(`${BASE_URL}/api/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
    },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Failed to save event");
  }
  return res.json();
}
```

**Modified — `getEvents`:** Add optional `authToken` parameter:

```typescript
export async function getEvents(
  fromDate?: string,
  toDate?: string,
  authToken?: string
): Promise<StoredEvent[]>
```

**Token pattern in pages:** `lib/api.ts` stays framework-agnostic (no hooks). Pages call `const { getToken } = useAuth()`, resolve `await getToken()`, and pass the string to API functions.

---

## 6. Data Flow

```
BROWSER                  NEXT.JS FRONTEND              FASTAPI BACKEND
───────                  ────────────────              ───────────────

visit /create_event
      │
      ▼
middleware.ts
no session cookie
      │
      ▼
redirect /login
      │
Clerk sign-in
      │ success
      ▼
session cookie set
redirect /create_event
      │
paste text + submit
      │
      ▼
extractEvent(text, token) ──────────────────────→  POST /api/v1/extract
                                                   auth.py: verify JWT
                                                   extraction.py: LLM
                          ←── ExtractResponse ──   → ParentEvent
      │
EventCard preview renders
      │
click "Confirm & Save"
      │
      ▼
saveEvent(event, token) ────────────────────────→  POST /api/v1/events
                                                   auth.py: verify JWT
                                                   uuid4 → StoredEvent
                                                   _USER_EVENTS[id] = event
                          ←── StoredEvent 201 ──
      │
"Saved ✓" state
"View in timeline →" link
      │
navigate /calendar
      │
getEvents(token) ───────────────────────────────→  GET /api/v1/events
                                                   SEED_EVENTS +
                                                   list(_USER_EVENTS.values())
                                                   sorted by start_time
                          ←── StoredEvent[] ────
      │
MonthCalendar + WeekTimeline
render all events including
the new saved event
```

---

## 7. Component Reuse Map

| Page | Unchanged | Modified | New |
|---|---|---|---|
| `/login` | — | `layout.tsx` | `login/page.tsx`, `middleware.ts` |
| `/create_event` | `ExtractForm` | `EventCard`, `create_event/page.tsx`, `api.ts` | — |
| `/calendar` | `MonthCalendar`, `WeekTimeline` | `calendar/page.tsx`, `api.ts` | — |
| Backend | `schemas.py`, `extraction.py`, `providers.py` | `events.py`, `main.py` | `auth.py` |

---

## 8. Files to Create or Modify

| File | Action | Summary |
|---|---|---|
| `frontend/app/login/page.tsx` | Create | Page shell + Clerk `<SignIn>` with Meadow appearance |
| `frontend/middleware.ts` | Create | Route protection via `clerkMiddleware` |
| `frontend/app/layout.tsx` | Modify | Add `<ClerkProvider>`; wrap `<nav>` in `<SignedIn>` |
| `frontend/components/EventCard.tsx` | Modify | Add `onSave` prop + Confirm & Save button states |
| `frontend/app/create_event/page.tsx` | Modify | Add save state management; wire `onSave` to `saveEvent()` |
| `frontend/app/calendar/page.tsx` | Modify | Heading → "Timeline"; `+ Extract event` button; empty state; auth token |
| `frontend/lib/api.ts` | Modify | Add `saveEvent()`; add `authToken` param to `getEvents()` |
| `backend/routers/events.py` | Modify | Add `_USER_EVENTS` dict; `POST /api/v1/events`; merged `GET` |
| `backend/auth.py` | Create | `require_clerk_auth` FastAPI dependency; JWKS fetch + decode |
| `backend/main.py` | Modify | Add `"Authorization"` to CORS `allow_headers` |
| `backend/requirements.txt` | Modify | Add `python-jose[cryptography]` |
| `frontend/.env.local` | Modify | Add Clerk env vars |
| `backend/.env` | Modify | Add `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |

---

## 9. Out of Scope for This MVP

- Email-forward ingestion
- Image / flyer upload (GPT-4o vision)
- iCal / Google Calendar export
- Provider subscription flow
- Edit or delete saved events
- Event persistence across backend restarts (Phase 2: Supabase Postgres)
- Multi-child profiles or household sharing

---

## 10. Verification Checklist

| Check | How to test |
|---|---|
| Login redirect | Visit `/create_event` without session → lands on `/login` |
| Auth success | Sign in → redirected to `/create_event` |
| Already signed in | Visit `/login` while authenticated → redirected to `/create_event` |
| Nav hidden on login | Login page shows logo only, no nav links |
| Extract works | Paste WhatsApp text → EventCard renders with event details |
| Confirm & Save | Click button → transitions through loading → "Saved ✓" |
| Save error | Kill backend → click save → red error banner appears |
| Timeline shows saved event | Navigate `/calendar` → new event appears in month grid dot and week chip |
| Seeds still visible | Seeds (evt-001 through evt-015) still appear alongside user events |
| Protected routes | `/calendar` without session → redirected to `/login` |
